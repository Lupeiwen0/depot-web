CREATE TYPE "public"."user_status" AS ENUM('active', 'disabled', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."coupon_status" AS ENUM('available', 'used', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('active', 'canceled', 'expired', 'pending');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'succeeded', 'failed', 'refunded', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('one_time', 'subscription');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('one_time', 'subscription');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('published', 'hidden', 'deleted');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"stripe_payment_intent_id" text,
	"stripe_invoice_id" text,
	"stripe_subscription_id" text,
	"stripe_checkout_session_id" text,
	"payment_type" "payment_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'hkd' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"order_id" integer,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_stripe_checkout_session_id_unique" UNIQUE("stripe_checkout_session_id")
);
--> statement-breakpoint
CREATE TABLE "product_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"product_id" integer NOT NULL,
	"order_id" integer,
	"rating" integer NOT NULL,
	"title" text,
	"content" text,
	"images" text[],
	"status" "review_status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#3b82f6',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_tags_name_unique" UNIQUE("name"),
	CONSTRAINT "product_tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "stripe_webhook_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" text NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"processed_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_webhook_logs_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "user_coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"stripe_coupon_id" text NOT NULL,
	"coupon_code" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"percent_off" integer DEFAULT 10 NOT NULL,
	"duration" text DEFAULT 'once' NOT NULL,
	"status" "coupon_status" DEFAULT 'available' NOT NULL,
	"used_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"membership_id" integer,
	"payment_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_coupons_stripe_coupon_id_unique" UNIQUE("stripe_coupon_id")
);
--> statement-breakpoint
CREATE TABLE "user_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"stripe_price_id" text NOT NULL,
	"status" "membership_status" DEFAULT 'pending' NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at" timestamp,
	"canceled_at" timestamp,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_memberships_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "user_stripe_customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_stripe_customers_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "user_stripe_customers_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "price" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "status" "user_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "disabled_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "disabled_reason" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "deleted_by_user" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_type" "product_type" DEFAULT 'one_time' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stripe_product_id" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stripe_price_id" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stripe_payment_link_url" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tags" text[];--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sales_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "average_rating" numeric(3, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "review_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_coupons" ADD CONSTRAINT "user_coupons_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_coupons" ADD CONSTRAINT "user_coupons_membership_id_user_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."user_memberships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_coupons" ADD CONSTRAINT "user_coupons_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_memberships" ADD CONSTRAINT "user_memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stripe_customers" ADD CONSTRAINT "user_stripe_customers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_reviews_order_product_idx" ON "product_reviews" USING btree ("order_id","product_id");--> statement-breakpoint
CREATE INDEX "product_reviews_product_status_idx" ON "product_reviews" USING btree ("product_id","status");--> statement-breakpoint
CREATE INDEX "product_reviews_user_id_idx" ON "product_reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_coupons_user_status_expires_idx" ON "user_coupons" USING btree ("user_id","status","expires_at");--> statement-breakpoint
CREATE INDEX "user_memberships_user_id_idx" ON "user_memberships" USING btree ("user_id");