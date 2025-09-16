import { User } from '../types';
import { UserRepository } from '../repository/UserRepository';

export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();
  private nextUserId = 1;

  async initialize(): Promise<void> {
    // User repository doesn't need to load any data from files
    // Users are created dynamically
  }

  async createUser(name: string, email: string, passwordHash: string): Promise<User> {
    const id = `user_${this.nextUserId++}`;
    const user: User = { 
      id, 
      name, 
      email
    };
    this.users.set(id, user);
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.name === username);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getUserStats(): Promise<{ users: number }> {
    return {
      users: this.users.size
    };
  }
}
