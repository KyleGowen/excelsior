import { User } from '../types';
import { UserRepository } from '../repository/UserRepository';

export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();
  private nextUserId = 1;

  async initialize(): Promise<void> {
    // User repository doesn't need to load any data from files
    // Users are created dynamically
  }

  createUser(name: string, email: string): User {
    const id = `user_${this.nextUserId++}`;
    const user: User = { id, name, email };
    this.users.set(id, user);
    return user;
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  getUserStats(): { users: number } {
    return {
      users: this.users.size
    };
  }
}
