CREATE TYPE "public"."courier_provider_name" AS ENUM('postex');--> statement-breakpoint
CREATE TABLE "courier_webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" "courier_provider_name" NOT NULL,
	"order_id" text,
	"received_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "images" jsonb;--> statement-breakpoint
ALTER TABLE "courier_webhook_events" ADD CONSTRAINT "courier_webhook_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;