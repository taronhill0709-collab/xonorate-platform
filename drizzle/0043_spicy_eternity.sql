CREATE TYPE "public"."reentry_plan_category" AS ENUM('identification', 'housing', 'employment', 'transportation', 'education', 'healthcare', 'benefits', 'finances', 'family', 'community', 'legal_obligations');--> statement-breakpoint
CREATE TYPE "public"."reentry_plan_category_status" AS ENUM('not_started', 'incomplete', 'complete');--> statement-breakpoint
CREATE TABLE "reentry_plan_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"category" "reentry_plan_category" NOT NULL,
	"status" "reentry_plan_category_status" DEFAULT 'not_started' NOT NULL,
	"plan_30_day" text,
	"plan_60_day" text,
	"plan_90_day" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reentry_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"loved_one_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reentry_plan_categories" ADD CONSTRAINT "reentry_plan_categories_plan_id_reentry_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."reentry_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reentry_plans" ADD CONSTRAINT "reentry_plans_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reentry_plans" ADD CONSTRAINT "reentry_plans_loved_one_id_loved_ones_id_fk" FOREIGN KEY ("loved_one_id") REFERENCES "public"."loved_ones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reentry_plan_categories_plan_category_unique" ON "reentry_plan_categories" USING btree ("plan_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX "reentry_plans_loved_one_unique" ON "reentry_plans" USING btree ("loved_one_id");