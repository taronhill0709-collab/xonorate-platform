CREATE TYPE "public"."parole_freeform_section" AS ENUM('housing', 'employment', 'transportation', 'education', 'community_support', 'personal_goals', 'family_support');--> statement-breakpoint
CREATE TABLE "parole_preparation_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"preparation_id" uuid NOT NULL,
	"section" "parole_freeform_section" NOT NULL,
	"status" "reentry_plan_category_status" DEFAULT 'not_started' NOT NULL,
	"notes" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parole_preparations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"loved_one_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "parole_preparation_sections" ADD CONSTRAINT "parole_preparation_sections_preparation_id_parole_preparations_id_fk" FOREIGN KEY ("preparation_id") REFERENCES "public"."parole_preparations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parole_preparations" ADD CONSTRAINT "parole_preparations_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parole_preparations" ADD CONSTRAINT "parole_preparations_loved_one_id_loved_ones_id_fk" FOREIGN KEY ("loved_one_id") REFERENCES "public"."loved_ones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "parole_preparation_sections_prep_section_unique" ON "parole_preparation_sections" USING btree ("preparation_id","section");--> statement-breakpoint
CREATE UNIQUE INDEX "parole_preparations_loved_one_unique" ON "parole_preparations" USING btree ("loved_one_id");