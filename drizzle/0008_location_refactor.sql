-- Create location table
CREATE TABLE "location" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign key constraint for location table
ALTER TABLE "location" ADD CONSTRAINT "location_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Migrate existing find data to location table and update find table
-- First, create locations from existing finds
INSERT INTO "location" ("id", "user_id", "latitude", "longitude", "created_at")
SELECT 
	'loc_' || "id" as "id",
	"user_id",
	"latitude",
	"longitude",
	"created_at"
FROM "find";
--> statement-breakpoint

-- Add location_id column to find table
ALTER TABLE "find" ADD COLUMN "location_id" text;
--> statement-breakpoint

-- Update find table to reference the new location entries
UPDATE "find" 
SET "location_id" = 'loc_' || "id";
--> statement-breakpoint

-- Make location_id NOT NULL
ALTER TABLE "find" ALTER COLUMN "location_id" SET NOT NULL;
--> statement-breakpoint

-- Add foreign key constraint
ALTER TABLE "find" ADD CONSTRAINT "find_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Drop the latitude and longitude columns from find table
ALTER TABLE "find" DROP COLUMN "latitude";
--> statement-breakpoint
ALTER TABLE "find" DROP COLUMN "longitude";
