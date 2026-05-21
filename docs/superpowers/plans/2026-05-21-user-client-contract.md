# User Client Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the inline `fetchUser` function from the Order Service into a proper `UserClient` interface with an `HttpUserClient` adapter, and deepen the `OrderController` into a class that depends on the interface.

**Architecture:** A new `contracts/` directory at the monorepo root holds the seam between services. The `UserClient` interface defines `findUser(id): Promise<User | null>`. The `HttpUserClient` adapter implements it via `fetch` against the User Service. The `OrderController` becomes a class with the interface injected via constructor.

**Tech Stack:** Bun, TypeScript, pg, native `fetch`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `contracts/user-client.ts` | **Create** | `UserClient` interface + `User` type |
| `contracts/http-user-client.ts` | **Create** | `HttpUserClient` adapter (reads `USER_SERVICE_URL` from env) |
| `services/order/controllers/order.controller.ts` | **Modify** | Convert to class, inject `UserClient`, delete `fetchUser` |
| `services/order/index.ts` | **Modify** | Wire `HttpUserClient` → `OrderController`, bind methods |

**No changes:** User Service, both models, both swagger views, docker-compose, package.json, tsconfig.json.

---

### Task 1: Create the `UserClient` interface

**Files:**
- Create: `contracts/user-client.ts`

- [ ] **Step 1: Write the interface file**

```ts
export interface UserClient {
  /** Find a user by ID. Returns null if not found. */
  findUser(id: string): Promise<User | null>;
}

export interface User {
  id: number;
  name: string;
  email: string;
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd /home/jsmor/dev/inst/microservicios && npx tsc --noEmit`
Expected: No errors (the file has no imports, so it compiles standalone)

- [ ] **Step 3: Commit**

```bash
git add contracts/user-client.ts
git commit -m "feat: add UserClient interface and User type"
```

---

### Task 2: Create the `HttpUserClient` adapter

**Files:**
- Create: `contracts/http-user-client.ts`

- [ ] **Step 1: Write the adapter**

```ts
import type { UserClient, User } from './user-client.js';

export class HttpUserClient implements UserClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
  }

  async findUser(id: string): Promise<User | null> {
    const res = await fetch(`${this.baseUrl}/users/${id}`);
    if (!res.ok) return null;
    return res.json() as Promise<User>;
  }
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd /home/jsmor/dev/inst/microservicios && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add contracts/http-user-client.ts
git commit -m "feat: add HttpUserClient adapter for User Service seam"
```

---

### Task 3: Deepen the OrderController into a class

**Files:**
- Modify: `services/order/controllers/order.controller.ts`

- [ ] **Step 1: Rewrite the controller**

Replace the entire file with:

```ts
import type { UserClient } from '../../../contracts/user-client.js';
import * as model from '../models/order.model.js';
import * as view from '../views/response.view.js';

export class OrderController {
  constructor(private userClient: UserClient) {}

  async listOrders(): Promise<Response> {
    const orders = await model.findAllOrders();
    return view.json(orders);
  }

  async createOrder(req: Request): Promise<Response> {
    const body = (await req.json()) as {
      userId?: string;
      items?: string[];
      total?: number;
    };

    // Validation
    if (!body.userId || !body.items || body.total === undefined) {
      return view.text('Missing required fields: userId, items, and total', 400);
    }
    if (body.items.length === 0) {
      return view.text('Items cannot be empty', 400);
    }

    // Validate user exists
    const user = await this.userClient.findUser(body.userId);
    if (!user) {
      return view.text('User not found', 404);
    }

    try {
      const order = await model.createOrder(body.userId, body.items, body.total);
      return view.json(order, 201);
    } catch (_err) {
      return view.text('Internal server error', 500);
    }
  }

  async getOrderById(req: Request): Promise<Response> {
    const id = (req as any).params?.id;

    const order = await model.findOrderById(id);
    if (!order) {
      return view.text('Not found', 404);
    }
    return view.json(order);
  }
}
```

Key changes:
- Import `UserClient` from `contracts/user-client.js`
- Class with `userClient` injected via constructor
- `fetchUser` function deleted entirely
- `createOrder` calls `this.userClient.findUser(body.userId)` instead of `fetchUser(body.userId)`
- Removed `USER_SERVICE` env const (no longer needed here)
- Catch block uses `_err` (unused) instead of `err: any` — the Order Service does not inspect the error

- [ ] **Step 2: Verify the file compiles**

Run: `cd /home/jsmor/dev/inst/microservicios && npx tsc --noEmit`
Expected: No errors (the import path `../../../contracts/user-client.js` resolves to the new file)

- [ ] **Step 3: Commit**

```bash
git add services/order/controllers/order.controller.ts
git commit -m "refactor: deepen OrderController with UserClient dependency injection"
```

---

### Task 4: Wire the adapter in index.ts

**Files:**
- Modify: `services/order/index.ts`

- [ ] **Step 1: Rewrite the wiring**

Replace the entire `index.ts` with:

```ts
import { getSwaggerPage, getSwaggerSpec } from './views/swagger.view.js';
import { HttpUserClient } from '../../contracts/http-user-client.js';
import { OrderController } from './controllers/order.controller.js';
import { Pool } from 'pg';

const db = new Pool({
	connectionString: process.env.DATABASE_URL,
});

const userClient = new HttpUserClient();
const controller = new OrderController(userClient);

const server = Bun.serve({
	port: 3002,
	routes: {
		'/swagger': getSwaggerPage,
		'/swagger.json': getSwaggerSpec,
		'/orders': {
			GET: controller.listOrders.bind(controller),
			POST: controller.createOrder.bind(controller),
		},
		'/orders/:id': {
			GET: controller.getOrderById.bind(controller),
		},
	},
	fetch() {
		return new Response('Unmatched route');
	},
});

console.log(`Order service → http://localhost:${server.port}`);

async function shutdown() {
	console.log('Shutting down...');
	await server.stop();
	console.log('Server stopped. Closing DB pool...');
	await db.end();
	console.log('DB pool closed.');
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

Key changes:
- Import `HttpUserClient` from `../../contracts/http-user-client.js`
- Instantiate `userClient` and pass it to `OrderController`
- Route handlers use `controller.method.bind(controller)` to preserve `this` context

- [ ] **Step 2: Verify the file compiles**

Run: `cd /home/jsmor/dev/inst/microservicios && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add services/order/index.ts
git commit -m "feat: wire HttpUserClient into OrderController in index.ts"
```

---

### Task 5: Verify the system works

**Files:**
- No code changes

- [ ] **Step 1: Build and start the system**

```bash
cd /home/jsmor/dev/inst/microservicios
docker compose down
docker compose up --build
```

- [ ] **Step 2: Test user creation**

```bash
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana","email":"ana@test.com"}'
```
Expected: `201 Created` with user JSON including `id`

- [ ] **Step 3: Test order creation (cross-service validation)**

```bash
curl -X POST http://localhost:3002/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"1","items":["laptop","mouse"],"total":1200}'
```
Expected: `201 Created` with order JSON

- [ ] **Step 4: Test order creation with non-existent user**

```bash
curl -X POST http://localhost:3002/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"999","items":["laptop"],"total":100}'
```
Expected: `404 Not Found` with `{ "error": "User not found" }` or `{ "message": "User not found" }`

- [ ] **Step 5: Test list endpoints**

```bash
curl http://localhost:3001/users
curl http://localhost:3002/orders
```
Expected: `200 OK` with JSON arrays

- [ ] **Step 6: Test Swagger**

Open `http://localhost:3002/swagger` in browser. Expected: Swagger UI renders correctly.

- [ ] **Step 7: Final commit (if all tests pass)**

```bash
git add -A
git commit -m "test: verify cross-service order creation works"
```
