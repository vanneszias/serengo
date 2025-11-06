CREATE TABLE "find_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"find_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "find_comment" ADD CONSTRAINT "find_comment_find_id_find_id_fk" FOREIGN KEY ("find_id") REFERENCES "public"."find"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "find_comment" ADD CONSTRAINT "find_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;