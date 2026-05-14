import { Pool } from 'pg';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const db = new Pool({
	connectionString: process.env.DATABASE_URL,
});

const schema = readFileSync(resolve(__dirname, 'schema.sql'), 'utf-8');
await db.query(schema);

const swaggerHtml = readFileSync(resolve(__dirname, 'swagger.html'), 'utf-8');

const spec = {
	openapi: '3.0.3',
	info: { title: 'User Service', version: '1.0.0' },
	paths: {
		'/users': {
			get: {
				summary: 'List all users',
				responses: { '200': { description: 'OK' } },
			},
			post: {
				summary: 'Create a user',
				requestBody: {
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									name: { type: 'string' },
									email: { type: 'string' },
								},
							},
						},
					},
				},
				responses: { '201': { description: 'Created' } },
			},
		},
		'/users/{id}': {
			get: {
				summary: 'Get user by ID',
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

const server = Bun.serve({
	port: 3001,
	routes: {
		'/swagger': () => {
			return new Response(swaggerHtml, {
				headers: { 'Content-Type': 'text/html' },
			});
		},
		'/swagger.json': () => Response.json(spec),
		'/users': {
			GET: async () => {
				const res = await db.query(
					'SELECT id, name, email, created_at FROM users ORDER BY id',
				);
				return Response.json(res.rows);
			},
			POST: async (req) => {
				const { name, email } = (await req.json()) as {
					name: string;
					email: string;
				};
				const res = await db.query(
					'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at',
					[name, email],
				);
				return new Response(JSON.stringify(res.rows[0]), {
					status: 201,
					headers: { 'Content-Type': 'application/json' },
				});
			},
		},
		'/users/:id': {
			GET: async (req) => {
				const id = (req as any).params?.id;
				const res = await db.query(
					'SELECT id, name, email, created_at FROM users WHERE id = $1',
					[id],
				);
				if (res.rows.length === 0)
					return new Response('Not found', { status: 404 });
				return Response.json(res.rows[0]);
			},
		},
	},
	fetch() {
		return new Response('Unmatched route');
	},
});
console.log(`User service → http://localhost:${server.port}`);
