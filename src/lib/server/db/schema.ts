import { pgTable, integer, text, timestamp } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash'),
	googleId: text('google_id').unique(),
	profilePictureUrl: text('profile_picture_url')
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

// Finds feature tables
export const find = pgTable('find', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	description: text('description'),
	latitude: text('latitude').notNull(), // Using text for precision
	longitude: text('longitude').notNull(), // Using text for precision
	locationName: text('location_name'), // e.g., "Café Belga, Brussels"
	category: text('category'), // e.g., "cafe", "restaurant", "park", "landmark"
	isPublic: integer('is_public').default(1), // Using integer for boolean (1 = true, 0 = false)
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
});

export const findMedia = pgTable('find_media', {
	id: text('id').primaryKey(),
	findId: text('find_id')
		.notNull()
		.references(() => find.id, { onDelete: 'cascade' }),
	type: text('type').notNull(), // 'photo' or 'video'
	url: text('url').notNull(),
	thumbnailUrl: text('thumbnail_url'),
	fallbackUrl: text('fallback_url'), // JPEG fallback for WebP images
	fallbackThumbnailUrl: text('fallback_thumbnail_url'), // JPEG fallback for WebP thumbnails
	orderIndex: integer('order_index').default(0),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
});

export const findLike = pgTable('find_like', {
	id: text('id').primaryKey(),
	findId: text('find_id')
		.notNull()
		.references(() => find.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
});

export const friendship = pgTable('friendship', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	friendId: text('friend_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	status: text('status').notNull(), // 'pending', 'accepted', 'blocked'
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
});

// Type exports for the new tables
export type Find = typeof find.$inferSelect;
export type FindMedia = typeof findMedia.$inferSelect;
export type FindLike = typeof findLike.$inferSelect;
export type Friendship = typeof friendship.$inferSelect;

export type FindInsert = typeof find.$inferInsert;
export type FindMediaInsert = typeof findMedia.$inferInsert;
export type FindLikeInsert = typeof findLike.$inferInsert;
export type FriendshipInsert = typeof friendship.$inferInsert;
