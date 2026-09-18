CREATE TYPE "public"."date_confidence" AS ENUM('confirmed', 'approximate', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."family_calendar_event_type" AS ENUM('visit', 'court', 'parole', 'clemency', 'release', 'deposit', 'call', 'letter', 'attorney_meeting', 'application_deadline', 'family_event', 'custom');--> statement-breakpoint
CREATE TYPE "public"."family_document_category" AS ENUM('court', 'sentencing', 'appeals', 'prison', 'parole', 'clemency', 'medical', 'education', 'employment', 'identification', 'reentry', 'letters', 'other');--> statement-breakpoint
CREATE TYPE "public"."family_member_role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TYPE "public"."family_member_status" AS ENUM('invited', 'active');--> statement-breakpoint
CREATE TYPE "public"."family_note_visibility" AS ENUM('private', 'family');--> statement-breakpoint
CREATE TYPE "public"."timeline_event_origin" AS ENUM('user', 'ai_extracted');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"actor_role" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"family_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"state" text NOT NULL,
	"mailing_address" text,
	"phone" text,
	"visitation_info" jsonb,
	"phone_provider_info" jsonb,
	"video_visitation_info" jsonb,
	"commissary_info" jsonb,
	"verified" boolean DEFAULT false NOT NULL,
	"source_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "families" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"loved_one_id" uuid,
	"type" "family_calendar_event_type" DEFAULT 'custom' NOT NULL,
	"title" text NOT NULL,
	"event_date" timestamp NOT NULL,
	"notes" text,
	"reminder_config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"loved_one_id" uuid,
	"uploaded_by_user_id" uuid NOT NULL,
	"category" "family_document_category" DEFAULT 'other' NOT NULL,
	"title" text NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"tags" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"user_id" uuid,
	"invited_email" text,
	"role" "family_member_role" DEFAULT 'member' NOT NULL,
	"status" "family_member_status" DEFAULT 'invited' NOT NULL,
	"invite_token" text,
	"invite_token_expires" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "family_members_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "family_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"loved_one_id" uuid,
	"author_user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"visibility" "family_note_visibility" DEFAULT 'family' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loved_ones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"name" text NOT NULL,
	"preferred_name" text,
	"inmate_id" text,
	"facility_id" uuid,
	"state" text,
	"arrest_date" date,
	"arrest_date_confidence" date_confidence DEFAULT 'unknown' NOT NULL,
	"conviction_date" date,
	"conviction_date_confidence" date_confidence DEFAULT 'unknown' NOT NULL,
	"sentence_length" text,
	"current_status" text,
	"parole_eligibility_date" date,
	"parole_eligibility_date_confidence" date_confidence DEFAULT 'unknown' NOT NULL,
	"parole_hearing_date" date,
	"parole_hearing_date_confidence" date_confidence DEFAULT 'unknown' NOT NULL,
	"expected_release_date" date,
	"expected_release_date_confidence" date_confidence DEFAULT 'unknown' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"loved_one_id" uuid,
	"name" text NOT NULL,
	"relationship" text,
	"email" text,
	"phone" text,
	"role" text,
	"can_help_with" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loved_one_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"event_date" date NOT NULL,
	"description" text NOT NULL,
	"source_document_id" uuid,
	"origin" timeline_event_origin DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_calendar_events" ADD CONSTRAINT "family_calendar_events_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_calendar_events" ADD CONSTRAINT "family_calendar_events_loved_one_id_loved_ones_id_fk" FOREIGN KEY ("loved_one_id") REFERENCES "public"."loved_ones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_documents" ADD CONSTRAINT "family_documents_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_documents" ADD CONSTRAINT "family_documents_loved_one_id_loved_ones_id_fk" FOREIGN KEY ("loved_one_id") REFERENCES "public"."loved_ones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_documents" ADD CONSTRAINT "family_documents_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_notes" ADD CONSTRAINT "family_notes_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_notes" ADD CONSTRAINT "family_notes_loved_one_id_loved_ones_id_fk" FOREIGN KEY ("loved_one_id") REFERENCES "public"."loved_ones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_notes" ADD CONSTRAINT "family_notes_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loved_ones" ADD CONSTRAINT "loved_ones_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loved_ones" ADD CONSTRAINT "loved_ones_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_people" ADD CONSTRAINT "support_people_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_people" ADD CONSTRAINT "support_people_loved_one_id_loved_ones_id_fk" FOREIGN KEY ("loved_one_id") REFERENCES "public"."loved_ones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_loved_one_id_loved_ones_id_fk" FOREIGN KEY ("loved_one_id") REFERENCES "public"."loved_ones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_source_document_id_family_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."family_documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "family_members_family_user_unique" ON "family_members" USING btree ("family_id","user_id");