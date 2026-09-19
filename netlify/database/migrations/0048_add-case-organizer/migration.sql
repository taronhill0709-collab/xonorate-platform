CREATE TYPE "public"."family_case_issue_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."family_case_issue_status" AS ENUM('open', 'in_progress', 'waiting', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."family_case_person_type" AS ENUM('attorney', 'public_defender', 'private_attorney', 'family_member', 'witness', 'investigator', 'advocate', 'case_worker', 'facility_contact', 'other');--> statement-breakpoint
CREATE TYPE "public"."family_case_stage" AS ENUM('arrest', 'pretrial', 'trial', 'sentenced', 'direct_appeal', 'post_conviction', 'federal_review', 'clemency', 'parole', 'reentry', 'other', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."family_document_processing_status" AS ENUM('uploaded', 'needs_review', 'processed');--> statement-breakpoint
ALTER TYPE "public"."family_calendar_event_type" ADD VALUE 'hearing';--> statement-breakpoint
ALTER TYPE "public"."family_calendar_event_type" ADD VALUE 'appeal_deadline';--> statement-breakpoint
ALTER TYPE "public"."family_calendar_event_type" ADD VALUE 'filing_deadline';--> statement-breakpoint
ALTER TYPE "public"."family_document_category" ADD VALUE 'trial';--> statement-breakpoint
ALTER TYPE "public"."family_document_category" ADD VALUE 'post_conviction';--> statement-breakpoint
ALTER TYPE "public"."family_document_category" ADD VALUE 'transcripts';--> statement-breakpoint
ALTER TYPE "public"."family_document_category" ADD VALUE 'evidence';--> statement-breakpoint
ALTER TYPE "public"."family_document_category" ADD VALUE 'attorney_correspondence';--> statement-breakpoint
CREATE TABLE "family_case_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"loved_one_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "family_case_issue_status" DEFAULT 'open' NOT NULL,
	"priority" "family_case_issue_priority" DEFAULT 'medium' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"assigned_person_id" uuid,
	"related_document_id" uuid,
	"related_timeline_event_id" uuid,
	"due_date" date,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_case_people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"loved_one_id" uuid NOT NULL,
	"person_type" "family_case_person_type" DEFAULT 'other' NOT NULL,
	"name" text NOT NULL,
	"organization" text,
	"email" text,
	"phone" text,
	"relationship_to_case" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"loved_one_id" uuid NOT NULL,
	"case_label" text,
	"case_number" text,
	"jurisdiction" text,
	"court" text,
	"state" text,
	"stage" "family_case_stage" DEFAULT 'unknown' NOT NULL,
	"charges" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "timeline_events" ALTER COLUMN "event_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "family_calendar_events" ADD COLUMN "date_confidence" date_confidence DEFAULT 'confirmed' NOT NULL;--> statement-breakpoint
ALTER TABLE "family_documents" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "family_documents" ADD COLUMN "document_date" date;--> statement-breakpoint
ALTER TABLE "family_documents" ADD COLUMN "document_date_confidence" date_confidence DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "family_documents" ADD COLUMN "related_timeline_event_id" uuid;--> statement-breakpoint
ALTER TABLE "family_documents" ADD COLUMN "related_person_id" uuid;--> statement-breakpoint
ALTER TABLE "family_documents" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "family_documents" ADD COLUMN "processing_status" "family_document_processing_status" DEFAULT 'uploaded' NOT NULL;--> statement-breakpoint
ALTER TABLE "timeline_events" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "timeline_events" ADD COLUMN "date_confidence" date_confidence DEFAULT 'confirmed' NOT NULL;--> statement-breakpoint
ALTER TABLE "timeline_events" ADD COLUMN "related_person_id" uuid;--> statement-breakpoint
ALTER TABLE "timeline_events" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "timeline_events" ADD COLUMN "created_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "family_case_issues" ADD CONSTRAINT "family_case_issues_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_case_issues" ADD CONSTRAINT "family_case_issues_loved_one_id_loved_ones_id_fk" FOREIGN KEY ("loved_one_id") REFERENCES "public"."loved_ones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_case_issues" ADD CONSTRAINT "family_case_issues_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_case_issues" ADD CONSTRAINT "family_case_issues_assigned_person_id_family_case_people_id_fk" FOREIGN KEY ("assigned_person_id") REFERENCES "public"."family_case_people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_case_issues" ADD CONSTRAINT "family_case_issues_related_document_id_family_documents_id_fk" FOREIGN KEY ("related_document_id") REFERENCES "public"."family_documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_case_issues" ADD CONSTRAINT "family_case_issues_related_timeline_event_id_timeline_events_id_fk" FOREIGN KEY ("related_timeline_event_id") REFERENCES "public"."timeline_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_case_people" ADD CONSTRAINT "family_case_people_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_case_people" ADD CONSTRAINT "family_case_people_loved_one_id_loved_ones_id_fk" FOREIGN KEY ("loved_one_id") REFERENCES "public"."loved_ones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_cases" ADD CONSTRAINT "family_cases_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_cases" ADD CONSTRAINT "family_cases_loved_one_id_loved_ones_id_fk" FOREIGN KEY ("loved_one_id") REFERENCES "public"."loved_ones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "family_cases_loved_one_unique" ON "family_cases" USING btree ("loved_one_id");--> statement-breakpoint
ALTER TABLE "family_documents" ADD CONSTRAINT "family_documents_related_timeline_event_id_timeline_events_id_fk" FOREIGN KEY ("related_timeline_event_id") REFERENCES "public"."timeline_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_documents" ADD CONSTRAINT "family_documents_related_person_id_family_case_people_id_fk" FOREIGN KEY ("related_person_id") REFERENCES "public"."family_case_people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_related_person_id_family_case_people_id_fk" FOREIGN KEY ("related_person_id") REFERENCES "public"."family_case_people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;