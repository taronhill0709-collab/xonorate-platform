CREATE TYPE "public"."content_opportunity" AS ENUM('news_brief', 'case_development', 'analysis', 'investigation', 'explainer', 'watch', 'resource');--> statement-breakpoint
CREATE TYPE "public"."content_source_target" AS ENUM('post');--> statement-breakpoint
CREATE TYPE "public"."editorial_signal" AS ENUM('high_priority', 'important', 'routine', 'duplicate', 'low_relevance');--> statement-breakpoint
CREATE TYPE "public"."intelligence_status" AS ENUM('new', 'reviewed', 'used', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."post_type" ADD VALUE 'news_brief';--> statement-breakpoint
ALTER TYPE "public"."post_type" ADD VALUE 'case_development';--> statement-breakpoint
ALTER TYPE "public"."post_type" ADD VALUE 'analysis';--> statement-breakpoint
ALTER TYPE "public"."post_type" ADD VALUE 'explainer';--> statement-breakpoint
ALTER TYPE "public"."post_type" ADD VALUE 'watch';--> statement-breakpoint
ALTER TYPE "public"."post_type" ADD VALUE 'resource';--> statement-breakpoint
CREATE TABLE "content_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intelligence_item_id" uuid NOT NULL,
	"target_type" "content_source_target" NOT NULL,
	"target_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intelligence_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"headline" text NOT NULL,
	"source_publication" text NOT NULL,
	"source_url" text NOT NULL,
	"source_image_url" text,
	"published_at" timestamp,
	"summary" text NOT NULL,
	"state" text,
	"county" text,
	"issue_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"suggested_case_id" uuid,
	"editorial_signal" "editorial_signal" DEFAULT 'routine' NOT NULL,
	"content_opportunity" "content_opportunity",
	"why_this_matters" text,
	"what_to_watch" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cluster_id" uuid,
	"status" "intelligence_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_case_links" (
	"post_id" uuid NOT NULL,
	"case_id" uuid NOT NULL,
	CONSTRAINT "post_case_links_post_id_case_id_pk" PRIMARY KEY("post_id","case_id")
);
--> statement-breakpoint
CREATE TABLE "post_issue_links" (
	"post_id" uuid NOT NULL,
	"issue_tag" text NOT NULL,
	CONSTRAINT "post_issue_links_post_id_issue_tag_pk" PRIMARY KEY("post_id","issue_tag")
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "why_this_matters" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "what_to_watch" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "content_sources" ADD CONSTRAINT "content_sources_intelligence_item_id_intelligence_items_id_fk" FOREIGN KEY ("intelligence_item_id") REFERENCES "public"."intelligence_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intelligence_items" ADD CONSTRAINT "intelligence_items_suggested_case_id_cases_id_fk" FOREIGN KEY ("suggested_case_id") REFERENCES "public"."cases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_case_links" ADD CONSTRAINT "post_case_links_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_case_links" ADD CONSTRAINT "post_case_links_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_issue_links" ADD CONSTRAINT "post_issue_links_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;