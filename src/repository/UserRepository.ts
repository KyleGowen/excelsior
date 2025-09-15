import { User } from '../types';

export interface UserRepository {
  // Initialization
  initialize(): Promise<void>;

  // User management
  createUser(name: string, email: string): User;
  getUserById(id: string): User | undefined;
  getAllUsers(): User[];

  // Statistics
  getUserStats(): {
    users: number;
  };
}
