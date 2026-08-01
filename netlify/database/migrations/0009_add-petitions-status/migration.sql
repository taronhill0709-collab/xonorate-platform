CREATE TYPE "public"."petition_status" AS ENUM('draft', 'published');--> statement-breakpoint
ALTER TABLE "petitions" ADD COLUMN "status" "petition_status" DEFAULT 'published' NOT NULL;
