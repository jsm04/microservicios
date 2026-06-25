import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { AuthController } from './controllers/auth.controller.js';

// --- Mock pg module ---

interface MockQueryResult {
  rows: any[];
  rowCount: number;
}

interface MockPool {
  query: (sql: string, params?: any[]) => Promise<MockQueryResult>;
  end: () => Promise<void>;
}

let mockPool: MockPool | null = null;

mock.module('pg', () => ({
  Pool: class {
    constructor() {
      mockPool = {
        query: async (sql: string, params?: any[]) => {
          return { rows: [], rowCount: 0 };
        },
        end: async () => {},
      };
    }
    prototype = {
      query: async (sql: string, params?: any[]) => ({ rows: [], rowCount: 0 }),
      end: async () => {},
    };
  },
}));

// --- Mock crypto.subtle for password hashing ---

const mockSalt = 'test-salt';
process.env.PASSWORD_SALT = mockSalt;

// --- Mock jose for JWT ---

const mockJwtPayload = {
  sub: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 86400,
};

// --- Helper: create a mock Request ---

function createRequest(method: string, url: string, body?: any, headers: Record<string, string> = {}): Request {
  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// --- Helper: declarative result handler — eliminates all type narrowing from tests ---

async function assertResult(
  result: Response | Error & { code: string; status: number },
  opts: {
    onResponse?: (res: Response) => Promise<void> | void;
    onError?: (err: Error & { code: string; status: number }) => void;
  },
): Promise<void> {
  if (result instanceof Response) {
    await opts.onResponse?.(result);
  } else {
    opts.onError?.(result);
  }
}

// --- Test Suites ---

describe('AuthController', () => {
  const controller = new AuthController();

  beforeEach(() => {
    // Reset mock pool for each test
    mockPool = {
      query: async (sql: string, params?: any[]): Promise<MockQueryResult> => ({
        rows: [],
        rowCount: 0,
      }),
      end: async () => {},
    };

    // Override pg.Pool to use our mock
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

  describe('createUser', () => {
    it('returns 201 for valid user creation', async () => {
      const mockId = '550e8400-e29b-41d4-a716-446655440000';

      // Mock emailExists to return false (email not taken)
      mock.module('./models/auth.model.js', () => {
        const original = require('./models/auth.model.js');
        return {
          ...original,
          emailExists: async () => false,
          createUser: async (name: string, email: string, _password: string) => ({
            id: mockId,
            name,
            email,
            password: 'hashed',
          }),
        };
      });

      const req = createRequest('POST', 'http://localhost/create-user', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const result = await controller.createUser(req);
      await assertResult(result, {
        onResponse: async (res) => {
          expect(res.status).toBe(201);
          const body = await res.json();
          expect(body.name).toBe('Test User');
          expect(body.email).toBe('test@example.com');
        },
      });
    });

    it('returns EMAIL_EXISTS when email already registered', async () => {
      mock.module('./models/auth.model.js', () => {
        const original = require('./models/auth.model.js');
        return {
          ...original,
          emailExists: async () => true,
        };
      });

      const req = createRequest('POST', 'http://localhost/create-user', {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
      });

      const result = await controller.createUser(req);
      await assertResult(result, {
        onError: (err) => {
          expect(err.code).toBe('EMAIL_EXISTS');
          expect(err.status).toBe(400);
        },
      });
    });

    it('returns MISSING_FIELDS when name is missing', async () => {
      const req = createRequest('POST', 'http://localhost/create-user', {
        email: 'test@example.com',
        password: 'password123',
      });

      const result = await controller.createUser(req);
      await assertResult(result, {
        onError: (err) => {
          expect(err.code).toBe('MISSING_FIELDS');
          expect(err.status).toBe(400);
        },
      });
    });

    it('returns MISSING_FIELDS when email is missing', async () => {
      const req = createRequest('POST', 'http://localhost/create-user', {
        name: 'Test User',
        password: 'password123',
      });

      const result = await controller.createUser(req);
      await assertResult(result, {
        onError: (err) => {
          expect(err.code).toBe('MISSING_FIELDS');
        },
      });
    });

    it('returns MISSING_FIELDS when password is missing', async () => {
      const req = createRequest('POST', 'http://localhost/create-user', {
        name: 'Test User',
        email: 'test@example.com',
      });

      const result = await controller.createUser(req);
      await assertResult(result, {
        onError: (err) => {
          expect(err.code).toBe('MISSING_FIELDS');
        },
      });
    });

    it('returns MISSING_FIELDS when name is empty string', async () => {
      const req = createRequest('POST', 'http://localhost/create-user', {
        name: '',
        email: 'test@example.com',
        password: 'password123',
      });

      const result = await controller.createUser(req);
      await assertResult(result, {
        onError: (err) => {
          expect(err.code).toBe('MISSING_FIELDS');
          expect(err.status).toBe(400);
        },
      });
    });

    it('returns EMPTY_FIELDS when email is whitespace only', async () => {
      const req = createRequest('POST', 'http://localhost/create-user', {
        name: 'Test User',
        email: '   ',
        password: 'password123',
      });

      const result = await controller.createUser(req);
      await assertResult(result, {
        onError: (err) => {
          expect(err.code).toBe('EMPTY_FIELDS');
        },
      });
    });
  });

  describe('login', () => {
    it('returns token for valid credentials', async () => {
      const mockId = '550e8400-e29b-41d4-a716-446655440000';
      const mockHash = 'abc123def456';

      mock.module('./models/auth.model.js', () => ({
        findUserByEmail: async () => ({
          id: mockId,
          name: 'Test User',
          email: 'test@example.com',
          password: mockHash,
        }),
        verifyPassword: async (_pw: string, hash: string) => hash === mockHash,
      }));

      mock.module('../libs/jwt.js', () => ({
        generateToken: async () => 'mock-jwt-token',
      }));

      const req = createRequest('POST', 'http://localhost/login', {
        email: 'test@example.com',
        password: 'password123',
      });

      const result = await controller.login(req);
      await assertResult(result, {
        onResponse: async (res) => {
          expect(res.status).toBe(200);
          const body = await res.json();
          expect(body.token).toBeDefined();
          expect(body.user.email).toBe('test@example.com');
        },
      });
    });

    it('returns INVALID_CREDENTIALS when user not found', async () => {
      mock.module('./models/auth.model.js', () => ({
        findUserByEmail: async () => undefined,
      }));

      const req = createRequest('POST', 'http://localhost/login', {
        email: 'nobody@example.com',
        password: 'password123',
      });

      const result = await controller.login(req);
      await assertResult(result, {
        onError: (err) => {
          expect(err.code).toBe('INVALID_CREDENTIALS');
          expect(err.status).toBe(401);
        },
      });
    });

    it('returns INVALID_CREDENTIALS when password is wrong', async () => {
      const mockId = '550e8400-e29b-41d4-a716-446655440000';
      const mockHash = 'abc123def456';

      mock.module('./models/auth.model.js', () => ({
        findUserByEmail: async () => ({
          id: mockId,
          name: 'Test User',
          email: 'test@example.com',
          password: mockHash,
        }),
        verifyPassword: async () => false,
      }));

      const req = createRequest('POST', 'http://localhost/login', {
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      const result = await controller.login(req);
      await assertResult(result, {
        onError: (err) => {
          expect(err.code).toBe('INVALID_CREDENTIALS');
          expect(err.status).toBe(401);
        },
      });
    });

    it('returns MISSING_FIELDS when email is missing', async () => {
      const req = createRequest('POST', 'http://localhost/login', {
        password: 'password123',
      });

      const result = await controller.login(req);
      await assertResult(result, {
        onError: (err) => {
          expect(err.code).toBe('MISSING_FIELDS');
        },
      });
    });

    it('returns MISSING_FIELDS when password is missing', async () => {
      const req = createRequest('POST', 'http://localhost/login', {
        email: 'test@example.com',
      });

      const result = await controller.login(req);
      await assertResult(result, {
        onError: (err) => {
          expect(err.code).toBe('MISSING_FIELDS');
        },
      });
    });
  });

  describe('verify', () => {
    it('returns UNAUTHORIZED when no Authorization header', async () => {
      const req = createRequest('GET', 'http://localhost/verify');
      const result = await controller.verify(req);
      await assertResult(result, {
        onError: (err) => {
          expect(err.code).toBe('UNAUTHORIZED');
          expect(err.status).toBe(401);
        },
      });
    });

    it('returns UNAUTHORIZED when Authorization header is not Bearer', async () => {
      const req = createRequest('GET', 'http://localhost/verify', undefined, {
        Authorization: 'Basic dXNlcjpwYXNz',
      });
      const result = await controller.verify(req);
      await assertResult(result, {
        onError: (err) => {
          expect(err.code).toBe('UNAUTHORIZED');
        },
      });
    });

    it('returns INVALID_TOKEN when token is invalid', async () => {
      const req = createRequest('GET', 'http://localhost/verify', undefined, {
        Authorization: 'Bearer invalid-token-here',
      });
      const result = await controller.verify(req);
      await assertResult(result, {
        onError: (err) => {
          expect(err.code).toBe('INVALID_TOKEN');
          expect(err.status).toBe(401);
        },
      });
    });
  });
});
