import { Pool, PoolClient } from 'pg';
import { User } from '../types';
import { UserRepository } from '../repository/UserRepository';

export class PostgreSQLUserRepository implements UserRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async initialize(): Promise<void> {
    // PostgreSQL UserRepository doesn't need to load data from files
    // Data is already in the database from migrations
    console.log('✅ PostgreSQL UserRepository initialized');
  }

  async createUser(name: string, email: string, passwordHash: string): Promise<User> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
        [name, email, passwordHash]
      );
      
      const user = result.rows[0];
      return {
        id: user.id,
        name: user.username, // Map username to name for compatibility
        email: user.email
      };
    } finally {
      client.release();
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const user = result.rows[0];
      return {
        id: user.id,
        name: user.username, // Map username to name for compatibility
        email: user.email
      };
    } finally {
      client.release();
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const user = result.rows[0];
      return {
        id: user.id,
        name: user.username, // Map username to name for compatibility
        email: user.email
      };
    } finally {
      client.release();
    }
  }

  async getAllUsers(): Promise<User[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM users ORDER BY created_at');
      
      return result.rows.map(user => ({
        id: user.id,
        name: user.username, // Map username to name for compatibility
        email: user.email
      }));
    } finally {
      client.release();
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const client = await this.pool.connect();
    try {
      const setClause = [];
      const values = [];
      let paramCount = 1;

      if (updates.name !== undefined) {
        setClause.push(`username = $${paramCount++}`);
        values.push(updates.name);
      }
      if (updates.email !== undefined) {
        setClause.push(`email = $${paramCount++}`);
        values.push(updates.email);
      }

      if (setClause.length === 0) {
        return this.getUserById(id);
      }

      setClause.push(`updated_at = NOW()`);
      values.push(id);

      const result = await client.query(
        `UPDATE users SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return undefined;
      }

      const user = result.rows[0];
      return {
        id: user.id,
        name: user.username, // Map username to name for compatibility
        email: user.email
      };
    } finally {
      client.release();
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('DELETE FROM users WHERE id = $1', [id]);
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }

  async getUserStats(): Promise<{ users: number }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT COUNT(*) as count FROM users');
      return {
        users: parseInt(result.rows[0].count)
      };
    } finally {
      client.release();
    }
  }
}
