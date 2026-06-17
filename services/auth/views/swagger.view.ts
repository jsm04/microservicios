import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const swaggerHtml = readFileSync(resolve(__dirname, '..', 'swagger.html'), 'utf-8');

const spec = {
  openapi: '3.0.3',
  info: { title: 'Auth Service', version: '1.0.0' },
  paths: {
    '/create-user': {
      post: {
        summary: 'Create a new user',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' }, '400': { description: 'Bad Request' } },
      },
    },
    '/login': {
      post: {
        summary: 'Login and get a JWT token',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } },
      },
    },
    '/verify': {
      get: {
        summary: 'Verify a JWT token',
        parameters: [
          { name: 'Authorization', in: 'header', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } },
      },
    },
  },
};

export function getSwaggerPage(): Response {
  return new Response(swaggerHtml, { headers: { 'Content-Type': 'text/html' } });
}

export function getSwaggerSpec(): Response {
  return new Response(JSON.stringify(spec), { headers: { 'Content-Type': 'application/json' } });
}
