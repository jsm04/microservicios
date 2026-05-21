import * as model from '../models/user.model.js';
import * as view from '../views/response.view.js';

export async function listUsers(): Promise<Response> {
	const users = await model.findAllUsers();
	return view.json(users);
}

export async function createUser(req: Request): Promise<Response> {
	const body = (await req.json()) as { name?: string; email?: string };

	// Validation
	if (!body.name || !body.email) {
		return view.text('Missing required fields: name and email', 400);
	}
	if (body.name.trim() === '' || body.email.trim() === '') {
		return view.text('Fields cannot be empty', 400);
	}

	try {
		const user = await model.createUser(body.name, body.email);
		return view.json(user, 201);
	} catch (err: any) {
		if (err.code === '23505') {
			return view.text('Email already exists', 400);
		}
		return view.text('Internal server error', 500);
	}
}

export async function getUserById(req: Request): Promise<Response> {
	const id = (req as any).params?.id;

	const user = await model.findUserById(id);
	if (!user) {
		return view.text('Not found', 404);
	}
	return view.json(user);
}
