import { pgTable, integer, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

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

// Location table - represents geographical points where finds can be made
export const location = pgTable('location', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	latitude: text('latitude').notNull(), // Using text for precision
	longitude: text('longitude').notNull(), // Using text for precision
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
});

// Find table - represents posts/content made at a location
export const find = pgTable('find', {
	id: text('id').primaryKey(),
	locationId: text('location_id')
		.notNull()
		.references(() => location.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	description: text('description'),
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

export const findComment = pgTable('find_comment', {
	id: text('id').primaryKey(),
	findId: text('find_id')
		.notNull()
		.references(() => find.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	content: text('content').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
});

// Notification system tables
export const notification = pgTable('notification', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	type: text('type').notNull(), // 'friend_request', 'friend_accepted', 'find_liked', 'find_commented'
	title: text('title').notNull(),
	message: text('message').notNull(),
	data: jsonb('data'), // Additional context data (findId, friendId, etc.)
	isRead: boolean('is_read').default(false),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
});

export const notificationSubscription = pgTable('notification_subscription', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	endpoint: text('endpoint').notNull(),
	p256dhKey: text('p256dh_key').notNull(),
	authKey: text('auth_key').notNull(),
	userAgent: text('user_agent'),
	isActive: boolean('is_active').default(true),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
});

export const notificationPreferences = pgTable('notification_preferences', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	friendRequests: boolean('friend_requests').default(true),
	friendAccepted: boolean('friend_accepted').default(true),
	findLiked: boolean('find_liked').default(true),
	findCommented: boolean('find_commented').default(true),
	pushEnabled: boolean('push_enabled').default(true),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull()
});

// Type exports for the tables
export type Location = typeof location.$inferSelect;
export type Find = typeof find.$inferSelect;
export type FindMedia = typeof findMedia.$inferSelect;
export type FindLike = typeof findLike.$inferSelect;
export type FindComment = typeof findComment.$inferSelect;
export type Friendship = typeof friendship.$inferSelect;
export type Notification = typeof notification.$inferSelect;
export type NotificationSubscription = typeof notificationSubscription.$inferSelect;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;

export type LocationInsert = typeof location.$inferInsert;
export type FindInsert = typeof find.$inferInsert;
export type FindMediaInsert = typeof findMedia.$inferInsert;
export type FindLikeInsert = typeof findLike.$inferInsert;
export type FindCommentInsert = typeof findComment.$inferInsert;
export type FriendshipInsert = typeof friendship.$inferInsert;
export type NotificationInsert = typeof notification.$inferInsert;
export type NotificationSubscriptionInsert = typeof notificationSubscription.$inferInsert;
export type NotificationPreferencesInsert = typeof notificationPreferences.$inferInsert;
