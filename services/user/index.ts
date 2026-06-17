import { getSwaggerPage, getSwaggerSpec } from './views/swagger.view.js';
import { ServiceError } from '../../contracts/service-error.js';
import { UserController } from './controllers/user.controller.js';
import { validateBearerToken } from '../../libs/jwt.js';
import { Pool } from 'pg';
import * as response from '../../libs/response.js';

const db = new Pool({
	connectionString: process.env.DATABASE_URL,
});

const controller = new UserController();

async function toResponse(result: Promise<Response | ServiceError>): Promise<Response> {
	const value = await result;
	return value instanceof ServiceError ? response.error(value) : value;
}

// JWT validation middleware
async function authMiddleware(req: Request): Promise<Response | null> {
	const result = await validateBearerToken(req);
	if (result instanceof ServiceError) {
		return response.error(result);
	}
	// Attach decoded payload to request for downstream use
	(req as any).jwtPayload = result;
	return null; // null means "proceed to route handler"
}

const server = Bun.serve({
	port: 3001,
	routes: {
		'/swagger': getSwaggerPage,
		'/swagger.json': getSwaggerSpec,
		'/users': {
			GET: async (req) => {
				const auth = await authMiddleware(req);
				if (auth) return auth;
				return toResponse(controller.listUsers());
			},
			POST: async (req) => {
				const auth = await authMiddleware(req);
				if (auth) return auth;
				return toResponse(controller.createUser(req));
			},
		},
		'/users/:id': {
			GET: async (req) => {
				const auth = await authMiddleware(req);
				if (auth) return auth;
				return toResponse(controller.getUserById(req));
			},
		},
	},
	fetch() {
		return new Response('Unmatched route');
	},
});

console.log(`User service → http://localhost:${server.port}`);

async function shutdown() {
	console.log('Shutting down...');
	await server.stop();
	console.log('Server stopped. Closing DB pool...');
	await db.end();
	console.log('DB pool closed.');
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
