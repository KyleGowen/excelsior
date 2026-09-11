import request from 'supertest';
import { Pool } from 'pg';
import { app } from '../setup-integration';

// Helper function to cleanup test users created by signup (decks cascade delete)
const cleanupTestUser = async (userId: string) => {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower'
    });

    try {
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    } finally {
        await pool.end();
    }
};

const countSignupStarterCopies = async (userId: string): Promise<number> => {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower'
    });

    try {
        const result = await pool.query(
            'SELECT COUNT(*)::int AS count FROM decks WHERE user_id = $1 AND is_signup_starter_copy = TRUE',
            [userId]
        );
        return result.rows[0].count;
    } finally {
        await pool.end();
    }
};

describe('User Signup Integration Tests', () => {
    const uniqueSuffix = () => `_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    it('should create a user account via POST /api/auth/signup and auto-login with session', async () => {
        let userId: string | null = null;
        try {
            const suffix = uniqueSuffix();
            const username = `signupuser${suffix}`;
            const email = `signup${suffix}@example.com`;
            const password = 'SecurePassword123';

            const response = await request(app)
                .post('/api/auth/signup')
                .send({ username, email, password });

            expect(response.status).toBe(201);
            userId = response.body.data.userId;
            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                userId: expect.any(String),
                username: username
            });
            expect(userId).toBeTruthy();

            // Assert session cookie is set
            const setCookie = response.headers['set-cookie'];
            expect(setCookie).toBeDefined();
            const cookieHeaders = Array.isArray(setCookie) ? setCookie : (setCookie ? [setCookie] : []);
            const sessionCookie = cookieHeaders.find((c: string) => c.startsWith('sessionId='));
            expect(sessionCookie).toBeTruthy();

            // Verify user can call /api/auth/me with that cookie and get user back
            const cookieValue = typeof sessionCookie === 'string' ? sessionCookie.split(';')[0] : '';
            const meResponse = await request(app)
                .get('/api/auth/me')
                .set('Cookie', cookieValue);

            expect(meResponse.status).toBe(200);
            expect(meResponse.body.success).toBe(true);
            expect(meResponse.body.data).toMatchObject({
                id: userId,
                name: username
            });
        } finally {
            if (userId) await cleanupTestUser(userId);
        }
    });

    it('should return 409 when username already exists', async () => {
        let userId: string | null = null;
        try {
            const suffix = uniqueSuffix();
            const username = `dupuser${suffix}`;
            const email = `dup1${suffix}@example.com`;
            const password = 'password123';

            const firstResponse = await request(app)
                .post('/api/auth/signup')
                .send({ username, email, password });

            expect(firstResponse.status).toBe(201);
            userId = firstResponse.body.data.userId;

            const secondResponse = await request(app)
                .post('/api/auth/signup')
                .send({
                    username,
                    email: `dup2${suffix}@example.com`,
                    password: 'otherpassword'
                });

            expect(secondResponse.status).toBe(409);
            expect(secondResponse.body.success).toBe(false);
            expect(secondResponse.body.error).toBe('Username already exists');
        } finally {
            if (userId) await cleanupTestUser(userId);
        }
    });

    it('should return 409 when email already exists', async () => {
        let userId: string | null = null;
        try {
            const suffix = uniqueSuffix();
            const username1 = `dup1${suffix}`;
            const username2 = `dup2${suffix}`;
            const email = `dupemail${suffix}@example.com`;
            const password = 'password123';

            const firstResponse = await request(app)
                .post('/api/auth/signup')
                .send({ username: username1, email, password });

            expect(firstResponse.status).toBe(201);
            userId = firstResponse.body.data.userId;

            const secondResponse = await request(app)
                .post('/api/auth/signup')
                .send({
                    username: username2,
                    email,
                    password: 'otherpassword'
                });

            expect(secondResponse.status).toBe(409);
            expect(secondResponse.body.success).toBe(false);
            expect(secondResponse.body.error).toBe('Email already exists');
        } finally {
            if (userId) await cleanupTestUser(userId);
        }
    });

    it('should create a sample deck for new user (copy of random guest deck)', async () => {
        let userId: string | null = null;
        try {
            const suffix = uniqueSuffix();
            const username = `signupdeck${suffix}`;
            const email = `signupdeck${suffix}@example.com`;
            const password = 'SecurePassword123';

            const response = await request(app)
                .post('/api/auth/signup')
                .send({ username, email, password });

            expect(response.status).toBe(201);
            userId = response.body.data.userId;
            expect(userId).toBeTruthy();

            const setCookie = response.headers['set-cookie'];
            const cookieHeaders = Array.isArray(setCookie) ? setCookie : (setCookie ? [setCookie] : []);
            const sessionCookie = cookieHeaders.find((c: string) => c.startsWith('sessionId='));
            expect(sessionCookie).toBeTruthy();

            const cookieValue = typeof sessionCookie === 'string' ? sessionCookie.split(';')[0] : '';

            const decksResponse = await request(app)
                .get('/api/v1/decks')
                .set('Cookie', cookieValue);

            expect(decksResponse.status).toBe(200);
            expect(decksResponse.body.errors).toEqual([]);
            expect(Array.isArray(decksResponse.body.data)).toBe(true);
            expect(decksResponse.body.data.length).toBeGreaterThanOrEqual(1);

            const sampleDeck = decksResponse.body.data.find((d: any) => {
                const name = (d.metadata && d.metadata.name) || d.name || '';
                return String(name).startsWith('Sample: ');
            });
            expect(sampleDeck).toBeTruthy();
            expect(sampleDeck.metadata.name).toMatch(/^Sample: /);
            await expect(countSignupStarterCopies(userId!)).resolves.toBe(1);
        } finally {
            if (userId) await cleanupTestUser(userId);
        }
    });
});
