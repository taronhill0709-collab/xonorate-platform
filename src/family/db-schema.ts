// Xonorate Family — data model. Kept in its own module (re-exported from
// src/db/schema.ts, which drizzle-kit points at) so the Family domain's
// tables are easy to find as the feature grows, without splitting the
// drizzle-kit schema entry point itself.
import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  date,
  uuid,
  integer,
  boolean,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "@/db/schema";

// --- Enums ---

export const familyMemberRoleEnum = pgEnum("family_member_role", [
  "owner",
  "member",
]);

// "invited" members have no confirmed account access yet — see
// familyMembers.userId below. Nothing keyed to a family is visible to a
// membership row until it's "active".
export const familyMemberStatusEnum = pgEnum("family_member_status", [
  "invited",
  "active",
]);

// Applies to every uncertain date field on lovedOnes — families often don't
// know exact dates, and guessing silently would misrepresent their loved
// one's case. "unknown" is distinct from a null date: it means the family
// looked and couldn't find/recall it, not that the field was never visited.
export const dateConfidenceEnum = pgEnum("date_confidence", [
  "confirmed",
  "approximate",
  "unknown",
]);

export const familyDocumentCategoryEnum = pgEnum("family_document_category", [
  "court",
  "sentencing",
  "appeals",
  "prison",
  "parole",
  "clemency",
  "medical",
  "education",
  "employment",
  "identification",
  "reentry",
  "letters",
  "other",
]);

// Where a timeline event came from — "ai_extracted" is reserved for Phase 2
// (document-extraction); Phase 1 only ever writes "user".
export const timelineEventOriginEnum = pgEnum("timeline_event_origin", [
  "user",
  "ai_extracted",
]);

// "private" = only the author can see it; "family" = every active member of
// the family. "professional" (attorney/advocate sharing) is a planned third
// value once the professional layer exists — adding it later is just an enum
// value, not a schema change.
export const familyNoteVisibilityEnum = pgEnum("family_note_visibility", [
  "private",
  "family",
]);

export const familyCalendarEventTypeEnum = pgEnum(
  "family_calendar_event_type",
  [
    "visit",
    "court",
    "parole",
    "clemency",
    "release",
    "deposit",
    "call",
    "letter",
    "attorney_meeting",
    "application_deadline",
    "family_event",
    "custom",
  ],
);

// --- Families ---
// The account container. A family has many loved ones; a user can belong to
// many families (in-laws, blended families, someone active in more than one
// support network) — never assume 1:1 in either direction.

export const families = pgTable("families", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  // The user who created the family. Not the sole source of authorization
  // (see familyMembers) — this is provenance, not an access-control shortcut.
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// The access-control table. Membership here — not users.role — is what
// grants a user access to a family's data. users.role stays exactly the
// site-wide supporter/admin distinction it already was; it is never
// repurposed for family access.
export const familyMembers = pgTable(
  "family_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    // Nullable: an invited member may not have an Xonorate account yet.
    // Once they sign up/log in and redeem inviteToken, this gets filled in
    // and status flips to "active".
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    invitedEmail: text("invited_email"),
    role: familyMemberRoleEnum("role").notNull().default("member"),
    status: familyMemberStatusEnum("status").notNull().default("invited"),
    inviteToken: text("invite_token").unique(),
    inviteTokenExpires: timestamp("invite_token_expires"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    // Postgres unique indexes treat NULLs as distinct, so this only
    // prevents duplicates once userId is actually set — multiple pending
    // (userId null) invites can coexist before that.
    uniqueIndex("family_members_family_user_unique").on(
      table.familyId,
      table.userId,
    ),
  ],
);

// --- Loved Ones ---

export const lovedOnes = pgTable("loved_ones", {
  id: uuid("id").defaultRandom().primaryKey(),
  familyId: uuid("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  preferredName: text("preferred_name"),
  inmateId: text("inmate_id"),
  facilityId: uuid("facility_id").references(() => facilities.id, {
    onDelete: "set null",
  }),
  state: text("state"),

  // Case/sentence information — user-provided, never inferred. Each date
  // carries its own confidence flag rather than one blanket flag for the
  // whole profile, since a family might be certain of the conviction date
  // but only approximate on parole eligibility.
  arrestDate: date("arrest_date"),
  arrestDateConfidence: dateConfidenceEnum("arrest_date_confidence")
    .notNull()
    .default("unknown"),
  convictionDate: date("conviction_date"),
  convictionDateConfidence: dateConfidenceEnum("conviction_date_confidence")
    .notNull()
    .default("unknown"),
  sentenceLength: text("sentence_length"),
  // Free text, not an enum — statuses like "incarcerated" / "on parole" /
  // "released" / "in appeal" vary in phrasing families actually use; forcing
  // a fixed vocabulary here would misrepresent nuance an enum can't capture.
  currentStatus: text("current_status"),
  paroleEligibilityDate: date("parole_eligibility_date"),
  paroleEligibilityDateConfidence: dateConfidenceEnum(
    "parole_eligibility_date_confidence",
  )
    .notNull()
    .default("unknown"),
  paroleHearingDate: date("parole_hearing_date"),
  paroleHearingDateConfidence: dateConfidenceEnum(
    "parole_hearing_date_confidence",
  )
    .notNull()
    .default("unknown"),
  expectedReleaseDate: date("expected_release_date"),
  expectedReleaseDateConfidence: dateConfidenceEnum(
    "expected_release_date_confidence",
  )
    .notNull()
    .default("unknown"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Facilities ---
// Shared across families (not owned by one) so information about a given
// facility is entered once and reused. Structured fields plus a jsonb
// catch-all rather than hard-coding visitation/commissary rules into
// frontend components, per the "don't hard-code facility info" requirement.

export const facilities = pgTable("facilities", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  state: text("state").notNull(),
  mailingAddress: text("mailing_address"),
  phone: text("phone"),
  // { hours, dressCode, idRequirements, holidayRestrictions }
  visitationInfo: jsonb("visitation_info"),
  // { provider, accountSetupUrl, instructions }
  phoneProviderInfo: jsonb("phone_provider_info"),
  // { provider, accountSetupUrl, instructions }
  videoVisitationInfo: jsonb("video_visitation_info"),
  // { provider, instructions, depositUrl }
  commissaryInfo: jsonb("commissary_info"),
  // Whether this row has been checked against the facility's own published
  // rules. Unverified rows should always show a "verify with the facility"
  // notice in the UI rather than being presented as confirmed fact.
  verified: boolean("verified").notNull().default(false),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Documents ---
// Private by construction: unlike case-photo-storage.ts (public case
// photos), there is no public serving route for these. Access always goes
// through requireFamilyMember() — see src/family/authz.ts and
// src/family/storage/storage-service.ts.

export const familyDocuments = pgTable("family_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  familyId: uuid("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  // Nullable — some documents (e.g. a family's own ID) aren't about a
  // specific loved one.
  lovedOneId: uuid("loved_one_id").references(() => lovedOnes.id, {
    onDelete: "set null",
  }),
  uploadedByUserId: uuid("uploaded_by_user_id")
    .notNull()
    .references(() => users.id),
  category: familyDocumentCategoryEnum("category").notNull().default("other"),
  title: text("title").notNull(),
  // Key into the storage provider (see storage-service.ts) — never a public
  // URL.
  storageKey: text("storage_key").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  tags: jsonb("tags"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Timeline ---

export const timelineEvents = pgTable("timeline_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  lovedOneId: uuid("loved_one_id")
    .notNull()
    .references(() => lovedOnes.id, { onDelete: "cascade" }),
  // Free text (not an enum) — families need to log events beyond a fixed
  // list (arrest/trial/conviction/appeal/parole/release), including fully
  // custom ones; the UI offers common values as suggestions, not a closed
  // vocabulary.
  eventType: text("event_type").notNull(),
  eventDate: date("event_date").notNull(),
  description: text("description").notNull(),
  sourceDocumentId: uuid("source_document_id").references(
    () => familyDocuments.id,
    { onDelete: "set null" },
  ),
  origin: timelineEventOriginEnum("origin").notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Notes ---

export const familyNotes = pgTable("family_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  familyId: uuid("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  lovedOneId: uuid("loved_one_id").references(() => lovedOnes.id, {
    onDelete: "cascade",
  }),
  authorUserId: uuid("author_user_id")
    .notNull()
    .references(() => users.id),
  body: text("body").notNull(),
  visibility: familyNoteVisibilityEnum("visibility")
    .notNull()
    .default("family"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Support network ---

export const supportPeople = pgTable("support_people", {
  id: uuid("id").defaultRandom().primaryKey(),
  familyId: uuid("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  lovedOneId: uuid("loved_one_id").references(() => lovedOnes.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  relationship: text("relationship"),
  email: text("email"),
  phone: text("phone"),
  // Free text (e.g. "employer", "pastor", "attorney") rather than an enum —
  // the roles a support person plays are open-ended.
  role: text("role"),
  // Tag array (e.g. ["housing", "employment", "transportation"]) — same
  // pattern as cases.contributingFactorTags: an evolving vocabulary that
  // shouldn't require a migration to extend. This is what Phase 2's reentry
  // planner reads to know who can help with what.
  canHelpWith: jsonb("can_help_with"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Calendar ---

export const familyCalendarEvents = pgTable("family_calendar_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  familyId: uuid("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  lovedOneId: uuid("loved_one_id").references(() => lovedOnes.id, {
    onDelete: "cascade",
  }),
  type: familyCalendarEventTypeEnum("type").notNull().default("custom"),
  title: text("title").notNull(),
  eventDate: timestamp("event_date").notNull(),
  notes: text("notes"),
  // { channel: "email" | "sms" | "push", offsetDays: number } — provider
  // choice is deliberately not baked into the schema; Phase 2's notification
  // dispatch reads this and picks an implementation.
  reminderConfig: jsonb("reminder_config"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Audit log ---
// Polymorphic, same convention as `comments.targetType`/`targetId`. Every
// admin read of family data, and every sensitive family action (member
// invited/removed, document deleted, family deleted), writes a row here —
// see src/family/audit.ts.

export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorUserId: uuid("actor_user_id")
    .notNull()
    .references(() => users.id),
  // Snapshot of the actor's role at the time of the action — kept even if
  // users.role changes later, since this is a historical record.
  actorRole: text("actor_role").notNull(),
  // e.g. "family.created", "family.member.invited",
  // "family.document.viewed", "admin.family.viewed"
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  // Denormalized for fast "show all activity for this family" queries even
  // when targetType/targetId point at a child record (e.g. a document).
  familyId: uuid("family_id").references(() => families.id, {
    onDelete: "set null",
  }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Support Letters (Phase 2 — the first AI-assisted tool) ---

export const supportLetterPurposeEnum = pgEnum("support_letter_purpose", [
  "family",
  "character",
  "parole",
  "employer",
  "community",
  "faith_leader",
]);

// draft: the author is still answering guided questions, no AI draft yet.
// generated: AI has produced a draft from those answers.
// approved: the author has reviewed/edited and signed off — this is the
// version meant to actually be sent/printed.
export const supportLetterStatusEnum = pgEnum("support_letter_status", [
  "draft",
  "generated",
  "approved",
]);

export const supportLetters = pgTable("support_letters", {
  id: uuid("id").defaultRandom().primaryKey(),
  familyId: uuid("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  lovedOneId: uuid("loved_one_id")
    .notNull()
    .references(() => lovedOnes.id, { onDelete: "cascade" }),
  // The letter is written in this person's own voice/first person — only
  // they can edit or regenerate it (see src/family/support-letters.ts),
  // even though every active family member can read it once generated.
  authorUserId: uuid("author_user_id")
    .notNull()
    .references(() => users.id),
  purpose: supportLetterPurposeEnum("purpose").notNull(),
  // Free text (e.g. "Parole Board", "Jane Smith, Hiring Manager") — not
  // every purpose has a single named recipient, so this stays optional.
  recipientName: text("recipient_name"),
  // The author's guided-question answers — the ONLY factual material the
  // AI draft is allowed to draw on (see src/family/ai/ and docs/AI.md's
  // context rule). Shape varies by purpose; see
  // support-letters-types.ts's question sets.
  answers: jsonb("answers"),
  // The AI-generated draft, exactly as produced. Kept separate from
  // finalContent (rather than one shared column) so a fresh regeneration
  // is always distinguishable from the author's own edits — see
  // getLetterContent() in support-letters-types.ts and
  // regenerateSupportLetterDraft() in support-letters.ts, which
  // deliberately clears finalContent whenever this is rewritten.
  draftContent: text("draft_content"),
  // The author's edited version. Null until they've started editing;
  // once set, this (not draftContent) is what's shown/exported.
  finalContent: text("final_content"),
  status: supportLetterStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Support Letter Requests ---
// A family member invites someone OUTSIDE the family (an employer, a
// pastor, a friend) to write their own support letter. Deliberately a
// separate table from supportLetters, not a nullable-author variant of
// it: the invitee has no Xonorate account and no family membership by
// design (spec section 17/18 — "the person who is supposedly authoring
// the letter must have the opportunity to review and approve it," which
// only works if they can do so without signing up for anything). Access
// to a request's own answer/draft/approve flow is entirely by possession
// of `token` — no login, no family session — the same threat model as
// the existing public case-submission follow-up flow
// (inquiries.followUpToken). Once approved, it displays alongside
// self-authored supportLetters rows in the family's letters list (see
// the merge in src/app/family/[familyId]/letters/page.tsx) — two tables,
// one read-side view, rather than forcing both shapes into one table.

export const supportLetterRequestStatusEnum = pgEnum("support_letter_request_status", [
  "pending", // invite sent, invitee hasn't answered yet
  "answered", // invitee has answered and generated a draft, not yet approved
  "approved", // invitee approved their own letter — now part of the support packet
]);

// --- Reentry Planner (Phase 2 — the second AI-assisted tool) ---
// One plan per loved one, made up of a fixed row per category (created
// together — see ensureReentryPlanForLovedOne in reentry-plan.ts) rather
// than free-form rows a family adds one at a time. This is what makes the
// "you have X and Y but not Z" gap-detection from spec section 19 a plain
// query instead of something inferred after the fact from free text: every
// plan always has exactly one row per category, and that row's status is
// set directly by the family (or by AI suggestion), never derived.

export const reentryPlanCategoryEnum = pgEnum("reentry_plan_category", [
  "identification",
  "housing",
  "employment",
  "transportation",
  "education",
  "healthcare",
  "benefits",
  "finances",
  "family",
  "community",
  "legal_obligations",
]);

// Mirrors the COMPLETE / INCOMPLETE / NOT STARTED framing from the Parole
// Preparation spec section, which is meant to carry over here too.
export const reentryPlanCategoryStatusEnum = pgEnum(
  "reentry_plan_category_status",
  ["not_started", "incomplete", "complete"],
);

export const reentryPlans = pgTable(
  "reentry_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    lovedOneId: uuid("loved_one_id")
      .notNull()
      .references(() => lovedOnes.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    // One plan per loved one — ensureReentryPlanForLovedOne relies on this
    // to make plan creation idempotent rather than risking duplicates under
    // concurrent first-visits.
    uniqueIndex("reentry_plans_loved_one_unique").on(table.lovedOneId),
  ],
);

// Freeform 30/60/90-day content lives alongside status on the same row
// (not a separate task-list table) — per the approved spec, each category
// is one entry with a status plus its plan content across the three time
// horizons, not a checklist of independently-completable line items.
export const reentryPlanCategories = pgTable(
  "reentry_plan_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => reentryPlans.id, { onDelete: "cascade" }),
    category: reentryPlanCategoryEnum("category").notNull(),
    status: reentryPlanCategoryStatusEnum("status")
      .notNull()
      .default("not_started"),
    plan30Day: text("plan_30_day"),
    plan60Day: text("plan_60_day"),
    plan90Day: text("plan_90_day"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("reentry_plan_categories_plan_category_unique").on(
      table.planId,
      table.category,
    ),
  ],
);

// --- Parole Preparation (Phase 2 — the third tool) ---
// Deliberately NOT a self-contained checklist like the Reentry Planner.
// Per the approved spec, four of its eleven sections (Support Network,
// Support Letters, Documents, First 90 Days) are read-only rollups of
// data Family already has — supportPeople, supportLetters/
// supportLetterRequests filtered to purpose "parole", familyDocuments
// filtered to category "parole" (both enum values exist for exactly this
// reason), and the loved one's existing Reentry Plan. Only the remaining
// seven sections — ones with no parole-specific home elsewhere — get
// their own row here. See src/family/parole-preparation-types.ts for the
// full eleven-section list and which kind each one is.

export const paroleFreeformSectionEnum = pgEnum("parole_freeform_section", [
  "housing",
  "employment",
  "transportation",
  "education",
  "community_support",
  "personal_goals",
  "family_support",
]);

export const parolePreparations = pgTable(
  "parole_preparations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    lovedOneId: uuid("loved_one_id")
      .notNull()
      .references(() => lovedOnes.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("parole_preparations_loved_one_unique").on(table.lovedOneId),
  ],
);

// Reuses reentryPlanCategoryStatusEnum (not_started/incomplete/complete)
// rather than declaring a duplicate three-value enum — same shape, same
// meaning, no reason for a second Postgres type.
export const parolePreparationSections = pgTable(
  "parole_preparation_sections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    preparationId: uuid("preparation_id")
      .notNull()
      .references(() => parolePreparations.id, { onDelete: "cascade" }),
    section: paroleFreeformSectionEnum("section").notNull(),
    status: reentryPlanCategoryStatusEnum("status").notNull().default("not_started"),
    notes: text("notes"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("parole_preparation_sections_prep_section_unique").on(
      table.preparationId,
      table.section,
    ),
  ],
);

export const supportLetterRequests = pgTable("support_letter_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  familyId: uuid("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  lovedOneId: uuid("loved_one_id")
    .notNull()
    .references(() => lovedOnes.id, { onDelete: "cascade" }),
  // The family member who sent the request — not the letter's author.
  requestedByUserId: uuid("requested_by_user_id")
    .notNull()
    .references(() => users.id),
  purpose: supportLetterPurposeEnum("purpose").notNull(),
  recipientName: text("recipient_name"),
  // Free text — the invitee has no account, so this is provenance/display
  // only, never used for authorization (the token is).
  inviteeName: text("invitee_name").notNull(),
  inviteeEmail: text("invitee_email").notNull(),
  // An optional personal note from the requester shown to the invitee
  // (e.g. "This would mean a lot for John's parole hearing next month").
  personalNote: text("personal_note"),
  token: text("token").notNull().unique(),
  tokenExpires: timestamp("token_expires").notNull(),
  answers: jsonb("answers"),
  draftContent: text("draft_content"),
  finalContent: text("final_content"),
  status: supportLetterRequestStatusEnum("status").notNull().default("pending"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
