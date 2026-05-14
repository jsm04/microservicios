import { Pool } from 'pg';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const db = new Pool({
	connectionString: process.env.DATABASE_URL,
});

const schema = readFileSync(resolve(__dirname, 'schema.sql'), 'utf-8');
await db.query(schema);

const swaggerHtml = readFileSync(resolve(__dirname, 'swagger.html'), 'utf-8');

const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://localhost:3001';

const spec = {
	openapi: '3.0.3',
	info: { title: 'Order Service', version: '1.0.0' },
	paths: {
		'/orders': {
			get: {
				summary: 'List all orders',
				responses: { '200': { description: 'OK' } },
			},
			post: {
				summary: 'Create an order (validates user via HTTP)',
				requestBody: {
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									userId: { type: 'string' },
									items: { type: 'array', items: { type: 'string' } },
									total: { type: 'number' },
								},
							},
						},
					},
				},
				responses: { '201': { description: 'Created' } },
			},
		},
		'/orders/{id}': {
			get: {
				summary: 'Get order by ID',
				parameters: [
					{
						name: 'id',
						in: 'path',
						required: true,
						schema: { type: 'string' },
					},
				],
				responses: { '200': { description: 'OK' } },
			},
		},
	},
};

async function fetchUser(id: string) {
	const res = await fetch(`${USER_SERVICE}/users/${id}`);
	if (!res.ok) return null;
	return res.json() as Promise<any>;
}

const server = Bun.serve({
	port: 3002,
	routes: {
		'/swagger': () => {
			return new Response(swaggerHtml, {
				headers: { 'Content-Type': 'text/html' },
			});
		},
		'/swagger.json': () => Response.json(spec),
		'/orders': {
			GET: async () => {
				const res = await db.query(
					'SELECT id, user_id, items, total, created_at FROM orders ORDER BY id',
				);
				// pg returns NUMERIC as string; convert to number
				return Response.json(
					res.rows.map((r) => ({ ...r, total: Number(r.total) })),
				);
			},
			POST: async (req) => {
				const { userId, items, total } = (await req.json()) as {
					userId: string;
					items: string[];
					total: number;
				};
				const user = await fetchUser(userId);
				if (!user)
					return new Response(JSON.stringify({ error: 'User not found' }), {
						status: 404,
					});
				const res = await db.query(
					'INSERT INTO orders (user_id, items, total) VALUES ($1, $2, $3) RETURNING id, user_id, items, total, created_at',
					[userId, JSON.stringify(items), total],
				);
				return new Response(JSON.stringify(res.rows[0]), {
					status: 201,
					headers: { 'Content-Type': 'application/json' },
				});
			},
		},
		'/orders/:id': {
			GET: async (req) => {
				const id = (req as any).params?.id;
				const res = await db.query(
					'SELECT id, user_id, items, total, created_at FROM orders WHERE id = $1',
					[id],
				);
				if (res.rows.length === 0)
					return new Response('Not found', { status: 404 });
				const row = res.rows[0];
				return Response.json({ ...row, total: Number(row.total) });
			},
		},
	},
	fetch() {
		return new Response('Unmatched route');
	},
});
console.log(`Order service → http://localhost:${server.port}`);
