export interface UserClient {
  /** Find a user by ID. Returns null if not found. */
  findUser(id: string): Promise<User | null>;
}

export interface User {
  id: number;
  name: string;
  email: string;
}
