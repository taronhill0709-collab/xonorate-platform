CREATE TYPE "public"."video_platform" AS ENUM('instagram', 'facebook');--> statement-breakpoint
CREATE TABLE "case_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"platform" "video_platform" NOT NULL,
	"post_url" text NOT NULL,
	"title" text NOT NULL,
	"thumbnail_url" text,
	"views" integer DEFAULT 0 NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"shares" integer DEFAULT 0 NOT NULL,
	"comments" integer DEFAULT 0 NOT NULL,
	"metrics_updated_at" timestamp,
	"posted_at" timestamp,
	"is_homepage_featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "case_videos" ADD CONSTRAINT "case_videos_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;