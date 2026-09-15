CREATE TYPE "public"."ask_question_status" AS ENUM('answered', 'needs_clarification', 'research_gap');--> statement-breakpoint
CREATE TYPE "public"."knowledge_source_kind" AS ENUM('statute', 'case_law', 'court_rule', 'constitutional_provision', 'government_publication', 'agency_guidance', 'academic_research', 'innocence_organization', 'other_authoritative');--> statement-breakpoint
CREATE TYPE "public"."knowledge_source_status" AS ENUM('draft', 'approved', 'outdated');--> statement-breakpoint
CREATE TABLE "ask_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"jurisdiction" text,
	"issue_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "ask_question_status" DEFAULT 'research_gap' NOT NULL,
	"short_answer" text,
	"answer_sections" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"needs_clarification" boolean DEFAULT false NOT NULL,
	"clarifying_questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cited_source_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"related_resource_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"related_case_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"related_investigation_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"flagged_for_review" boolean DEFAULT false NOT NULL,
	"flag_note" text,
	"session_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_knowledge_source_links" (
	"case_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	CONSTRAINT "case_knowledge_source_links_case_id_source_id_pk" PRIMARY KEY("case_id","source_id")
);
--> statement-breakpoint
CREATE TABLE "investigation_knowledge_source_links" (
	"investigation_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	CONSTRAINT "investigation_knowledge_source_links_investigation_id_source_id_pk" PRIMARY KEY("investigation_id","source_id")
);
--> statement-breakpoint
CREATE TABLE "knowledge_source_issue_links" (
	"source_id" uuid NOT NULL,
	"issue_tag" text NOT NULL,
	CONSTRAINT "knowledge_source_issue_links_source_id_issue_tag_pk" PRIMARY KEY("source_id","issue_tag")
);
--> statement-breakpoint
CREATE TABLE "knowledge_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"source_kind" "knowledge_source_kind" NOT NULL,
	"authority_tier" integer NOT NULL,
	"jurisdiction" text,
	"citation" text,
	"organization" text,
	"summary" text NOT NULL,
	"url" text,
	"publication_date" timestamp,
	"last_verified_at" timestamp,
	"verified_by" text,
	"status" "knowledge_source_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_investigation_links" (
	"resource_id" uuid NOT NULL,
	"investigation_id" uuid NOT NULL,
	CONSTRAINT "resource_investigation_links_resource_id_investigation_id_pk" PRIMARY KEY("resource_id","investigation_id")
);
--> statement-breakpoint
CREATE TABLE "resource_knowledge_source_links" (
	"resource_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	CONSTRAINT "resource_knowledge_source_links_resource_id_source_id_pk" PRIMARY KEY("resource_id","source_id")
);
--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "key_fact_stat" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "key_fact_label" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "key_fact_source_id" uuid;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "overview" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "why_it_matters" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "how_it_happens" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "what_to_know" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "what_to_look_for" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "xonorate_findings" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "disclaimer" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "questions_to_ask" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "what_you_can_do" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "reviewed_by" text;--> statement-breakpoint
ALTER TABLE "case_knowledge_source_links" ADD CONSTRAINT "case_knowledge_source_links_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_knowledge_source_links" ADD CONSTRAINT "case_knowledge_source_links_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investigation_knowledge_source_links" ADD CONSTRAINT "investigation_knowledge_source_links_investigation_id_investigations_id_fk" FOREIGN KEY ("investigation_id") REFERENCES "public"."investigations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investigation_knowledge_source_links" ADD CONSTRAINT "investigation_knowledge_source_links_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_source_issue_links" ADD CONSTRAINT "knowledge_source_issue_links_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_investigation_links" ADD CONSTRAINT "resource_investigation_links_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_investigation_links" ADD CONSTRAINT "resource_investigation_links_investigation_id_investigations_id_fk" FOREIGN KEY ("investigation_id") REFERENCES "public"."investigations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_knowledge_source_links" ADD CONSTRAINT "resource_knowledge_source_links_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_knowledge_source_links" ADD CONSTRAINT "resource_knowledge_source_links_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_key_fact_source_id_knowledge_sources_id_fk" FOREIGN KEY ("key_fact_source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE set null ON UPDATE no action;