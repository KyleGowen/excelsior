import { User } from '../types';

export interface UserRepository {
  // Initialization
  initialize(): Promise<void>;

  // User management
  createUser(name: string, email: string, passwordHash: string): Promise<User>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  authenticateUser(username: string, password: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Statistics
  getUserStats(): Promise<{
    users: number;
  }>;
}
