CREATE TYPE "public"."general_inquiry_status" AS ENUM('new', 'responded');--> statement-breakpoint
CREATE TABLE "general_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"message" text NOT NULL,
	"status" "general_inquiry_status" DEFAULT 'new' NOT NULL,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
