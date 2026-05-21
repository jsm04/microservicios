import { getSwaggerPage, getSwaggerSpec } from './views/swagger.view.js';
import { listOrders, createOrder, getOrderById } from './controllers/order.controller.js';

const server = Bun.serve({
	port: 3002,
	routes: {
		'/swagger': getSwaggerPage,
		'/swagger.json': getSwaggerSpec,
		'/orders': {
			GET: listOrders,
			POST: createOrder,
		},
		'/orders/:id': {
			GET: getOrderById,
		},
	},
	fetch() {
		return new Response('Unmatched route');
	},
});

console.log(`Order service → http://localhost:${server.port}`);
