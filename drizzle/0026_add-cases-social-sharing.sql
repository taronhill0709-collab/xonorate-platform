ALTER TABLE "cases" ADD COLUMN "posted_to_social_at" timestamp;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "buffer_post_id" text;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "social_views" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "social_metrics_synced_at" timestamp;