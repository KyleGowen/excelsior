import { Pool, PoolClient } from 'pg';
import { User, UserRole } from '../types';
import { UserRepository } from '../repository/UserRepository';
import { PasswordUtils } from '../utils/passwordUtils';

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

  async createUser(name: string, email: string, password: string, role: UserRole = 'USER'): Promise<User> {
    const client = await this.pool.connect();
    try {
      // Hash the password before storing it
      const passwordHash = await PasswordUtils.hashPassword(password);
      
      const result = await client.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, email, passwordHash, role]
      );
      
      const user = result.rows[0];
      return {
        id: user.id,
        name: user.username, // Map username to name for compatibility
        email: user.email,
        role: user.role
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
        email: user.email,
        role: user.role
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
        email: user.email,
        role: user.role
      };
    } finally {
      client.release();
    }
  }

  async authenticateUser(username: string, password: string): Promise<User | undefined> {
    const client = await this.pool.connect();
    try {
      console.log('🔍 DEBUG: PostgreSQL authenticateUser called:', {
        username,
        passwordLength: password?.length,
        timestamp: new Date().toISOString()
      });
      
      // First, get the user by username to retrieve the stored hash
      const result = await client.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      
      console.log('🔍 DEBUG: Database query result:', {
        username,
        rowsFound: result.rows.length,
        timestamp: new Date().toISOString()
      });
      
      if (result.rows.length === 0) {
        console.log('❌ DEBUG: User not found in database:', { username });
        return undefined;
      }
      
      const user = result.rows[0];
      console.log('🔍 DEBUG: User found in database:', {
        username,
        userId: user.id,
        role: user.role,
        passwordHashPrefix: user.password_hash?.substring(0, 20) + '...',
        timestamp: new Date().toISOString()
      });
      
      // Compare the provided password with the stored hash using bcrypt
      const isPasswordValid = await PasswordUtils.comparePassword(password, user.password_hash);
      
      console.log('🔍 DEBUG: Password comparison result:', {
        username,
        isPasswordValid,
        timestamp: new Date().toISOString()
      });
      
      if (!isPasswordValid) {
        console.log('❌ DEBUG: Password validation failed:', { username });
        return undefined;
      }
      
      console.log('✅ DEBUG: User authenticated successfully:', {
        username,
        userId: user.id,
        role: user.role
      });
      
      return {
        id: user.id,
        name: user.username, // Map username to name for compatibility
        email: user.email,
        role: user.role
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
        email: user.email,
        role: user.role
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
      if (updates.role !== undefined) {
        setClause.push(`role = $${paramCount++}`);
        values.push(updates.role);
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
        email: user.email,
        role: user.role
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
