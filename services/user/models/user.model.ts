import { Pool } from 'pg';

const db = new Pool({
	connectionString: process.env.DATABASE_URL,
});

export interface User {
	id: number;
	name: string;
	email: string;
	created_at: string;
}

export async function findAllUsers(): Promise<User[]> {
	const res = await db.query(
		'SELECT id, name, email, created_at FROM users ORDER BY id',
	);
	return res.rows;
}

export async function findUserById(id: string): Promise<User | null> {
	const res = await db.query(
		'SELECT id, name, email, created_at FROM users WHERE id = $1',
		[id],
	);
	return res.rows.length > 0 ? res.rows[0] : null;
}

export async function createUser(name: string, email: string): Promise<User> {
	const res = await db.query(
		'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at',
		[name, email],
	);
	return res.rows[0];
}
