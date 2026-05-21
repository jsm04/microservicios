import type { ServiceError } from '../contracts/service-error.js';

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function text(message: string, status = 200): Response {
  return new Response(message, {
    status,
    headers: { 'Content-Type': 'text/plain' },
  });
}

export function error(err: ServiceError): Response {
  return new Response(JSON.stringify({ code: err.code, message: err.message }), {
    status: err.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
