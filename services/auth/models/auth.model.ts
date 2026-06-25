import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';

const db = new Pool({
	connectionString: process.env.DATABASE_URL,
});

// --- Types ---

export interface User {
	id: string;
	name: string;
	email: string;
	password: string; // SHA-256 hash
}

// --- Password hashing ---

async function hashPassword(password: string): Promise<string> {
	const salt = process.env.PASSWORD_SALT || 'default-salt';
	const encoder = new TextEncoder();
	const data = encoder.encode(password + salt);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// --- Public API ---

export async function createUser(
	name: string,
	email: string,
	password: string,
): Promise<User> {
	const hashedPassword = await hashPassword(password);
	const id = randomUUID();
	const res = await db.query(
		'INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
		[id, name, email, hashedPassword],
	);
	return { id: res.rows[0].id, name: res.rows[0].name, email: res.rows[0].email, password: hashedPassword };
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
	const res = await db.query(
		'SELECT id, name, email, password FROM users WHERE email = $1',
		[email],
	);
	if (res.rows.length === 0) return undefined;
	const row = res.rows[0];
	return { id: row.id, name: row.name, email: row.email, password: row.password };
}

export async function findUserById(id: string): Promise<User | undefined> {
	const res = await db.query(
		'SELECT id, name, email, password FROM users WHERE id = $1',
		[id],
	);
	if (res.rows.length === 0) return undefined;
	const row = res.rows[0];
	return { id: row.id, name: row.name, email: row.email, password: row.password };
}

export async function emailExists(email: string): Promise<boolean> {
	const res = await db.query(
		'SELECT 1 FROM users WHERE email = $1 LIMIT 1',
		[email],
	);
	return res.rows.length > 0;
}

export async function verifyPassword(
	password: string,
	hash: string,
): Promise<boolean> {
	return (await hashPassword(password)) === hash;
}
