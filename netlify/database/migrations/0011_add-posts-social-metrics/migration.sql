ALTER TABLE "posts" ADD COLUMN "buffer_post_id" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "social_views" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "social_metrics_synced_at" timestamp;
