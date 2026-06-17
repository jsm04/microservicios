import { ServiceError } from '../../../contracts/service-error.js';
import * as response from '../../../libs/response.js';
import { createUser, findUserByEmail, verifyPassword, emailExists } from '../models/auth.model.js';
import { generateToken } from '../../../libs/jwt.js';

export class AuthController {
  async createUser(req: Request): Promise<Response | ServiceError> {
    const body = (await req.json()) as { name?: string; email?: string; password?: string };

    if (!body.name || !body.email || !body.password) {
      return new ServiceError('MISSING_FIELDS', 'Missing required fields: name, email, and password', 400);
    }
    if (body.name.trim() === '' || body.email.trim() === '' || body.password.trim() === '') {
      return new ServiceError('EMPTY_FIELDS', 'Fields cannot be empty', 400);
    }

    if (emailExists(body.email)) {
      return new ServiceError('EMAIL_EXISTS', 'Email already registered', 400);
    }

    const user = await createUser(body.name, body.email, body.password);
    return response.json({ id: user.id, name: user.name, email: user.email }, 201);
  }

  async login(req: Request): Promise<Response | ServiceError> {
    const body = (await req.json()) as { email?: string; password?: string };

    if (!body.email || !body.password) {
      return new ServiceError('MISSING_FIELDS', 'Missing required fields: email and password', 400);
    }

    const user = findUserByEmail(body.email);
    if (!user) {
      return new ServiceError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const valid = await verifyPassword(body.password, user.password);
    if (!valid) {
      return new ServiceError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const token = await generateToken(user.id, user.name, user.email);
    return response.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  }

  async verify(req: Request): Promise<Response | ServiceError> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new ServiceError('UNAUTHORIZED', 'Missing or invalid authorization header', 401);
    }

    const token = authHeader.slice(7);
    try {
      const { payload } = await (await import('jose')).jwtVerify(token, new TextEncoder().encode(
        process.env.JWT_SECRET || 'default-secret-change-in-production',
      ));
      return response.json({ valid: true, user: { id: payload.sub, name: payload.name, email: payload.email } });
    } catch {
      return new ServiceError('INVALID_TOKEN', 'Invalid or expired token', 401);
    }
  }
}
