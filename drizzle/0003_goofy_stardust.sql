ALTER TABLE "user_coupons" DROP CONSTRAINT "user_coupons_stripe_coupon_id_unique";--> statement-breakpoint
ALTER TABLE "user_coupons" DROP CONSTRAINT "user_coupons_payment_id_payments_id_fk";
--> statement-breakpoint
ALTER TABLE "user_coupons" ADD COLUMN "membership_period_start" timestamp;--> statement-breakpoint
ALTER TABLE "user_coupons" ADD COLUMN "used_order_id" integer;--> statement-breakpoint
ALTER TABLE "user_coupons" ADD CONSTRAINT "user_coupons_used_order_id_orders_id_fk" FOREIGN KEY ("used_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_coupons_used_order_idx" ON "user_coupons" USING btree ("used_order_id");--> statement-breakpoint
ALTER TABLE "user_coupons" DROP COLUMN "stripe_coupon_id";--> statement-breakpoint
ALTER TABLE "user_coupons" DROP COLUMN "stripe_customer_id";--> statement-breakpoint
ALTER TABLE "user_coupons" DROP COLUMN "duration";--> statement-breakpoint
ALTER TABLE "user_coupons" DROP COLUMN "payment_id";--> statement-breakpoint
ALTER TABLE "user_coupons" ADD CONSTRAINT "user_coupons_coupon_code_unique" UNIQUE("coupon_code");