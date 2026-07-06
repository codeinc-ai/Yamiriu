CREATE TYPE "public"."analytics_event_name" AS ENUM('outfit_builder_opened', 'outfit_item_selected', 'outfit_added_to_cart');--> statement-breakpoint
CREATE TABLE "banners" (
	"id" text PRIMARY KEY NOT NULL,
	"image_url" text NOT NULL,
	"link_url" text,
	"title" text,
	"active" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event" "analytics_event_name" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "gift_card_code" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "gift_card_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL;