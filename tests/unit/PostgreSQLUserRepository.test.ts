import { Pool, PoolClient } from 'pg';
import { PostgreSQLUserRepository } from '../../src/database/PostgreSQLUserRepository';
import { User, UserRole } from '../../src/types';

// Mock pg module
jest.mock('pg', () => ({
  Pool: jest.fn(),
  PoolClient: jest.fn()
}));

describe('PostgreSQLUserRepository', () => {
  let repository: PostgreSQLUserRepository;
  let mockPool: any;
  let mockClient: any;

  beforeEach(() => {
    // Create mock client
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };

    // Create mock pool
    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient)
    };

    // Create repository instance
    repository = new PostgreSQLUserRepository(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      };

      mockClient.query.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: []
      });

      const result = await repository.createUser('testuser', 'test@example.com', 'hashedpassword', 'USER');

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith(
        'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
        ['testuser', 'test@example.com', 'hashedpassword', 'USER']
      );
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'user-123',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      });
    });

    it('should handle database errors during user creation', async () => {
      const error = new Error('Database connection failed');
      mockClient.query.mockRejectedValueOnce(error);

      await expect(repository.createUser('testuser', 'test@example.com', 'hashedpassword', 'USER'))
        .rejects.toThrow('Database connection failed');

      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      };

      mockClient.query.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await repository.getUserById('user-123');

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        ['user-123']
      );
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'user-123',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      });
    });

    it('should return undefined when user not found', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await repository.getUserById('nonexistent');

      expect(result).toBeUndefined();
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle database errors during get user by id', async () => {
      const error = new Error('Database query failed');
      mockClient.query.mockRejectedValueOnce(error);

      await expect(repository.getUserById('user-123'))
        .rejects.toThrow('Database query failed');

      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getUserByUsername', () => {
    it('should return user when found by username', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      };

      mockClient.query.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await repository.getUserByUsername('testuser');

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE username = $1',
        ['testuser']
      );
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'user-123',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      });
    });

    it('should return undefined when user not found by username', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await repository.getUserByUsername('nonexistent');

      expect(result).toBeUndefined();
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('authenticateUser', () => {
    it('should return user when credentials are valid', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      };

      mockClient.query.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await repository.authenticateUser('testuser', 'password123');

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE username = $1 AND password_hash = $2',
        ['testuser', 'password123']
      );
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'user-123',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      });
    });

    it('should return undefined when credentials are invalid', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await repository.authenticateUser('testuser', 'wrongpassword');

      expect(result).toBeUndefined();
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          username: 'user1',
          email: 'user1@example.com',
          role: 'USER'
        },
        {
          id: 'user-2',
          username: 'user2',
          email: 'user2@example.com',
          role: 'ADMIN'
        }
      ];

      mockClient.query.mockResolvedValueOnce({
        rows: mockUsers,
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await repository.getAllUsers();

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM users ORDER BY created_at');
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'user-1',
        name: 'user1',
        email: 'user1@example.com',
        role: 'USER'
      });
      expect(result[1]).toEqual({
        id: 'user-2',
        name: 'user2',
        email: 'user2@example.com',
        role: 'ADMIN'
      });
    });

    it('should return empty array when no users exist', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await repository.getAllUsers();

      expect(result).toEqual([]);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'updateduser',
        email: 'updated@example.com',
        role: 'ADMIN'
      };

      mockClient.query.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const updates = { name: 'updateduser', email: 'updated@example.com', role: 'ADMIN' as UserRole };
      const result = await repository.updateUser('user-123', updates);

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith(
        'UPDATE users SET username = $1, email = $2, role = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
        ['updateduser', 'updated@example.com', 'ADMIN', 'user-123']
      );
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'user-123',
        name: 'updateduser',
        email: 'updated@example.com',
        role: 'ADMIN'
      });
    });

    it('should return undefined when user not found for update', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const updates = { name: 'updateduser' };
      const result = await repository.updateUser('nonexistent', updates);

      expect(result).toBeUndefined();
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle empty updates by calling getUserById', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      };

      // First call for getUserById
      mockClient.query.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await repository.updateUser('user-123', {});

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        ['user-123']
      );
      expect(result).toEqual({
        id: 'user-123',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: 'DELETE',
        oid: 0,
        fields: []
      });

      const result = await repository.deleteUser('user-123');

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM users WHERE id = $1',
        ['user-123']
      );
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when user not found for deletion', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'DELETE',
        oid: 0,
        fields: []
      });

      const result = await repository.deleteUser('nonexistent');

      expect(result).toBe(false);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ count: '42' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await repository.getUserStats();

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM users');
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toEqual({ users: 42 });
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      const error = new Error('Connection failed');
      mockPool.connect.mockRejectedValueOnce(error);

      await expect(repository.createUser('testuser', 'test@example.com', 'password', 'USER'))
        .rejects.toThrow('Connection failed');
    });

    it('should handle query errors', async () => {
      const error = new Error('Query failed');
      mockClient.query.mockRejectedValueOnce(error);

      await expect(repository.getUserById('user-123'))
        .rejects.toThrow('Query failed');

      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});