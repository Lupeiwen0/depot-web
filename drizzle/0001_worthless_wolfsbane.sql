CREATE TYPE "public"."user_role" AS ENUM('admin', 'buyer');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "user_role" DEFAULT 'buyer' NOT NULL;