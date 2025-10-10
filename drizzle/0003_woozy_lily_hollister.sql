CREATE TABLE "find" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"location_name" text,
	"category" text,
	"is_public" integer DEFAULT 1,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "find_like" (
	"id" text PRIMARY KEY NOT NULL,
	"find_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "find_media" (
	"id" text PRIMARY KEY NOT NULL,
	"find_id" text NOT NULL,
	"type" text NOT NULL,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "friendship" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"friend_id" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "find" ADD CONSTRAINT "find_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "find_like" ADD CONSTRAINT "find_like_find_id_find_id_fk" FOREIGN KEY ("find_id") REFERENCES "public"."find"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "find_like" ADD CONSTRAINT "find_like_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "find_media" ADD CONSTRAINT "find_media_find_id_find_id_fk" FOREIGN KEY ("find_id") REFERENCES "public"."find"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_friend_id_user_id_fk" FOREIGN KEY ("friend_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;