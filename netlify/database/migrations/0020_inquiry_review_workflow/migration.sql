CREATE TABLE "inquiry_decision_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inquiry_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inquiry_follow_ups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inquiry_id" uuid NOT NULL,
	"request_id" uuid,
	"responses" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inquiry_info_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inquiry_id" uuid NOT NULL,
	"requested_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"requested_note" text,
	"requested_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inquiries" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "inquiries" ALTER COLUMN "status" SET DEFAULT 'new'::text;--> statement-breakpoint
UPDATE "inquiries" SET "status" = 'under_review' WHERE "status" = 'reviewing';--> statement-breakpoint
DROP TYPE "public"."inquiry_status";--> statement-breakpoint
CREATE TYPE "public"."inquiry_status" AS ENUM('new', 'needs_more_info', 'under_review', 'declined', 'accepted');--> statement-breakpoint
ALTER TABLE "inquiries" ALTER COLUMN "status" SET DEFAULT 'new'::"public"."inquiry_status";--> statement-breakpoint
ALTER TABLE "inquiries" ALTER COLUMN "status" SET DATA TYPE "public"."inquiry_status" USING "status"::"public"."inquiry_status";--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "info_requested_at" timestamp;--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "follow_up_token" text;--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "criteria_checklist" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "inquiry_decision_logs" ADD CONSTRAINT "inquiry_decision_logs_inquiry_id_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry_follow_ups" ADD CONSTRAINT "inquiry_follow_ups_inquiry_id_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry_follow_ups" ADD CONSTRAINT "inquiry_follow_ups_request_id_inquiry_info_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."inquiry_info_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry_info_requests" ADD CONSTRAINT "inquiry_info_requests_inquiry_id_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_follow_up_token_unique" UNIQUE("follow_up_token");