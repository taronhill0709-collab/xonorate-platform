CREATE TABLE "supporter_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"recipient_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
