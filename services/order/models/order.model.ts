import { Pool } from 'pg';

const db = new Pool({
	connectionString: process.env.DATABASE_URL,
});

export interface Order {
	id: number;
	user_id: number;
	items: string[];
	total: number;
	created_at: string;
}

export async function findAllOrders(): Promise<Order[]> {
	const res = await db.query(
		'SELECT id, user_id, items, total, created_at FROM orders ORDER BY id',
	);
	// pg returns NUMERIC as string; convert to number
	return res.rows.map((r) => ({
		...r,
		total: Number(r.total),
	}));
}

export async function findOrderById(id: string): Promise<Order | null> {
	const res = await db.query(
		'SELECT id, user_id, items, total, created_at FROM orders WHERE id = $1',
		[id],
	);
	return res.rows.length > 0 ? res.rows[0] : null;
}

export async function createOrder(
	userId: string,
	items: string[],
	total: number,
): Promise<Order> {
	const res = await db.query(
		'INSERT INTO orders (user_id, items, total) VALUES ($1, $2, $3) RETURNING id, user_id, items, total, created_at',
		[userId, JSON.stringify(items), total],
	);
	return res.rows[0];
}
