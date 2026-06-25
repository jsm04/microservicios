import { randomUUID } from 'node:crypto';

// --- Types ---

export interface User {
	id: string;
	name: string;
	email: string;
	password: string; // SHA-256 hash
}

// --- In-memory store ---

const users: User[] = [];

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
	const user: User = { id, name, email, password: hashedPassword };
	users.push(user);
	return user;
}

export function findUserByEmail(email: string): User | undefined {
	return users.find((u) => u.email === email);
}

export function findUserById(id: string): User | undefined {
	return users.find((u) => u.id === id);
}

export function emailExists(email: string): boolean {
	return users.some((u) => u.email === email);
}

export async function verifyPassword(
	password: string,
	hash: string,
): Promise<boolean> {
	return (await hashPassword(password)) === hash;
}
