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
  askText: text("ask_text").notNull(),
  goalCount: integer("goal_count").notNull().default(1000),
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
  state: text("state"), // relevant for compensation-policy spotlight posts
  // set for case_spotlight posts — lets the daily job avoid re-spotlighting
  // the same case, and lets the post link back to it
  caseId: uuid("case_id").references(() => cases.id, { onDelete: "set null" }),
  status: postStatusEnum("status").notNull().default("pending"),
  autoGenerated: boolean("auto_generated").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
