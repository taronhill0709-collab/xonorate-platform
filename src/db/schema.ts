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
  "reviewing",
  "declined",
  "accepted",
]);

export const postTypeEnum = pgEnum("post_type", [
  "daily_roundup",
  "case_spotlight",
  "policy",
]);

export const postStatusEnum = pgEnum("post_status", ["pending", "published"]);

export const petitionStatusEnum = pgEnum("petition_status", ["draft", "published"]);

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
  photoUrl: text("photo_url"),
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const caseDocuments = pgTable("case_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: documentStatusEnum("status").notNull().default("needed"),
  fileUrl: text("file_url"),
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Site settings (singleton row) ---

export const siteSettings = pgTable("site_settings", {
  id: text("id").primaryKey().default("singleton"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  // Free text so it can read "6M+" or "6,000,000+" exactly as typed — the
  // homepage's "our impact" tally shows this as-is, not a computed number.
  // Null hides the stat entirely rather than showing a placeholder.
  socialViewsLabel: text("social_views_label"),
});

// --- Newsletter ---

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
