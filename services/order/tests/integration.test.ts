import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import type { UserClient, User } from '../../../contracts/user-client.js';
import { ServiceError } from '../../../contracts/service-error.js';
import { OrderController } from '../controllers/order.controller.js';

// --- Mock pg module with controllable query behavior ---

let mockQueryFn: ((sql: string, params?: any[]) => Promise<any>) | null = null;
let queryCallCount = 0;

mock.module('pg', () => ({
	Pool: class {
		query(sql: string, params?: any[]) {
			queryCallCount++;
			if (mockQueryFn) return mockQueryFn(sql, params);
			return Promise.resolve({ rows: [], rowCount: 0 });
		}
		end() {
			return Promise.resolve();
		}
	},
}));

describe('Order → User client integration', () => {
	let mockUserClient: UserClient;
	let controller: OrderController;

	beforeEach(() => {
		// Default query returns empty
		mockQueryFn = async () => ({ rows: [], rowCount: 0 });
		queryCallCount = 0;

		// Default user client returns a valid user for id '1'
		mockUserClient = {
			findUser: async (id: string) => {
				if (id === '1') {
					return {
						id: 1,
						name: 'Test User',
						email: 'test@example.com',
					} as User;
				}
				return null;
			},
		};

		controller = new OrderController(mockUserClient);
	});

	afterEach(() => {
		mockQueryFn = null;
		queryCallCount = 0;
	});

	describe('create - happy path (user exists)', () => {
		it('returns 201 when user exists and order is created', async () => {
			// Mock successful database insert
			mockQueryFn = async (sql: string, params?: any[]) => {
				if (!params) return { rows: [], rowCount: 0 };
				return {
					rows: [
						{
							id: 1,
							user_id: params[0],
							items: params[1],
							total: params[2],
							created_at: new Date().toISOString(),
						},
					],
				};
			};

			const req = {
				json: async () => ({
					userId: '1',
					items: ['item1', 'item2'],
					total: 99.99,
				}),
			} as any;

			const result = await controller.create(req);
			expect(result).toBeInstanceOf(Response);

			if (result instanceof Response) {
				const body = await result.json();
				expect(result.status).toBe(201);
				expect(body.user_id).toBe('1');
				expect(body.total).toBe(99.99);
			}
		});
	});

	describe('create - error path (user not found)', () => {
		it('returns 404 when user does not exist', async () => {
			// Mock userClient to return null for non-existent user
			mockUserClient.findUser = async () => null;

			const req = {
				json: async () => ({
					userId: '999',
					items: ['item1'],
					total: 50,
				}),
			} as any;

			const result = await controller.create(req);
			expect(result).toBeInstanceOf(ServiceError);

			if (result instanceof ServiceError) {
				expect(result.code).toBe('NOT_FOUND');
				expect(result.message).toBe('User not found');
				expect(result.status).toBe(404);
			}

			// Verify database was NOT queried (early return before DB call)
			expect(queryCallCount).toBe(0);
		});
	});

	describe('create - validation errors', () => {
		it('returns 400 when userId is missing', async () => {
			const req = {
				json: async () => ({
					items: ['item1'],
					total: 50,
				}),
			} as any;

			const result = await controller.create(req);
			expect(result).toBeInstanceOf(ServiceError);

			if (result instanceof ServiceError) {
				expect(result.code).toBe('MISSING_FIELDS');
				expect(result.status).toBe(400);
			}

			// Verify database was NOT queried (validation fails first)
			expect(queryCallCount).toBe(0);
		});

		it('returns 400 when items is empty array', async () => {
			const req = {
				json: async () => ({
					userId: '1',
					items: [],
					total: 50,
				}),
			} as any;

			const result = await controller.create(req);
			expect(result).toBeInstanceOf(ServiceError);

			if (result instanceof ServiceError) {
				expect(result.code).toBe('EMPTY_FIELDS');
				expect(result.status).toBe(400);
			}

			// Verify database was NOT queried (validation fails first)
			expect(queryCallCount).toBe(0);
		});

		it('returns 400 when total is undefined', async () => {
			const req = {
				json: async () => ({
					userId: '1',
					items: ['item1'],
				}),
			} as any;

			const result = await controller.create(req);
			expect(result).toBeInstanceOf(ServiceError);

			if (result instanceof ServiceError) {
				expect(result.code).toBe('MISSING_FIELDS');
				expect(result.status).toBe(400);
			}
		});
	});

	describe('create - database error handling', () => {
		it('returns 500 when database insert fails', async () => {
			// Mock user exists
			mockUserClient.findUser = async () =>
				({ id: 1, name: 'Test User', email: 'test@example.com' }) as User;

			// Mock database error
			mockQueryFn = async () => {
				throw new Error('DB connection failed');
			};

			const req = {
				json: async () => ({
					userId: '1',
					items: ['item1'],
					total: 50,
				}),
			} as any;

			const result = await controller.create(req);
			expect(result).toBeInstanceOf(ServiceError);

			if (result instanceof ServiceError) {
				expect(result.code).toBe('INTERNAL_ERROR');
				expect(result.status).toBe(500);
			}
		});
	});
});
