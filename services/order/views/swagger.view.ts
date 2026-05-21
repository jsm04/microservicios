import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const swaggerHtml = readFileSync(resolve(__dirname, '..', 'swagger.html'), 'utf-8');

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

export function getSwaggerPage(): Response {
	return new Response(swaggerHtml, {
		headers: { 'Content-Type': 'text/html' },
	});
}

export function getSwaggerSpec(): Response {
	return new Response(JSON.stringify(spec), {
		headers: { 'Content-Type': 'application/json' },
	});
}
