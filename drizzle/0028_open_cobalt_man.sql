ALTER TABLE "cases" ADD COLUMN "county" text;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "race_ethnicity" text;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "sex" text;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "age_at_crime" integer;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "contributing_factor_tags" jsonb;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "dna_involved" boolean;