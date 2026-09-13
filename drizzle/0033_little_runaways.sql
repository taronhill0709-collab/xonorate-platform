CREATE TYPE "public"."investigation_material_kind" AS ENUM('document', 'interview', 'data');--> statement-breakpoint
CREATE TYPE "public"."investigation_status" AS ENUM('idea', 'researching', 'in_reporting', 'editorial_review', 'ready_to_publish', 'published', 'updated');--> statement-breakpoint
ALTER TYPE "public"."content_source_target" ADD VALUE 'investigation';--> statement-breakpoint
CREATE TABLE "investigation_case_links" (
	"investigation_id" uuid NOT NULL,
	"case_id" uuid NOT NULL,
	CONSTRAINT "investigation_case_links_investigation_id_case_id_pk" PRIMARY KEY("investigation_id","case_id")
);
--> statement-breakpoint
CREATE TABLE "investigation_issue_links" (
	"investigation_id" uuid NOT NULL,
	"issue_tag" text NOT NULL,
	CONSTRAINT "investigation_issue_links_investigation_id_issue_tag_pk" PRIMARY KEY("investigation_id","issue_tag")
);
--> statement-breakpoint
CREATE TABLE "investigation_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"investigation_id" uuid NOT NULL,
	"kind" "investigation_material_kind" NOT NULL,
	"title" text NOT NULL,
	"file_url" text,
	"notes" text,
	"is_public_source" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investigation_timeline_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"investigation_id" uuid NOT NULL,
	"event_date" timestamp,
	"title" text NOT NULL,
	"body" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investigations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"subtitle" text,
	"summary" text NOT NULL,
	"thesis" text,
	"status" "investigation_status" DEFAULT 'idea' NOT NULL,
	"hero_image_url" text,
	"editorial_notes" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "investigations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "investigation_case_links" ADD CONSTRAINT "investigation_case_links_investigation_id_investigations_id_fk" FOREIGN KEY ("investigation_id") REFERENCES "public"."investigations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investigation_case_links" ADD CONSTRAINT "investigation_case_links_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investigation_issue_links" ADD CONSTRAINT "investigation_issue_links_investigation_id_investigations_id_fk" FOREIGN KEY ("investigation_id") REFERENCES "public"."investigations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investigation_materials" ADD CONSTRAINT "investigation_materials_investigation_id_investigations_id_fk" FOREIGN KEY ("investigation_id") REFERENCES "public"."investigations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investigation_timeline_entries" ADD CONSTRAINT "investigation_timeline_entries_investigation_id_investigations_id_fk" FOREIGN KEY ("investigation_id") REFERENCES "public"."investigations"("id") ON DELETE cascade ON UPDATE no action;