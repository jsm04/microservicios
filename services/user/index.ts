import { getSwaggerPage, getSwaggerSpec } from './views/swagger.view.js';
import { listUsers, createUser, getUserById } from './controllers/user.controller.js';

const server = Bun.serve({
	port: 3001,
	routes: {
		'/swagger': getSwaggerPage,
		'/swagger.json': getSwaggerSpec,
		'/users': {
			GET: listUsers,
			POST: createUser,
		},
		'/users/:id': {
			GET: getUserById,
		},
	},
	fetch() {
		return new Response('Unmatched route');
	},
});

console.log(`User service → http://localhost:${server.port}`);
