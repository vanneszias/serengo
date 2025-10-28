import { writable, derived, type Readable, type Writable } from 'svelte/store';
import { toast } from 'svelte-sonner';

// Core types for the API sync system
export interface EntityState<T = unknown> {
	data: T;
	isLoading: boolean;
	error: string | null;
	lastUpdated: Date;
}

export interface QueuedOperation {
	id: string;
	entityType: string;
	entityId: string;
	operation: 'create' | 'update' | 'delete';
	action?: string;
	data?: unknown;
	retry: number;
	maxRetries: number;
	timestamp: Date;
}

export interface APIResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	[key: string]: unknown;
}

// Specific entity state types
export interface FindLikeState {
	isLiked: boolean;
	likeCount: number;
	isLoading: boolean;
	error: string | null;
}

export interface FindState {
	id: string;
	title: string;
	description?: string;
	latitude: string;
	longitude: string;
	locationName?: string;
	category?: string;
	isPublic: boolean;
	createdAt: Date;
	userId: string;
	username: string;
	profilePictureUrl?: string;
	media?: Array<{
		id: string;
		findId: string;
		type: string;
		url: string;
		thumbnailUrl: string | null;
		orderIndex: number | null;
	}>;
	isLikedByUser: boolean;
	likeCount: number;
	isFromFriend: boolean;
}

// Generate unique operation IDs
function generateOperationId(): string {
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create operation key for deduplication
function createOperationKey(
	entityType: string,
	entityId: string,
	operation: string,
	action?: string
): string {
	return `${entityType}:${entityId}:${operation}${action ? `:${action}` : ''}`;
}

class APISync {
	// Entity stores - each entity type has its own store
	private entityStores = new Map<string, Writable<Map<string, EntityState>>>();

	// Operation queue for API calls
	private operationQueue = new Map<string, QueuedOperation>();
	private processingQueue = false;

	// Cleanup tracking for memory management
	private subscriptions = new Map<string, Set<() => void>>();

	constructor() {
		// Initialize core entity stores
		this.initializeEntityStore('find');
		this.initializeEntityStore('user');
		this.initializeEntityStore('friendship');

		// Start processing queue
		this.startQueueProcessor();
	}

	private initializeEntityStore(entityType: string): void {
		if (!this.entityStores.has(entityType)) {
			this.entityStores.set(entityType, writable(new Map<string, EntityState>()));
		}
	}

	private getEntityStore(entityType: string): Writable<Map<string, EntityState>> {
		this.initializeEntityStore(entityType);
		return this.entityStores.get(entityType)!;
	}

	/**
	 * Subscribe to a specific entity's state
	 */
	subscribe<T>(entityType: string, entityId: string): Readable<EntityState<T>> {
		const store = this.getEntityStore(entityType);

		return derived(store, ($entities) => {
			const entity = $entities.get(entityId);
			if (!entity) {
				// Return default state if entity doesn't exist
				return {
					data: null as T,
					isLoading: false,
					error: null,
					lastUpdated: new Date()
				};
			}
			return entity as EntityState<T>;
		});
	}

	/**
	 * Subscribe specifically to find like state
	 */
	subscribeFindLikes(findId: string): Readable<FindLikeState> {
		const store = this.getEntityStore('find');

		return derived(store, ($entities) => {
			const entity = $entities.get(findId);
			if (!entity || !entity.data) {
				return {
					isLiked: false,
					likeCount: 0,
					isLoading: false,
					error: null
				};
			}

			const findData = entity.data as FindState;
			return {
				isLiked: findData.isLikedByUser,
				likeCount: findData.likeCount,
				isLoading: entity.isLoading,
				error: entity.error
			};
		});
	}

	/**
	 * Initialize entity state with server data
	 */
	setEntityState<T>(entityType: string, entityId: string, data: T, isLoading = false): void {
		const store = this.getEntityStore(entityType);

		store.update(($entities) => {
			const newEntities = new Map($entities);
			newEntities.set(entityId, {
				data,
				isLoading,
				error: null,
				lastUpdated: new Date()
			});
			return newEntities;
		});
	}

	/**
	 * Update entity loading state
	 */
	private setEntityLoading(entityType: string, entityId: string, isLoading: boolean): void {
		const store = this.getEntityStore(entityType);

		store.update(($entities) => {
			const newEntities = new Map($entities);
			const existing = newEntities.get(entityId);
			if (existing) {
				newEntities.set(entityId, {
					...existing,
					isLoading
				});
			}
			return newEntities;
		});
	}

	/**
	 * Update entity error state
	 */
	private setEntityError(entityType: string, entityId: string, error: string): void {
		const store = this.getEntityStore(entityType);

		store.update(($entities) => {
			const newEntities = new Map($entities);
			const existing = newEntities.get(entityId);
			if (existing) {
				newEntities.set(entityId, {
					...existing,
					isLoading: false,
					error
				});
			}
			return newEntities;
		});
	}

	/**
	 * Queue an operation for processing
	 */
	async queueOperation(
		entityType: string,
		entityId: string,
		operation: 'create' | 'update' | 'delete',
		action?: string,
		data?: Record<string, unknown>
	): Promise<void> {
		const operationKey = createOperationKey(entityType, entityId, operation, action);

		// Check if same operation is already queued
		if (this.operationQueue.has(operationKey)) {
			console.log(`Operation ${operationKey} already queued, skipping duplicate`);
			return;
		}

		const queuedOperation: QueuedOperation = {
			id: generateOperationId(),
			entityType,
			entityId,
			operation,
			action,
			data,
			retry: 0,
			maxRetries: 3,
			timestamp: new Date()
		};

		this.operationQueue.set(operationKey, queuedOperation);

		// Set entity to loading state
		this.setEntityLoading(entityType, entityId, true);

		// Process queue if not already processing
		if (!this.processingQueue) {
			this.processQueue();
		}
	}

	/**
	 * Process the operation queue
	 */
	private async processQueue(): Promise<void> {
		if (this.processingQueue || this.operationQueue.size === 0) {
			return;
		}

		this.processingQueue = true;

		const operations = Array.from(this.operationQueue.entries());

		for (const [operationKey, operation] of operations) {
			try {
				await this.executeOperation(operation);
				this.operationQueue.delete(operationKey);
			} catch (error) {
				console.error(`Operation ${operationKey} failed:`, error);

				if (operation.retry < operation.maxRetries) {
					operation.retry++;
					console.log(
						`Retrying operation ${operationKey} (attempt ${operation.retry}/${operation.maxRetries})`
					);
				} else {
					console.error(`Operation ${operationKey} failed after ${operation.maxRetries} retries`);
					this.operationQueue.delete(operationKey);
					this.setEntityError(
						operation.entityType,
						operation.entityId,
						'Operation failed after multiple retries'
					);
					toast.error('Failed to sync changes. Please try again.');
				}
			}
		}

		this.processingQueue = false;

		// If more operations were added while processing, process again
		if (this.operationQueue.size > 0) {
			setTimeout(() => this.processQueue(), 1000); // Wait 1s before retry
		}
	}

	/**
	 * Execute a specific operation
	 */
	private async executeOperation(operation: QueuedOperation): Promise<void> {
		const { entityType, entityId, operation: op, action, data } = operation;

		let response: Response;

		if (entityType === 'find' && action === 'like') {
			// Handle like operations
			const method = (data as { isLiked?: boolean })?.isLiked ? 'POST' : 'DELETE';
			response = await fetch(`/api/finds/${entityId}/like`, {
				method,
				headers: {
					'Content-Type': 'application/json'
				}
			});
		} else {
			throw new Error(`Unsupported operation: ${entityType}:${op}:${action}`);
		}

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || `HTTP ${response.status}`);
		}

		const result = await response.json();

		// Update entity state with successful result
		if (entityType === 'find' && action === 'like') {
			this.updateFindLikeState(entityId, result.isLiked, result.likeCount);
		}
	}

	/**
	 * Update find like state after successful API call
	 */
	private updateFindLikeState(findId: string, isLiked: boolean, likeCount: number): void {
		const store = this.getEntityStore('find');

		store.update(($entities) => {
			const newEntities = new Map($entities);
			const existing = newEntities.get(findId);

			if (existing && existing.data) {
				const findData = existing.data as FindState;
				newEntities.set(findId, {
					...existing,
					data: {
						...findData,
						isLikedByUser: isLiked,
						likeCount: likeCount
					},
					isLoading: false,
					error: null,
					lastUpdated: new Date()
				});
			}

			return newEntities;
		});
	}

	/**
	 * Start the queue processor
	 */
	private startQueueProcessor(): void {
		// Process queue every 100ms
		setInterval(() => {
			if (this.operationQueue.size > 0 && !this.processingQueue) {
				this.processQueue();
			}
		}, 100);
	}

	/**
	 * Toggle like for a find
	 */
	async toggleLike(findId: string): Promise<void> {
		// Get current state for optimistic update
		const store = this.getEntityStore('find');
		let currentState: FindState | null = null;

		const unsubscribe = store.subscribe(($entities) => {
			const entity = $entities.get(findId);
			if (entity?.data) {
				currentState = entity.data as FindState;
			}
		});
		unsubscribe();

		if (!currentState) {
			console.warn(`Cannot toggle like for find ${findId}: find state not found`);
			return;
		}

		// Optimistic update
		const findState = currentState as FindState;
		const newIsLiked = !findState.isLikedByUser;
		const newLikeCount = findState.likeCount + (newIsLiked ? 1 : -1);

		// Update state optimistically
		store.update(($entities) => {
			const newEntities = new Map($entities);
			const existing = newEntities.get(findId);

			if (existing && existing.data) {
				const findData = existing.data as FindState;
				newEntities.set(findId, {
					...existing,
					data: {
						...findData,
						isLikedByUser: newIsLiked,
						likeCount: newLikeCount
					}
				});
			}

			return newEntities;
		});

		// Queue the operation
		await this.queueOperation('find', findId, 'update', 'like', { isLiked: newIsLiked });
	}

	/**
	 * Initialize find data from server
	 */
	initializeFindData(finds: FindState[]): void {
		for (const find of finds) {
			this.setEntityState('find', find.id, find);
		}
	}

	/**
	 * Cleanup unused subscriptions (call this when components unmount)
	 */
	cleanup(entityType: string, entityId: string): void {
		const key = `${entityType}:${entityId}`;
		const subscriptions = this.subscriptions.get(key);
		if (subscriptions) {
			subscriptions.forEach((unsubscribe) => unsubscribe());
			this.subscriptions.delete(key);
		}
	}
}

// Create singleton instance
export const apiSync = new APISync();
