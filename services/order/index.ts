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
