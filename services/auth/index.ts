import { AuthController } from "./controllers/auth.controller.js";
import { clearExpired } from "./lib/rate-limiter.js";
import { getSwaggerPage, getSwaggerSpec } from "./views/swagger.view.js";
import { ServiceError } from "../../contracts/service-error.js";
import { Pool } from "pg";
import * as response from "../../libs/response.js";

const db = new Pool({
	connectionString: process.env.DATABASE_URL,
});

const controller = new AuthController();

async function toResponse(
	result: Promise<Response | ServiceError>,
): Promise<Response> {
	const value = await result;
	return value instanceof ServiceError ? response.error(value) : value;
}

const server = Bun.serve({
	port: 3003,
	routes: {
		"/health": {
			GET: () => new Response(JSON.stringify({ status: "ok" }), {
				headers: { "Content-Type": "application/json" },
			}),
		},
		"/swagger": getSwaggerPage,
		"/swagger.json": getSwaggerSpec,
		"/create-user": {
			POST: async (req) => toResponse(controller.createUser(req)),
		},
		"/login": {
			POST: async (req) => toResponse(controller.login(req)),
		},
		"/verify": {
			GET: async (req) => toResponse(controller.verify(req)),
		},
	},
	fetch() {
		return new Response("Unmatched route");
	},
});

console.log(`Auth service → http://localhost:${server.port}`);

// Cleanup expired rate limit entries every 2 minutes
setInterval(clearExpired, 120_000);

async function shutdown() {
	console.log("Shutting down...");
	await server.stop();
	console.log("Server stopped. Closing DB pool...");
	await db.end();
	console.log("DB pool closed.");
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
