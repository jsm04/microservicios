import { AuthController } from './controllers/auth.controller.js';
import { getSwaggerPage, getSwaggerSpec } from './views/swagger.view.js';
import { ServiceError } from '../../contracts/service-error.js';
import * as response from '../../libs/response.js';
import { join } from 'node:path';

const controller = new AuthController();

async function toResponse(result: Promise<Response | ServiceError>): Promise<Response> {
  const value = await result;
  return value instanceof ServiceError ? response.error(value) : value;
}

const server = Bun.serve({
  port: 3003,
  routes: {
    '/swagger': getSwaggerPage,
    '/swagger.json': getSwaggerSpec,
    '/swagger-ui-dist/**': (req) => {
      const filePath = join(__dirname, 'node_modules', 'swagger-ui-dist', req.url.slice('/swagger-ui-dist'.length));
      return Bun.file(filePath);
    },
    '/create-user': {
      POST: async (req) => toResponse(controller.createUser(req)),
    },
    '/login': {
      POST: async (req) => toResponse(controller.login(req)),
    },
    '/verify': {
      GET: async (req) => toResponse(controller.verify(req)),
    },
  },
  fetch() {
    return new Response('Unmatched route');
  },
});

console.log(`Auth service → http://localhost:${server.port}`);

async function shutdown() {
  console.log('Shutting down...');
  await server.stop();
  console.log('Server stopped.');
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
