CREATE TYPE "public"."resource_category" AS ENUM('knowledge', 'legal', 'case_resource', 'advocacy', 'research', 'help_support');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('guide', 'tool', 'organization', 'legal_resource', 'research', 'report', 'data', 'court_resource', 'educational', 'advocacy', 'directory');--> statement-breakpoint
CREATE TABLE "resource_case_links" (
	"resource_id" uuid NOT NULL,
	"case_id" uuid NOT NULL,
	CONSTRAINT "resource_case_links_resource_id_case_id_pk" PRIMARY KEY("resource_id","case_id")
);
--> statement-breakpoint
CREATE TABLE "resource_issue_links" (
	"resource_id" uuid NOT NULL,
	"issue_tag" text NOT NULL,
	CONSTRAINT "resource_issue_links_resource_id_issue_tag_pk" PRIMARY KEY("resource_id","issue_tag")
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"category" "resource_category" NOT NULL,
	"subcategory" text,
	"resource_type" "resource_type" NOT NULL,
	"audiences" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"state" text,
	"organization" text,
	"author" text,
	"description" text NOT NULL,
	"body" text,
	"url" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"last_reviewed_at" timestamp,
	"status" "post_status" DEFAULT 'pending' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "resources_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "resource_case_links" ADD CONSTRAINT "resource_case_links_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_case_links" ADD CONSTRAINT "resource_case_links_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_issue_links" ADD CONSTRAINT "resource_issue_links_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;