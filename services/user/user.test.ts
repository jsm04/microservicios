import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { UserController } from './controllers/user.controller.js';

// --- Shared mock pool for intercepting pg queries ---

interface MockQueryResult {
  rows: any[];
  rowCount: number;
}

let mockPool: { query: (sql: string, params?: any[]) => Promise<MockQueryResult>; end: () => Promise<void> } | null = null;

// --- Helper: create a mock Request ---

function createRequest(method: string, url: string, body?: any, headers: Record<string, string> = {}): Request {
  return new Request(`http://localhost${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// --- Helper: check if result is a ServiceError ---

function isError(result: any): result is Error & { code: string; status: number } {
  return result instanceof Error && 'code' in result && 'status' in result;
}

// --- Test Suites ---

describe('UserController', () => {
  const controller = new UserController();

  beforeEach(() => {
    // Reset mock pool for each test
    mockPool = {
      query: async (sql: string, params?: any[]): Promise<MockQueryResult> => ({
        rows: [],
        rowCount: 0,
      }),
      end: async () => {},
    };

    // Override pg.Pool to use our mock — must be called before model module loads
    mock.module('pg', () => ({
      Pool: class {
        constructor() {}
        query = async (sql: string, params?: any[]): Promise<MockQueryResult> => {
          return mockPool!.query(sql, params);
        };
        end = async () => {};
      },
    }));
  });

  afterEach(() => {
    mock.restore();
  });

  describe('listUsers', () => {
    it('should return all users when database returns results', async () => {
      mock.module('./models/user.model.js', () => {
        const original = require('./models/user.model.js');
        return {
          ...original,
          findAllUsers: async () => [
            { id: 1, name: 'Alice', email: 'alice@example.com', created_at: '2026-01-01T00:00:00Z' },
            { id: 2, name: 'Bob', email: 'bob@example.com', created_at: '2026-01-02T00:00:00Z' },
          ],
        };
      });

      const result = await controller.listUsers();
      expect(result.status).toBe(200);
      const json = await result.json();
      expect(json).toHaveLength(2);
      expect(json[0].name).toBe('Alice');
      expect(json[1].email).toBe('bob@example.com');
    });

    it('should return empty array when no users exist', async () => {
      mock.module('./models/user.model.js', () => {
        const original = require('./models/user.model.js');
        return {
          ...original,
          findAllUsers: async () => [],
        };
      });

      const result = await controller.listUsers();
      expect(result.status).toBe(200);
      const json = await result.json();
      expect(json).toHaveLength(0);
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      mock.module('./models/user.model.js', () => {
        const original = require('./models/user.model.js');
        return {
          ...original,
          createUser: async (name: string, email: string) => ({
            id: 1, name, email, created_at: '2026-01-03T00:00:00Z',
          }),
        };
      });

      const req = createRequest('POST', '/users', { name: 'Charlie', email: 'charlie@example.com' });
      const result = await controller.createUser(req);
      expect(result.status).toBe(201);
      const json = await result.json();
      expect(json.name).toBe('Charlie');
      expect(json.email).toBe('charlie@example.com');
    });

    it('should return 400 when name is missing', async () => {
      const req = createRequest('POST', '/users', { email: 'test@example.com' });
      const result = await controller.createUser(req);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.code).toBe('MISSING_FIELDS');
        expect(result.status).toBe(400);
      }
    });

    it('should return 400 when email is missing', async () => {
      const req = createRequest('POST', '/users', { name: 'Test' });
      const result = await controller.createUser(req);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.code).toBe('MISSING_FIELDS');
        expect(result.status).toBe(400);
      }
    });

    it('should return 400 when name is empty string', async () => {
      const req = createRequest('POST', '/users', { name: '', email: 'test@example.com' });
      const result = await controller.createUser(req);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        // Empty string is falsy, so !body.name triggers first → MISSING_FIELDS
        expect(result.code).toBe('MISSING_FIELDS');
        expect(result.status).toBe(400);
      }
    });

    it('should return 400 when email is empty string', async () => {
      const req = createRequest('POST', '/users', { name: 'Test', email: '' });
      const result = await controller.createUser(req);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        // Empty string is falsy, so !body.email triggers first → MISSING_FIELDS
        expect(result.code).toBe('MISSING_FIELDS');
        expect(result.status).toBe(400);
      }
    });

    it('should return 400 when name is whitespace only', async () => {
      const req = createRequest('POST', '/users', { name: '   ', email: 'test@example.com' });
      const result = await controller.createUser(req);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.code).toBe('EMPTY_FIELDS');
        expect(result.status).toBe(400);
      }
    });

    it('should return 400 on database unique violation', async () => {
      mock.module('./models/user.model.js', () => {
        const original = require('./models/user.model.js');
        return {
          ...original,
          createUser: async () => {
            const err = new Error('duplicate key');
            (err as any).code = '23505';
            throw err;
          },
        };
      });

      const req = createRequest('POST', '/users', { name: 'Alice', email: 'alice@example.com' });
      const result = await controller.createUser(req);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.code).toBe('UNIQUE_VIOLATION');
        expect(result.status).toBe(400);
      }
    });

    it('should return 500 on other database errors', async () => {
      mock.module('./models/user.model.js', () => {
        const original = require('./models/user.model.js');
        return {
          ...original,
          createUser: async () => {
            const err = new Error('connection refused');
            (err as any).code = 'ECONNREFUSED';
            throw err;
          },
        };
      });

      const req = createRequest('POST', '/users', { name: 'Test', email: 'test@example.com' });
      const result = await controller.createUser(req);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.code).toBe('INTERNAL_ERROR');
        expect(result.status).toBe(500);
      }
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      mock.module('./models/user.model.js', () => {
        const original = require('./models/user.model.js');
        return {
          ...original,
          findUserById: async () => ({
            id: 1, name: 'Diana', email: 'diana@example.com', created_at: '2026-01-04T00:00:00Z',
          }),
        };
      });

      const req = createRequest('GET', '/users/1');
      (req as any).params = { id: '1' };
      const result = await controller.getUserById(req);
      expect(result.status).toBe(200);
      const json = await result.json();
      expect(json.name).toBe('Diana');
      expect(json.email).toBe('diana@example.com');
    });

    it('should return 404 when user not found', async () => {
      mock.module('./models/user.model.js', () => {
        const original = require('./models/user.model.js');
        return {
          ...original,
          findUserById: async () => null,
        };
      });

      const req = createRequest('GET', '/users/999');
      (req as any).params = { id: '999' };
      const result = await controller.getUserById(req);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.code).toBe('NOT_FOUND');
        expect(result.status).toBe(404);
      }
    });
  });
});
