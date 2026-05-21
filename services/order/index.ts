import { getSwaggerPage, getSwaggerSpec } from './views/swagger.view.js';
import { HttpUserClient } from '../../contracts/http-user-client.js';
import { ServiceError } from '../../contracts/service-error.js';
import { OrderController } from './controllers/order.controller.js';
import { Pool } from 'pg';
import * as response from '../../libs/response.js';

const db = new Pool({
	connectionString: process.env.DATABASE_URL,
});

const userClient = new HttpUserClient();
const controller = new OrderController(userClient);

async function toResponse(result: Promise<Response | ServiceError>): Promise<Response> {
	const value = await result;
	return value instanceof ServiceError ? response.error(value) : value;
}

const server = Bun.serve({
	port: 3002,
	routes: {
		'/swagger': getSwaggerPage,
		'/swagger.json': getSwaggerSpec,
		'/orders': {
			GET: async (req) => toResponse(controller.listOrders()),
			POST: async (req) => toResponse(controller.createOrder(req)),
		},
		'/orders/:id': {
			GET: async (req) => toResponse(controller.getOrderById(req)),
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
