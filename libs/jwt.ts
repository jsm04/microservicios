import { ServiceError } from '../contracts/service-error.js';
import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-in-production',
);

export interface JwtPayload {
  sub: string;
  name: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Validates a Bearer token from the Authorization header.
 * Returns the decoded payload or a ServiceError(401).
 */
export async function validateBearerToken(req: Request): Promise<JwtPayload | ServiceError> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new ServiceError('UNAUTHORIZED', 'Missing or invalid authorization header', 401);
  }

  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    return new ServiceError('INVALID_TOKEN', 'Invalid or expired token', 401);
  }
}

/**
 * Generate a JWT token for a user.
 */
export async function generateToken(sub: string, name: string, email: string): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  return new SignJWT({ sub, name, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setIssuer(process.env.JWT_ISSUER || 'microservicios-auth')
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}
