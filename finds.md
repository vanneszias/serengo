# Serengo "Finds" Feature - Implementation Specification

## Feature Overview

Add a "Finds" feature to Serengo that allows users to save, share, and discover location-based experiences. A Find represents a memorable place that users want to share with friends, complete with photos/videos, reviews, and precise location data.

## Core Concept

**What is a Find?**

- A user-created post about a specific location they've visited
- Contains: location coordinates, title, description/review, media (photos/videos), timestamp
- Shareable with friends and the Serengo community
- Displayed as interactive markers on the map

## Database Schema

Add the following tables to `src/lib/server/db/schema.ts`:

```typescript
export const find = pgTable('find', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	description: text('description'),
	latitude: numeric('latitude', { precision: 10, scale: 7 }).notNull(),
	longitude: numeric('longitude', { precision: 10, scale: 7 }).notNull(),
	locationName: text('location_name'), // e.g., "Café Belga, Brussels"
	category: text('category'), // e.g., "cafe", "restaurant", "park", "landmark"
	isPublic: boolean('is_public').default(true),
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
```

## UI Components to Create

### 1. FindsMap Component (`src/lib/components/FindsMap.svelte`)

- Extends the existing Map component
- Displays custom markers for Finds (different from location marker)
- Clicking a Find marker opens a FindPreview modal
- Shows only friends' Finds by default, with toggle for public Finds
- Clusters markers when zoomed out for better performance

### 2. CreateFindModal Component (`src/lib/components/CreateFindModal.svelte`)

- Modal that opens when user clicks "Create Find" button
- Form fields:
  - Title (required, max 100 chars)
  - Description/Review (optional, max 500 chars)
  - Location (auto-filled from user's current location, editable)
  - Category selector (dropdown)
  - Photo/Video upload (up to 5 files)
  - Privacy toggle (Public/Friends Only)
- Image preview grid with drag-to-reorder
- Submit creates Find and refreshes map

### 3. FindPreview Component (`src/lib/components/FindPreview.svelte`)

- Compact card showing Find details
- Image/video carousel
- Title, description, username, timestamp
- Like button with count
- Share button
- "Get Directions" button (opens in maps app)
- Edit/Delete buttons (if user owns the Find)

### 4. FindsList Component (`src/lib/components/FindsList.svelte`)

- Feed view of Finds (alternative to map view)
- Infinite scroll or pagination
- Filter by: Friends, Public, Category, Date range
- Sort by: Recent, Popular (most liked), Nearest

### 5. FindsFilter Component (`src/lib/components/FindsFilter.svelte`)

- Dropdown/sidebar with filters:
  - View: Friends Only / Public / My Finds
  - Category: All / Cafes / Restaurants / Parks / etc.
  - Distance: Within 1km / 5km / 10km / 50km / Any

## Routes to Add

### `/finds` - Main Finds page

- Server load: Fetch user's friends' Finds + public Finds within radius
- Toggle between Map view and List view
- "Create Find" floating action button
- Integrated FindsFilter component

### `/finds/[id]` - Individual Find detail page

- Full Find details with all photos/videos
- Comments section (future feature)
- Share button with social media integration
- Similar Finds nearby

### `/finds/create` - Create Find page (alternative to modal)

- Full-page form for creating a Find
- Better for mobile experience
- Can use when coming from external share (future feature)

### `/profile/[userId]/finds` - User's Finds profile

- Grid view of all user's Finds
- Can filter by category
- Private Finds only visible to owner

## API Endpoints

### `POST /api/finds` - Create Find

- Upload images/videos to storage (suggest Cloudflare R2 or similar)
- Create Find record in database
- Return created Find with media URLs

### `GET /api/finds?lat={lat}&lng={lng}&radius={km}` - Get nearby Finds

- Query Finds within radius of coordinates
- Filter by privacy settings and friendship status
- Return with user info and media

### `PATCH /api/finds/[id]` - Update Find

- Only owner can update
- Update title, description, category, privacy

### `DELETE /api/finds/[id]` - Delete Find

- Only owner can delete
- Cascade delete media files

### `POST /api/finds/[id]/like` - Like/Unlike Find

- Toggle like status
- Return updated like count

## File Upload Strategy with Cloudflare R2

**Using Cloudflare R2 (Free Tier: 10GB storage, 1M Class A ops/month, 10M Class B ops/month)**

### Setup Configuration

Create `src/lib/server/r2.ts`:

```typescript
import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
	GetObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
	R2_ACCOUNT_ID,
	R2_ACCESS_KEY_ID,
	R2_SECRET_ACCESS_KEY,
	R2_BUCKET_NAME
} from '$env/static/private';

export const r2Client = new S3Client({
	region: 'auto',
	endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: R2_ACCESS_KEY_ID,
		secretAccessKey: R2_SECRET_ACCESS_KEY
	}
});

export const R2_PUBLIC_URL = `https://pub-${R2_ACCOUNT_ID}.r2.dev`; // Configure custom domain for production

// Upload file to R2
export async function uploadToR2(file: File, path: string, contentType: string): Promise<string> {
	const buffer = Buffer.from(await file.arrayBuffer());

	await r2Client.send(
		new PutObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: path,
			Body: buffer,
			ContentType: contentType,
			// Cache control for PWA compatibility
			CacheControl: 'public, max-age=31536000, immutable'
		})
	);

	return `${R2_PUBLIC_URL}/${path}`;
}

// Delete file from R2
export async function deleteFromR2(path: string): Promise<void> {
	await r2Client.send(
		new DeleteObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: path
		})
	);
}

// Generate signed URL for temporary access (optional, for private files)
export async function getSignedR2Url(path: string, expiresIn = 3600): Promise<string> {
	const command = new GetObjectCommand({
		Bucket: R2_BUCKET_NAME,
		Key: path
	});

	return await getSignedUrl(r2Client, command, { expiresIn });
}
```

### Environment Variables

Add to `.env`:

```
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=serengo-finds
```

### Image Processing & Thumbnail Generation

Create `src/lib/server/media-processor.ts`:

```typescript
import sharp from 'sharp';
import { uploadToR2 } from './r2';

const THUMBNAIL_SIZE = 400;
const MAX_IMAGE_SIZE = 1920;

export async function processAndUploadImage(
	file: File,
	findId: string,
	index: number
): Promise<{ url: string; thumbnailUrl: string }> {
	const buffer = Buffer.from(await file.arrayBuffer());

	// Generate unique filename
	const timestamp = Date.now();
	const extension = file.name.split('.').pop();
	const filename = `finds/${findId}/image-${index}-${timestamp}`;

	// Process full-size image (resize if too large, optimize)
	const processedImage = await sharp(buffer)
		.resize(MAX_IMAGE_SIZE, MAX_IMAGE_SIZE, {
			fit: 'inside',
			withoutEnlargement: true
		})
		.jpeg({ quality: 85, progressive: true })
		.toBuffer();

	// Generate thumbnail
	const thumbnail = await sharp(buffer)
		.resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
			fit: 'cover',
			position: 'centre'
		})
		.jpeg({ quality: 80 })
		.toBuffer();

	// Upload both to R2
	const imageFile = new File([processedImage], `${filename}.jpg`, { type: 'image/jpeg' });
	const thumbFile = new File([thumbnail], `${filename}-thumb.jpg`, { type: 'image/jpeg' });

	const [url, thumbnailUrl] = await Promise.all([
		uploadToR2(imageFile, `${filename}.jpg`, 'image/jpeg'),
		uploadToR2(thumbFile, `${filename}-thumb.jpg`, 'image/jpeg')
	]);

	return { url, thumbnailUrl };
}

export async function processAndUploadVideo(
	file: File,
	findId: string,
	index: number
): Promise<{ url: string; thumbnailUrl: string }> {
	const timestamp = Date.now();
	const filename = `finds/${findId}/video-${index}-${timestamp}.mp4`;

	// Upload video directly (no processing on server to save resources)
	const url = await uploadToR2(file, filename, 'video/mp4');

	// For video thumbnail, generate on client-side or use placeholder
	// This keeps server-side processing minimal
	const thumbnailUrl = `/video-placeholder.jpg`; // Use static placeholder

	return { url, thumbnailUrl };
}
```

### PWA Service Worker Compatibility

Update `src/service-worker.ts` to handle R2 media:

```typescript
// Add to the existing service worker after the IMAGE_CACHE declaration

const R2_DOMAINS = [
	'pub-', // R2 public URLs pattern
	'r2.dev',
	'r2.cloudflarestorage.com'
];

// In the fetch event listener, update image handling:

// Handle R2 media with cache-first strategy
if (url.hostname.includes('r2.dev') || R2_DOMAINS.some((domain) => url.hostname.includes(domain))) {
	const cachedResponse = await imageCache.match(event.request);
	if (cachedResponse) {
		return cachedResponse;
	}

	try {
		const response = await fetch(event.request);
		if (response.ok) {
			// Cache R2 media for offline access
			imageCache.put(event.request, response.clone());
		}
		return response;
	} catch {
		// Return cached version or fallback
		return cachedResponse || new Response('Media not available offline', { status: 404 });
	}
}
```

### API Endpoint for Upload

Create `src/routes/api/finds/upload/+server.ts`:

```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { processAndUploadImage, processAndUploadVideo } from '$lib/server/media-processor';
import { generateUserId } from '$lib/server/auth'; // Reuse ID generation

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_FILES = 5;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const formData = await request.formData();
	const files = formData.getAll('files') as File[];
	const findId = (formData.get('findId') as string) || generateUserId(); // Generate if creating new Find

	if (files.length === 0 || files.length > MAX_FILES) {
		throw error(400, `Must upload between 1 and ${MAX_FILES} files`);
	}

	const uploadedMedia: Array<{ type: string; url: string; thumbnailUrl: string }> = [];

	for (let i = 0; i < files.length; i++) {
		const file = files[i];

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			throw error(400, `File ${file.name} exceeds maximum size of 100MB`);
		}

		// Process based on type
		if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
			const result = await processAndUploadImage(file, findId, i);
			uploadedMedia.push({ type: 'photo', ...result });
		} else if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
			const result = await processAndUploadVideo(file, findId, i);
			uploadedMedia.push({ type: 'video', ...result });
		} else {
			throw error(400, `File type ${file.type} not allowed`);
		}
	}

	return json({ findId, media: uploadedMedia });
};
```

### Client-Side Upload Component

Update `CreateFindModal.svelte` to handle uploads:

```typescript
async function handleFileUpload(files: FileList) {
	const formData = new FormData();

	Array.from(files).forEach((file) => {
		formData.append('files', file);
	});

	// If editing existing Find, include findId
	if (existingFindId) {
		formData.append('findId', existingFindId);
	}

	const response = await fetch('/api/finds/upload', {
		method: 'POST',
		body: formData
	});

	const result = await response.json();

	// Store result for Find creation
	uploadedMedia = result.media;
	generatedFindId = result.findId;
}
```

### R2 Bucket Configuration

**Important R2 Settings for PWA:**

1. **Public Access:** Enable public bucket access for `serengo-finds` bucket
2. **CORS Configuration:**

```json
[
	{
		"AllowedOrigins": ["https://serengo.ziasvannes.tech", "http://localhost:5173"],
		"AllowedMethods": ["GET", "HEAD"],
		"AllowedHeaders": ["*"],
		"MaxAgeSeconds": 3600
	}
]
```

3. **Custom Domain (Recommended):**
   - Point `media.serengo.ziasvannes.tech` to R2 bucket
   - Enables better caching and CDN integration
   - Update `R2_PUBLIC_URL` in r2.ts

4. **Cache Headers:** Files uploaded with `Cache-Control: public, max-age=31536000, immutable`
   - PWA service worker can cache indefinitely
   - Perfect for user-uploaded content that won't change

### Offline Support Strategy

**How PWA handles R2 media:**

1. **First Visit (Online):**
   - Finds and media load from R2
   - Service worker caches all media in `IMAGE_CACHE`
   - Thumbnails cached for fast list views

2. **Subsequent Visits (Online):**
   - Service worker serves from cache immediately (cache-first)
   - No network delay for previously viewed media

3. **Offline:**
   - All cached Finds and media available
   - New Find creation queued (implement with IndexedDB)
   - Upload when connection restored

### Cost Optimization

**R2 Free Tier Limits:**

- 10GB storage (≈ 10,000 high-quality photos or 100 videos)
- 1M Class A operations (write/upload)
- 10M Class B operations (read/download)

**Stay Within Free Tier:**

- Aggressive thumbnail generation (reduces bandwidth)
- Cache-first strategy (reduces reads)
- Lazy load images (only fetch what's visible)
- Compress images server-side (sharp optimization)
- Video uploads: limit to 100MB, encourage shorter clips

**Monitoring:**

- Track R2 usage in Cloudflare dashboard
- Alert at 80% of free tier limits
- Implement rate limiting on uploads (max 10 Finds/day per user)

## Map Integration

Update `src/lib/components/Map.svelte`:

- Add prop `finds?: Find[]` to display Find markers
- Create custom Find marker component with distinct styling
- Different marker colors for:
  - Your own Finds (blue)
  - Friends' Finds (green)
  - Public Finds (orange)
- Add clustering for better performance with many markers
- Implement marker click handler to open FindPreview modal

## Social Features (Phase 2)

### Friends System

- Add friend request functionality
- Accept/decline friend requests
- Friends list page
- Privacy settings respect friendship status

### Notifications

- Notify when friend creates a Find nearby
- Notify when someone likes your Find
- Notify on friend request

### Discovery Feed

- Trending Finds in your area
- Recommended Finds based on your history
- Explore by category

## Mobile Considerations

- FindsMap should be touch-friendly with proper zoom controls
- Create Find button as floating action button (FAB) for easy access
- Optimize image upload for mobile (compress before upload)
- Consider PWA features for photo capture
- Offline support: Queue Finds when offline, sync when online

## Security & Privacy

- Validate all user inputs (title, description lengths)
- Sanitize text content to prevent XSS
- Check ownership before allowing edit/delete
- Respect privacy settings in all queries
- Rate limit Find creation (e.g., max 20 per day)
- Implement CSRF protection (already in place)
- Validate file types and sizes on upload

## Performance Optimizations

- Lazy load images in FindsList and FindPreview
- Implement virtual scrolling for long lists
- Cache Find queries with stale-while-revalidate
- Use CDN for media files
- Implement marker clustering on map
- Paginate Finds feed (20-50 per page)
- Index database on: (latitude, longitude), userId, createdAt

## Styling Guidelines

- Use existing Serengo design system and components
- Find markers should be visually distinct from location marker
- Maintain newspaper-inspired aesthetic
- Use Washington font for Find titles
- Keep UI clean and uncluttered
- Smooth animations for modal open/close
- Skeleton loading states for Finds feed

## Success Metrics to Track

- Number of Finds created per user
- Photo/video upload rate
- Likes per Find
- Map engagement (clicks on Find markers)
- Share rate
- Friend connections made

## Implementation Priority

**Phase 1 (MVP):**

1. Database schema and migrations
2. Create Find functionality (with photos only)
3. FindsMap with markers
4. FindPreview modal
5. Basic Find feed

**Phase 2:** 6. Video support 7. Like functionality 8. Friends system 9. Enhanced filters and search 10. Share functionality

**Phase 3:** 11. Comments on Finds 12. Discovery feed 13. Notifications 14. Advanced analytics

## Example User Flow

1. User opens Serengo app and sees map with their friends' Finds
2. User visits a cool café and wants to share it
3. Clicks "Create Find" FAB button
4. Modal opens with their current location pre-filled
5. User adds title "Amazing Belgian Waffles at Café Belga"
6. Writes review: "Best waffles I've had in Brussels! Great atmosphere too."
7. Uploads 2 photos of the waffles and café interior
8. Selects category "Cafe" and keeps it Public
9. Clicks "Share Find"
10. Find appears on map as new marker
11. Friends see it in their feed and can like/save it
12. Friends can click marker to see details and get directions

---

## Next Steps

1. Run database migrations to create new tables
2. Implement basic Create Find API endpoint
3. Build CreateFindModal component
4. Update Map component to display Find markers
5. Test end-to-end flow
6. Iterate based on user feedback

This feature will transform Serengo from a simple location app into a social discovery platform where users share and explore unexpected places together.
