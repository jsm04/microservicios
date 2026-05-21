import { getSwaggerPage, getSwaggerSpec } from './views/swagger.view.js';
import { ServiceError } from '../../contracts/service-error.js';
import { UserController } from './controllers/user.controller.js';
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

const server = Bun.serve({
	port: 3001,
	routes: {
		'/swagger': getSwaggerPage,
		'/swagger.json': getSwaggerSpec,
		'/users': {
			GET: async (req) => toResponse(controller.listUsers()),
			POST: async (req) => toResponse(controller.createUser(req)),
		},
		'/users/:id': {
			GET: async (req) => toResponse(controller.getUserById(req)),
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
