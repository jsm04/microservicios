# User Client Contract — Deepening the Order→User Seam

## Context

The Order Service validates user existence by calling the User Service via HTTP. Currently, this call is an inline `fetchUser` function inside `order.controller.ts`. It is a real seam between two services but is invisible — no interface, no testability, no alternative adapters.

## Problem

The HTTP call to the User Service is buried in the controller as a private function. This means:

- The controller cannot be tested without a running User Service
- The seam is not explicit — no interface to understand what the Order Service needs from the User Service
- Swapping the adapter (e.g., for a cached or mocked version) requires editing the controller
- The interface a caller needs to know is not documented

## Design

### 1. Contracts Module (`contracts/`)

A new `contracts/` directory at the monorepo root defines the seam.

**`contracts/user-client.ts`** — the interface:

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

**`contracts/http-user-client.ts`** — the concrete adapter:

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

The adapter reads `USER_SERVICE_URL` from env. The interface returns a `User` object (not a boolean) because the User Service's domain concept is "User", and a future use case may need user data.

### 2. OrderController Deepening

`OrderController` becomes a class with `UserClient` injected via constructor:

```ts
export class OrderController {
  constructor(private userClient: UserClient) {}

  async listOrders(): Promise<Response> { ... }
  async createOrder(req: Request): Promise<Response> { ... }
  async getOrderById(req: Request): Promise<Response> { ... }
}
```

The inline `fetchUser` function is deleted. `createOrder` calls `this.userClient.findUser(body.userId)` instead.

### 3. Wiring in `index.ts`

```ts
import { HttpUserClient } from '../../contracts/http-user-client.js';
import { OrderController } from './controllers/order.controller.js';

const userClient = new HttpUserClient();
const controller = new OrderController(userClient);
```

Route handlers reference the controller: `controller.listOrders.bind(controller)`, etc.

## Files Changed

| File | Change |
|------|--------|
| `contracts/user-client.ts` | **New** — interface + types |
| `contracts/http-user-client.ts` | **New** — HTTP adapter |
| `services/order/controllers/order.controller.ts` | Controller → class, inject `UserClient` |
| `services/order/index.ts` | Wire `HttpUserClient` → `OrderController` |

## No Changes

- User Service (both controller, model, views)
- Both models (`user.model.ts`, `order.model.ts`)
- Both swagger views
- `docker-compose.yml`, `package.json`, `tsconfig.json`

## Benefits

- **Locality:** The seam is now a single module (`contracts/`). Changes to the HTTP contract live in one place.
- **Leverage:** Callers depend on `UserClient`, not on `fetch` or env vars.
- **Testability:** Tests can inject a `MockUserClient` that returns controlled results without a running User Service.
- **Deletion test:** If we deleted the inline `fetchUser`, its complexity would reappear in the controller. Moving it to the adapter concentrates the HTTP logic in one module.
