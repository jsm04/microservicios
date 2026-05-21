import { ServiceError } from '../../../contracts/service-error.js';
import * as model from '../models/user.model.js';
import * as response from '../../../libs/response.js';

export class UserController {
  async listUsers(): Promise<Response> {
    const users = await model.findAllUsers();
    return response.json(users);
  }

  async createUser(req: Request): Promise<Response | ServiceError> {
    const body = (await req.json()) as { name?: string; email?: string };

    // Validation
    if (!body.name || !body.email) {
      return new ServiceError('MISSING_FIELDS', 'Missing required fields: name and email', 400);
    }
    if (body.name.trim() === '' || body.email.trim() === '') {
      return new ServiceError('EMPTY_FIELDS', 'Fields cannot be empty', 400);
    }

    try {
      const user = await model.createUser(body.name, body.email);
      return response.json(user, 201);
    } catch (err: any) {
      if (err.code === '23505') {
        return new ServiceError('UNIQUE_VIOLATION', 'Email already exists', 400);
      }
      return new ServiceError('INTERNAL_ERROR', 'Internal server error', 500);
    }
  }

  async getUserById(req: Request): Promise<Response | ServiceError> {
    const id = (req as any).params?.id;

    const user = await model.findUserById(id);
    if (!user) {
      return new ServiceError('NOT_FOUND', 'Not found', 404);
    }
    return response.json(user);
  }
}
