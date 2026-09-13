import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// --- Enums ---

export const userRoleEnum = pgEnum("user_role", ["supporter", "admin"]);

export const caseStatusEnum = pgEnum("case_status", [
  "active_case",
  "exonerated",
  "awaiting_review",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "on_file",
  "needed",
]);

export const commentTargetEnum = pgEnum("comment_target", [
  "case",
  "petition",
  "post",
]);

export const commentStatusEnum = pgEnum("comment_status", [
  "published",
  "pending",
  "removed",
]);

export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "new",
  "needs_more_info",
  "under_review",
  "declined",
  "accepted",
]);

// "daily_roundup"/"case_spotlight"/"policy" are the original types — kept
// forever so already-published rows keep rendering. The rest are Xonorate
// Intelligence's content classifications (see intelligenceItems below):
// editors pick one of these when turning a discovered source into content
// via "Create With This". "investigation" is deliberately NOT a post type —
// a real investigation is a richer entity of its own (Investigation
// Builder, not yet built); until then, marking a source as an investigation
// opportunity just flags the intelligence item.
export const postTypeEnum = pgEnum("post_type", [
  "daily_roundup",
  "case_spotlight",
  "policy",
  "news_brief",
  "case_development",
  "analysis",
  "explainer",
  "watch",
  "resource",
]);

export const postStatusEnum = pgEnum("post_status", ["pending", "published"]);

// --- Xonorate Intelligence (discovery/triage pipeline) ---

// An editorial aid, not an automatic action — never gates publishing.
export const editorialSignalEnum = pgEnum("editorial_signal", [
  "high_priority",
  "important",
  "routine",
  "duplicate",
  "low_relevance",
]);

// What an editor (or the AI's suggestion) classifies a discovered source as
// becoming. Mirrors postTypeEnum's new values, plus "investigation" — see
// the note on postTypeEnum above for why that one doesn't map to a post.
export const contentOpportunityEnum = pgEnum("content_opportunity", [
  "news_brief",
  "case_development",
  "analysis",
  "investigation",
  "explainer",
  "watch",
  "resource",
]);

export const intelligenceStatusEnum = pgEnum("intelligence_status", [
  "new",
  "reviewed",
  "used",
  "rejected",
]);

export const contentSourceTargetEnum = pgEnum("content_source_target", ["post", "investigation"]);

// Xonorate's real editorial production workflow for an original
// investigation — distinct from postStatusEnum's simple pending/published,
// since an investigation lives through research and reporting stages before
// there's anything to approve.
export const investigationStatusEnum = pgEnum("investigation_status", [
  "idea",
  "researching",
  "in_reporting",
  "editorial_review",
  "ready_to_publish",
  "published",
  "updated",
]);

// Documents, interviews, and data are modeled as one table distinguished by
// `kind` rather than three near-identical tables — the Investigation
// Builder renders them as three filtered sections, but they share the same
// shape (a title, an optional file, and notes).
export const investigationMaterialKindEnum = pgEnum("investigation_material_kind", [
  "document",
  "interview",
  "data",
]);

export const petitionStatusEnum = pgEnum("petition_status", ["draft", "published"]);

export const generalInquiryStatusEnum = pgEnum("general_inquiry_status", [
  "new",
  "responded",
]);

export const videoPlatformEnum = pgEnum("video_platform", ["instagram", "facebook"]);

// --- Auth.js required tables (Drizzle adapter shape) ---

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").notNull().default("supporter"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// --- Cases ---

export const cases = pgTable("cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientName: text("client_name").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary").notNull(),
  // { charge, year, sentence, contributingFactors }
  convictionDetails: jsonb("conviction_details").notNull(),
  timeServed: text("time_served"),
  // { whatLedToExoneration, year } — null while case is still active
  exonerationDetails: jsonb("exoneration_details"),
  status: caseStatusEnum("status").notNull().default("awaiting_review"),
  state: text("state").notNull(),
  // County, demographic, and case-characteristic fields mirrored from the
  // National Registry of Exonerations' standard "Case Details" box — all
  // optional, since older/manually-entered cases often don't have them.
  county: text("county"),
  raceEthnicity: text("race_ethnicity"),
  sex: text("sex"),
  ageAtCrime: integer("age_at_crime"),
  // Standardized contributing-factor tags (see contributing-factors.ts) —
  // separate from convictionDetails.contributingFactors, which is free-text
  // narrative. Array of strings; null/empty until tagged.
  contributingFactorTags: jsonb("contributing_factor_tags"),
  // Whether DNA evidence contributed to the exoneration — null when
  // unknown/not documented, distinct from false ("documented as not DNA").
  dnaInvolved: boolean("dna_involved"),
  photoUrl: text("photo_url"),
  // false for a "spotlight" / public-awareness case we're featuring but
  // don't represent — shown with a distinguishing badge everywhere a case
  // card or case page renders, instead of blending in with actual clients.
  isClient: boolean("is_client").notNull().default(true),
  // Full attorney-confirmed evidence dossier, matching the standard
  // Xonorate campaign-brief template — null until that level of detail
  // exists for a case. Shape:
  // { stats: [{ value, label }], pullQuote: string,
  //   categories: [{ title, items: [{ title, body }] }] } — categories are
  // always the same four in order: Evidence of innocence, Newly discovered
  // evidence, Due-process violations, Unreliable evidence.
  innocenceClaim: jsonb("innocence_claim"),
  // The human cost beyond the conviction itself — what it did to this
  // person's family and to the surrounding community. Null until that
  // detail has been gathered for a case. Shape: { familyImpact: string,
  // communityImpact: string, stats: [{ value, label }] }
  impact: jsonb("impact"),
  // Raw page-view counter for the public case page — incremented on every
  // render, no dedup. Used to show the attention a case has gotten (we
  // don't secure exonerations ourselves, so this stands in for that).
  viewCount: integer("view_count").notNull().default(0),
  // Primary citation for this case — e.g. the National Registry of
  // Exonerations profile URL it was sourced/verified from. Shown publicly
  // for attribution on cases researched via the NRE candidate pipeline
  // (nre-case-research.ts); null for manually-entered client cases with no
  // single external source.
  sourceUrl: text("source_url"),
  // Social-sharing state — mirrors the fields the `posts` table used before
  // the public feed moved from posts to cases; the /admin/social tool now
  // shares exonerated cases instead of AI-drafted posts.
  // Set once this case has been pushed to Instagram/Facebook via Buffer —
  // guards the share button against firing twice for the same case.
  postedToSocialAt: timestamp("posted_to_social_at"),
  // Buffer's own ID for the update pushed to Instagram — needed to later ask
  // Buffer for that post's performance metrics. Null until posted.
  bufferPostId: text("buffer_post_id"),
  // Cached impressions count from Buffer, refreshed via the admin "Refresh
  // social metrics" action — Buffer's metrics only update ~daily on their
  // end, so this is never fetched live on a page render.
  socialViews: integer("social_views").notNull().default(0),
  socialMetricsSyncedAt: timestamp("social_metrics_synced_at"),
  // Admin-controlled display order (ascending) for the cases list and the
  // homepage's featured cases — lower sorts first. Ties (the common case,
  // since every row defaults to 0 until reordered) fall back to createdAt.
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Chronological staff-written narrative updates for a case's public
// "Case Developments" feed — distinct from petitionUpdates (petition-scoped
// only) and from the computed conviction/exoneration Case Timeline. Starts
// empty for every case; the section is hidden on the public page until the
// first entry exists.
export const caseUpdates = pgTable("case_updates", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  headline: text("headline").notNull(),
  body: text("body").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const caseDocuments = pgTable("case_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: documentStatusEnum("status").notNull().default("needed"),
  fileUrl: text("file_url"),
  // Most case_documents rows are attorney/court materials (affidavits,
  // medical records, forensic reports) Xonorate does not publish — this
  // table also holds a few genuinely public citations (a news article, an
  // official press release, the NRE profile) for cases entered before
  // `cases.sourceUrl` existed. Defaults to false (private) so a newly added
  // document never surfaces on the public case page by accident; an admin
  // must explicitly mark a specific row as a public source.
  isPublicSource: boolean("is_public_source").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Case videos (top-performing FB/IG clips) ---
// Curated social-video content showing the real-world attention a case has
// gotten. Distinct from the single postedToSocialAt/bufferPostId share flow
// on `cases` above (that publishes a static photo caption via Buffer, which
// has no video-asset support) — these videos are produced and posted through
// Xonorate Media's own separate workflow, so there's no Buffer post to read
// metrics from. Metrics are entered and refreshed by hand from Meta
// Business Suite, the same manual-sync spirit as the rest of this app's
// social numbers.

export const caseVideos = pgTable("case_videos", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  platform: videoPlatformEnum("platform").notNull(),
  postUrl: text("post_url").notNull(),
  title: text("title").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  views: integer("views").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  shares: integer("shares").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  metricsUpdatedAt: timestamp("metrics_updated_at"),
  // When this went up on Instagram/Facebook — optional, but enables the
  // "petition signers since post" stat (a live count of verified signatures
  // on this case's petition since this timestamp) wherever this video is shown.
  postedAt: timestamp("posted_at"),
  // Exactly one row across the whole platform should ever be true — enforced
  // in setHomepageFeaturedVideo (admin/cases/actions.ts), not at the DB
  // level. The homepage's "Seen everywhere" section shows this one video.
  isHomepageFeatured: boolean("is_homepage_featured").notNull().default(false),
  // Admin-controlled display order within a case (ascending) — the top slot
  // is the case page's main video; the rest render as the "more clips" grid.
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Petitions & signatures ---

export const petitions = pgTable("petitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  // nullable — general policy petitions aren't tied to one client
  caseId: uuid("case_id").references(() => cases.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  // Who this is addressed to — the specific person or body with power to
  // act (e.g. "Governor Mike DeWine", "Ohio Board of Pardons and Parole").
  // Null until staff fill it in; shown prominently when set so the ask
  // reads as a real demand on a real decision-maker, not a form into the void.
  recipientName: text("recipient_name"),
  askText: text("ask_text").notNull(),
  // Defaults to "published" at the column level so existing live petitions
  // aren't hidden by this migration — new petitions are created as "draft"
  // explicitly by the admin form instead.
  status: petitionStatusEnum("status").notNull().default("published"),
  goalCount: integer("goal_count").notNull().default(1000),
  // Signatures carried over from a prior campaign platform (not individual
  // records here) — added on top of this platform's own verified signature
  // count wherever a total is displayed, so migrated numbers and newly
  // collected ones both count.
  startingSignatureCount: integer("starting_signature_count")
    .notNull()
    .default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Progress log shown on the public petition page — "we delivered signatures
// to the DA's office," "we got a meeting," etc. This is what makes a
// petition read as a live campaign rather than a static form.
export const petitionUpdates = pgTable("petition_updates", {
  id: uuid("id").defaultRandom().primaryKey(),
  petitionId: uuid("petition_id")
    .notNull()
    .references(() => petitions.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const signatures = pgTable(
  "signatures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    petitionId: uuid("petition_id")
      .notNull()
      .references(() => petitions.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    comment: text("comment"),
    // Admin-highlighted sign-up notes show first under "Why people are
    // signing", ahead of normal recency order.
    commentPinned: boolean("comment_pinned").notNull().default(false),
    // double opt-in: signature doesn't count toward the public total until confirmed
    verified: boolean("verified").notNull().default(false),
    confirmToken: text("confirm_token"),
    confirmTokenExpires: timestamp("confirm_token_expires"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    // one confirmed signature per email per petition
    uniqueIndex("signatures_petition_email_idx").on(t.petitionId, t.email),
  ],
);

// --- Comments ---

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  targetType: commentTargetEnum("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  status: commentStatusEnum("status").notNull().default("pending"),
  ipAddress: text("ip_address"),
  // Admin-highlighted comments show first, ahead of normal recency order.
  pinned: boolean("pinned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Inquiries ---

export const inquiries = pgTable("inquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  submitterName: text("submitter_name").notNull(),
  submitterEmail: text("submitter_email").notNull(),
  relationshipToPerson: text("relationship_to_person").notNull(),
  personName: text("person_name").notNull(),
  caseSummary: text("case_summary").notNull(),
  state: text("state").notNull(),
  status: inquiryStatusEnum("status").notNull().default("new"),
  // Set each time staff send a "Request More Info" email — drives the
  // 14-day-overdue "needs follow-up" admin view. Cleared implicitly by the
  // status moving off needs_more_info (a fresh request overwrites it).
  infoRequestedAt: timestamp("info_requested_at"),
  // Bearer token embedded in the "Request More Info" email link — grants
  // access to the public follow-up form without an account. Regenerated on
  // every new request.
  followUpToken: text("follow_up_token").unique(),
  // Internal acceptance-criteria checklist, keyed by the ids in
  // src/lib/inquiry-criteria.ts. { [criterionKey]: boolean }
  criteriaChecklist: jsonb("criteria_checklist").notNull().default({}),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Logs one "Request More Info" send — what was asked, when, and by which
// admin. The submitter's answers land in inquiryFollowUps, not here.
export const inquiryInfoRequests = pgTable("inquiry_info_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  inquiryId: uuid("inquiry_id")
    .notNull()
    .references(() => inquiries.id, { onDelete: "cascade" }),
  // preset keys from src/lib/inquiry-info-requests.ts, e.g. ["court_documents"]
  requestedItems: jsonb("requested_items").notNull().default([]),
  requestedNote: text("requested_note"),
  requestedBy: text("requested_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// A submitter's answers to a follow-up request, linked back to the original
// inquiry rather than creating a duplicate submission.
export const inquiryFollowUps = pgTable("inquiry_follow_ups", {
  id: uuid("id").defaultRandom().primaryKey(),
  inquiryId: uuid("inquiry_id")
    .notNull()
    .references(() => inquiries.id, { onDelete: "cascade" }),
  requestId: uuid("request_id").references(() => inquiryInfoRequests.id, {
    onDelete: "set null",
  }),
  // { [presetKey]: string, other?: string }
  responses: jsonb("responses").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Timestamped internal notes on why a submission was accepted/declined/sent
// back for more info — an append-only log rather than one overwritable field.
export const inquiryDecisionLogs = pgTable("inquiry_decision_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  inquiryId: uuid("inquiry_id")
    .notNull()
    .references(() => inquiries.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- General inquiries (quick questions/contact messages, distinct from a
// full case submission above — no case details, no admin case-creation flow) ---

export const generalInquiries = pgTable("general_inquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  status: generalInquiryStatusEnum("status").notNull().default("new"),
  adminReply: text("admin_reply"),
  respondedAt: timestamp("responded_at"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Posts (daily blog / advocacy content) ---

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: postTypeEnum("type").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  body: text("body").notNull(), // markdown
  // [{ url, title }]
  sources: jsonb("sources").notNull().default([]),
  // Preview thumbnail — the og:image pulled from the first citable source
  // article at generation time. Null if none of the sources had one.
  imageUrl: text("image_url"),
  state: text("state"), // relevant for compensation-policy spotlight posts
  // set for case_spotlight posts — lets the daily job avoid re-spotlighting
  // the same case, and lets the post link back to it
  caseId: uuid("case_id").references(() => cases.id, { onDelete: "set null" }),
  status: postStatusEnum("status").notNull().default("pending"),
  autoGenerated: boolean("auto_generated").notNull().default(false),
  // AI-drafted editorial-aid fields, editable by the admin, carried over
  // from the originating intelligenceItems row when created via "Create
  // With This" — see contentSources for the source-provenance link itself.
  whyThisMatters: text("why_this_matters"),
  whatToWatch: jsonb("what_to_watch").notNull().default([]), // string[]
  publishedAt: timestamp("published_at"),
  // Set once this post has been pushed to Instagram/Facebook via Buffer —
  // guards the share button against firing twice for the same post.
  postedToSocialAt: timestamp("posted_to_social_at"),
  // Buffer's own ID for the update pushed to Instagram — needed to later ask
  // Buffer for that post's performance metrics. Null until posted.
  bufferPostId: text("buffer_post_id"),
  // Cached impressions count from Buffer, refreshed via the admin "Refresh
  // social metrics" action — Buffer's metrics only update ~daily on their
  // end, so this is never fetched live on a page render.
  socialViews: integer("social_views").notNull().default(0),
  socialMetricsSyncedAt: timestamp("social_metrics_synced_at"),
  // Admin-controlled display order (ascending) for the homepage and /posts
  // list — lower sorts first. Ties (the common case, since every row
  // defaults to 0 until reordered) fall back to publishedAt/createdAt.
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// A story the daily discovery pipeline found on the web — the individual
// unit Xonorate Intelligence triages, one per discovered article (not the
// old one-composite-article-a-day shape). Nothing here is public; an editor
// reviews it in /admin/intelligence and decides whether/how it becomes real
// Xonorate content via "Create With This".
export const intelligenceItems = pgTable("intelligence_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  headline: text("headline").notNull(),
  sourcePublication: text("source_publication").notNull(),
  sourceUrl: text("source_url").notNull(),
  // og:image pulled from the source article, same helper as posts.imageUrl —
  // null if the source has none or it couldn't be fetched.
  sourceImageUrl: text("source_image_url"),
  // The original article's publish date, when the discovery step found one —
  // distinct from createdAt (when Xonorate discovered it).
  publishedAt: timestamp("published_at"),
  summary: text("summary").notNull(),
  state: text("state"),
  county: text("county"),
  // Standardized issue tags matching CONTRIBUTING_FACTOR_TAGS — AI-suggested,
  // editor-correctable wherever this item is used.
  issueTags: jsonb("issue_tags").notNull().default([]), // string[]
  // AI's best-guess match against Xonorate's existing case roster, resolved
  // from a name the model returned (never a guessed ID) — see
  // content-pipeline.ts. Null when no existing case plausibly matches.
  suggestedCaseId: uuid("suggested_case_id").references(() => cases.id, {
    onDelete: "set null",
  }),
  editorialSignal: editorialSignalEnum("editorial_signal").notNull().default("routine"),
  // AI's suggested classification — an editorial aid, never binding; the
  // editor picks the actual type when they act on the item.
  contentOpportunity: contentOpportunityEnum("content_opportunity"),
  // AI-drafted "why this matters" — a draft the editor can accept, edit, or
  // discard, never presented as settled fact.
  whyThisMatters: text("why_this_matters"),
  // AI-suggested follow-ups worth watching for (a hearing, a ruling, an
  // appeal) — suggestions, not factual assertions. string[]
  whatToWatch: jsonb("what_to_watch").notNull().default([]),
  // Shared by same-event stories from different outlets, discovered in the
  // same run (see content-pipeline.ts's clusterKey) — groups them into one
  // "story cluster" in the admin instead of N separate opportunities. No FK:
  // it's just a shared grouping value, not a row of its own.
  clusterId: uuid("cluster_id"),
  status: intelligenceStatusEnum("status").notNull().default("new"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Provenance: which discovered source(s) informed a piece of Xonorate
// content — answers both "what is this based on" (shown on the content
// editor) and "where was this source used" (the Source Library's "Used in"
// column). Deliberately polymorphic (targetType/targetId: posts.id or
// investigations.id) rather than two near-identical join tables.
export const contentSources = pgTable("content_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  intelligenceItemId: uuid("intelligence_item_id")
    .notNull()
    .references(() => intelligenceItems.id, { onDelete: "cascade" }),
  targetType: contentSourceTargetEnum("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Multi-case / multi-issue connections for the new Intelligence-driven
// content types (news brief, case development, analysis, ...) — additive
// alongside posts.caseId, which stays as the original single-case
// case_spotlight relationship. A post can be connected to several cases
// (e.g. an analysis piece referencing multiple wrongful convictions).
export const postCaseLinks = pgTable(
  "post_case_links",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.caseId] })],
);

// issueTag matches CONTRIBUTING_FACTOR_TAGS/ISSUES' `tag` field — kept as
// plain text rather than an FK for the same reason cases.contributingFactorTags
// is: the issue taxonomy is a source file, not a DB table.
export const postIssueLinks = pgTable(
  "post_issue_links",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    issueTag: text("issue_tag").notNull(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.issueTag] })],
);

// --- Xonorate Investigations (Investigation Builder) ---
// Xonorate's highest editorial tier: original investigative work, distinct
// from the lighter `posts` content types. Kept as its own table (not another
// postType) since it carries its own production workflow and richer shape
// (thesis, timeline, materials) that a post row doesn't need.

export const investigations = pgTable("investigations", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  subtitle: text("subtitle"),
  summary: text("summary").notNull(),
  // The central question the investigation is examining — spec's "Thesis /
  // Central Question". Null while still an idea with nothing framed yet.
  thesis: text("thesis"),
  // The full narrative — Markdown, same convention as posts.body. Covers
  // spec's "What We Found"/"The Evidence"/"Why It Matters" as the editor's
  // own prose and headers rather than separate fields, matching how a post
  // is written. Null until there's a draft to publish.
  body: text("body"),
  status: investigationStatusEnum("status").notNull().default("idea"),
  heroImageUrl: text("hero_image_url"),
  // Internal production notes — never shown on the public investigation
  // page once one exists, distinct from the public-facing fields above.
  editorialNotes: text("editorial_notes"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// "THE TIMELINE" — relevant events the investigation has documented so far.
export const investigationTimelineEntries = pgTable("investigation_timeline_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  investigationId: uuid("investigation_id")
    .notNull()
    .references(() => investigations.id, { onDelete: "cascade" }),
  // Null when the exact date isn't pinned down yet — the entry still shows,
  // just without a date, rather than being blocked on research finishing.
  eventDate: timestamp("event_date"),
  title: text("title").notNull(),
  body: text("body"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// "DOCUMENTS" / "INTERVIEWS" / "DATA" — working materials for the
// investigation, distinguished by `kind`. Mirrors caseDocuments' shape
// (title/fileUrl/isPublicSource) rather than inventing a new one.
export const investigationMaterials = pgTable("investigation_materials", {
  id: uuid("id").defaultRandom().primaryKey(),
  investigationId: uuid("investigation_id")
    .notNull()
    .references(() => investigations.id, { onDelete: "cascade" }),
  kind: investigationMaterialKindEnum("kind").notNull(),
  title: text("title").notNull(),
  fileUrl: text("file_url"),
  notes: text("notes"),
  // Same default-private posture as caseDocuments.isPublicSource — most
  // investigation materials (records requests, interview notes) aren't
  // meant to be published verbatim.
  isPublicSource: boolean("is_public_source").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const investigationCaseLinks = pgTable(
  "investigation_case_links",
  {
    investigationId: uuid("investigation_id")
      .notNull()
      .references(() => investigations.id, { onDelete: "cascade" }),
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.investigationId, t.caseId] })],
);

export const investigationIssueLinks = pgTable(
  "investigation_issue_links",
  {
    investigationId: uuid("investigation_id")
      .notNull()
      .references(() => investigations.id, { onDelete: "cascade" }),
    issueTag: text("issue_tag").notNull(),
  },
  (t) => [primaryKey({ columns: [t.investigationId, t.issueTag] })],
);

// --- Site settings (singleton row) ---

export const siteSettings = pgTable("site_settings", {
  id: text("id").primaryKey().default("singleton"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  // Free text so it can read "6M+" or "6,000,000+" exactly as typed — the
  // homepage's "our impact" tally shows this as-is, not a computed number.
  // Null hides the stat entirely rather than showing a placeholder.
  socialViewsLabel: text("social_views_label"),
  // Shown in the homepage/About "Our founder" sections — deliberately
  // separate from any case's own photoUrl, since the founder may want a
  // different picture there than on his case page.
  founderPhotoUrl: text("founder_photo_url"),
  // The homepage hero's exhibit graphic — shows the RedactedPhoto
  // placeholder when null.
  heroImageUrl: text("hero_image_url"),
});

// --- Newsletter ---

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Ad-hoc broadcast email to every supporter (users.role = 'supporter') and
// newsletter subscriber — case wins, petition wins, major platform news.
// Unlike petitionUpdates, not tied to a single petition. recipientCount is a
// snapshot of how many were actually emailed at send time, not a live count.
export const supporterUpdates = pgTable("supporter_updates", {
  id: uuid("id").defaultRandom().primaryKey(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  recipientCount: integer("recipient_count").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Slug redirects ---
// When an admin changes a case or petition's slug, the previous value is
// kept here so links already shared elsewhere (social posts, emails, print
// materials, search results) redirect to the new URL instead of 404ing.

export const caseSlugHistory = pgTable("case_slug_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  oldSlug: text("old_slug").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const petitionSlugHistory = pgTable("petition_slug_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  petitionId: uuid("petition_id")
    .notNull()
    .references(() => petitions.id, { onDelete: "cascade" }),
  oldSlug: text("old_slug").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
