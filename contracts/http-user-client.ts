import type { UserClient, User } from './user-client.js';

export class HttpUserClient implements UserClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
  }

  async findUser(id: string): Promise<User | null> {
    const res = await fetch(`${this.baseUrl}/users/${id}`);
    if (!res.ok) return null;
    return res.json() as Promise<User>;
  }
}
