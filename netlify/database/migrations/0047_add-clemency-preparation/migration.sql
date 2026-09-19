ALTER TYPE "public"."support_letter_purpose" ADD VALUE 'clemency';--> statement-breakpoint
CREATE TABLE "clemency_accomplishments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"loved_one_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"achieved_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clemency_preparations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"loved_one_id" uuid NOT NULL,
	"narrative_draft_content" text,
	"narrative_final_content" text,
	"narrative_status" "support_letter_status" DEFAULT 'draft' NOT NULL,
	"attorney_questions_content" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clemency_accomplishments" ADD CONSTRAINT "clemency_accomplishments_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clemency_accomplishments" ADD CONSTRAINT "clemency_accomplishments_loved_one_id_loved_ones_id_fk" FOREIGN KEY ("loved_one_id") REFERENCES "public"."loved_ones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clemency_preparations" ADD CONSTRAINT "clemency_preparations_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clemency_preparations" ADD CONSTRAINT "clemency_preparations_loved_one_id_loved_ones_id_fk" FOREIGN KEY ("loved_one_id") REFERENCES "public"."loved_ones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "clemency_preparations_loved_one_unique" ON "clemency_preparations" USING btree ("loved_one_id");