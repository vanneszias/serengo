CREATE TABLE "location" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"location_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "find" ADD COLUMN "location_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "location" ADD CONSTRAINT "location_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "find" ADD CONSTRAINT "find_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "find" DROP COLUMN "latitude";--> statement-breakpoint
ALTER TABLE "find" DROP COLUMN "longitude";--> statement-breakpoint
ALTER TABLE "find" DROP COLUMN "location_name";