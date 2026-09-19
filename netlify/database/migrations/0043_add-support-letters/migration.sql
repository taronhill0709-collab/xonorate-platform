CREATE TYPE "public"."support_letter_purpose" AS ENUM('family', 'character', 'parole', 'employer', 'community', 'faith_leader');--> statement-breakpoint
CREATE TYPE "public"."support_letter_status" AS ENUM('draft', 'generated', 'approved');--> statement-breakpoint
CREATE TABLE "support_letters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"loved_one_id" uuid NOT NULL,
	"author_user_id" uuid NOT NULL,
	"purpose" "support_letter_purpose" NOT NULL,
	"recipient_name" text,
	"answers" jsonb,
	"draft_content" text,
	"final_content" text,
	"status" "support_letter_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_letters" ADD CONSTRAINT "support_letters_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_letters" ADD CONSTRAINT "support_letters_loved_one_id_loved_ones_id_fk" FOREIGN KEY ("loved_one_id") REFERENCES "public"."loved_ones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_letters" ADD CONSTRAINT "support_letters_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;