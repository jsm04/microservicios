import type { UserClient } from '../../../contracts/user-client.js';
import { ServiceError } from '../../../contracts/service-error.js';
import * as model from '../models/order.model.js';
import * as response from '../../../libs/response.js';

export class OrderController {
  constructor(private userClient: UserClient) {}

  async list(): Promise<Response> {
    const orders = await model.findAllOrders();
    return response.json(orders);
  }

  async create(req: Request): Promise<Response | ServiceError> {
    const body = (await req.json()) as {
      userId?: string;
      items?: string[];
      total?: number;
    };

    // Validation
    if (!body.userId || !body.items || body.total === undefined) {
      return new ServiceError('MISSING_FIELDS', 'Missing required fields: userId, items, and total', 400);
    }
    if (body.items.length === 0) {
      return new ServiceError('EMPTY_FIELDS', 'Items cannot be empty', 400);
    }

    // Validate user exists
    const user = await this.userClient.findUser(body.userId);
    if (!user) {
      return new ServiceError('NOT_FOUND', 'User not found', 404);
    }

    try {
      const order = await model.createOrder(body.userId, body.items, body.total);
      return response.json(order, 201);
    } catch (_err) {
      return new ServiceError('INTERNAL_ERROR', 'Internal server error', 500);
    }
  }

  async getById(req: Request): Promise<Response | ServiceError> {
    const id = (req as any).params?.id;

    const order = await model.findOrderById(id);
    if (!order) {
      return new ServiceError('NOT_FOUND', 'Not found', 404);
    }
    return response.json(order);
  }
}
