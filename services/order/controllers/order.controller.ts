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
