import fs from 'fs';
import path from 'path';
import { User } from '../types';

// Legacy User interface for backward compatibility
export interface LegacyUser {
  id: string;
  username: string;
  password: string; // Plain text for now, will be hashed later
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface UserSession {
  userId: string;
  username: string;
  expiresAt: Date;
}

export class UserPersistenceService {
  private users: Map<string, LegacyUser> = new Map();
  private sessions: Map<string, UserSession> = new Map();
  private usersFilePath: string;
  private sessionsFilePath: string;

  constructor() {
    this.usersFilePath = path.join(process.cwd(), 'data/users.json');
    this.sessionsFilePath = path.join(process.cwd(), 'data/sessions.json');
    this.loadUsers();
    this.loadSessions();
  }

  private loadUsers(): void {
    try {
      if (fs.existsSync(this.usersFilePath)) {
        const data = fs.readFileSync(this.usersFilePath, 'utf8');
        const usersArray = JSON.parse(data);
        this.users.clear();
        usersArray.forEach((user: any) => {
          this.users.set(user.id, {
            ...user,
            createdAt: new Date(user.createdAt),
            lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : undefined
          });
        });
        console.log(`✅ Loaded ${this.users.size} users`);
        
        // Always ensure we have the correct users with updated passwords
        this.ensureCorrectUsers();
      } else {
        // Create initial user if no users file exists
        this.createInitialUser();
      }
    } catch (error) {
      console.error('Error loading users:', error);
      this.createInitialUser();
    }
  }

  private loadSessions(): void {
    try {
      if (fs.existsSync(this.sessionsFilePath)) {
        const data = fs.readFileSync(this.sessionsFilePath, 'utf8');
        const sessionsArray = JSON.parse(data);
        this.sessions.clear();
        sessionsArray.forEach((session: any) => {
          this.sessions.set(session.sessionId, {
            ...session,
            expiresAt: new Date(session.expiresAt)
          });
        });
        console.log(`✅ Loaded ${this.sessions.size} active sessions`);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }

  private saveUsers(): void {
    try {
      const usersArray = Array.from(this.users.values());
      fs.writeFileSync(this.usersFilePath, JSON.stringify(usersArray, null, 2));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  private saveSessions(): void {
    try {
      const sessionsArray = Array.from(this.sessions.entries()).map(([sessionId, session]) => ({
        sessionId,
        ...session
      }));
      fs.writeFileSync(this.sessionsFilePath, JSON.stringify(sessionsArray, null, 2));
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  }

  private createInitialUser(): void {
    const initialUser: LegacyUser = {
      id: 'kyle-001',
      username: 'kyle',
      password: 'Overpower2025!',
      createdAt: new Date()
    };
    this.users.set(initialUser.id, initialUser);

    const guestUser: LegacyUser = {
      id: '00000000-0000-0000-0000-000000000001',
      username: 'guest',
      password: 'GuestAccess2025!',
      createdAt: new Date()
    };
    this.users.set(guestUser.id, guestUser);

    this.saveUsers();
    console.log('✅ Created initial users: kyle and guest');
  }

  private ensureCorrectUsers(): void {
    let updated = false;

    // Ensure kyle user exists with correct password
    const kyleUser = this.users.get('kyle-001');
    if (!kyleUser || kyleUser.password !== 'Overpower2025!') {
      this.users.set('kyle-001', {
        id: 'kyle-001',
        username: 'kyle',
        password: 'Overpower2025!',
        createdAt: kyleUser?.createdAt || new Date(),
        lastLoginAt: kyleUser?.lastLoginAt
      });
      updated = true;
      console.log('✅ Updated kyle user with correct password');
    }

    // Ensure guest user exists with correct password
    const guestUser = this.users.get('00000000-0000-0000-0000-000000000001');
    if (!guestUser || guestUser.password !== 'GuestAccess2025!') {
      this.users.set('00000000-0000-0000-0000-000000000001', {
        id: '00000000-0000-0000-0000-000000000001',
        username: 'guest',
        password: 'GuestAccess2025!',
        createdAt: guestUser?.createdAt || new Date(),
        lastLoginAt: guestUser?.lastLoginAt
      });
      updated = true;
      console.log('✅ Updated guest user with correct password');
    }

    if (updated) {
      this.saveUsers();
      console.log('✅ User passwords updated successfully');
    }
  }

  public authenticateUser(username: string, password: string): User | null {
    for (const user of this.users.values()) {
      if (user.username === username && user.password === password) {
        user.lastLoginAt = new Date();
        this.saveUsers();
        return {
          id: user.id,
          name: user.username,
          email: '', // Legacy users don't have email
          role: user.username === 'guest' ? 'GUEST' as any : 'USER' as any // Guest role for guest user
        };
      }
    }
    return null;
  }

  public createSession(user: User): string {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
    
    const session: UserSession = {
      userId: user.id,
      username: user.name,
      expiresAt
    };
    
    this.sessions.set(sessionId, session);
    this.saveSessions();
    
    return sessionId;
  }

  public validateSession(sessionId: string): UserSession | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    // Check if session has expired
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      this.saveSessions();
      return null;
    }
    
    return session;
  }

  public getUserById(userId: string): User | null {
    const legacyUser = this.users.get(userId);
    if (!legacyUser) return null;
    
    return {
      id: legacyUser.id,
      name: legacyUser.username,
      email: '', // Legacy users don't have email
      role: legacyUser.username === 'guest' ? 'GUEST' as any : 'USER' as any // Guest role for guest user
    };
  }

  public getUserByUsername(username: string): User | null {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return {
          id: user.id,
          name: user.username,
          email: '', // Legacy users don't have email
          role: user.username === 'guest' ? 'GUEST' as any : 'USER' as any // Guest role for guest user
        };
      }
    }
    return null;
  }

  public logout(sessionId: string): boolean {
    if (this.sessions.has(sessionId)) {
      this.sessions.delete(sessionId);
      this.saveSessions();
      return true;
    }
    return false;
  }

  public getAllUsers(): User[] {
    return Array.from(this.users.values()).map(legacyUser => ({
      id: legacyUser.id,
      name: legacyUser.username,
      email: '', // Legacy users don't have email
      role: legacyUser.username === 'guest' ? 'GUEST' as any : 'USER' as any // Guest role for guest user
    }));
  }

  public getActiveSessions(): UserSession[] {
    return Array.from(this.sessions.values());
  }

  private generateSessionId(): string {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
  }

  // Clean up expired sessions (call this periodically)
  public cleanupExpiredSessions(): number {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.saveSessions();
      console.log(`🧹 Cleaned up ${cleanedCount} expired sessions`);
    }
    
    return cleanedCount;
  }
}
