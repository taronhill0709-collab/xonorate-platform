CREATE TYPE "public"."support_letter_request_status" AS ENUM('pending', 'answered', 'approved');--> statement-breakpoint
CREATE TABLE "support_letter_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"loved_one_id" uuid NOT NULL,
	"requested_by_user_id" uuid NOT NULL,
	"purpose" "support_letter_purpose" NOT NULL,
	"recipient_name" text,
	"invitee_name" text NOT NULL,
	"invitee_email" text NOT NULL,
	"personal_note" text,
	"token" text NOT NULL,
	"token_expires" timestamp NOT NULL,
	"answers" jsonb,
	"draft_content" text,
	"final_content" text,
	"status" "support_letter_request_status" DEFAULT 'pending' NOT NULL,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "support_letter_requests_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "support_letter_requests" ADD CONSTRAINT "support_letter_requests_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_letter_requests" ADD CONSTRAINT "support_letter_requests_loved_one_id_loved_ones_id_fk" FOREIGN KEY ("loved_one_id") REFERENCES "public"."loved_ones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_letter_requests" ADD CONSTRAINT "support_letter_requests_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;