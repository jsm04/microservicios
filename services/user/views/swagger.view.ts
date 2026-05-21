import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const swaggerHtml = readFileSync(resolve(__dirname, '..', 'swagger.html'), 'utf-8');

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
