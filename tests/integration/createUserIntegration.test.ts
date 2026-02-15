import request from 'supertest';
import { app, integrationTestUtils } from '../setup-integration';

// Helper function to cleanup test users
const cleanupTestUser = async (userId: string) => {
    const { Pool } = require('pg');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower'
    });
    
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    } finally {
        await pool.end();
    }
};

describe('Create User Integration Tests', () => {
    let adminUser: any;
    let regularUser: any;
    let adminAuthToken: string;
    let userAuthToken: string;

    beforeAll(async () => {
        // Create an ADMIN user for testing
        adminUser = await integrationTestUtils.createTestUser({
            name: 'admin-test-user',
            email: 'admin@test.com',
            role: 'ADMIN'
        });

        // Create a regular USER for testing
        regularUser = await integrationTestUtils.createTestUser({
            name: 'regular-test-user',
            email: 'user@test.com',
            role: 'USER'
        });
    });

    beforeEach(async () => {
        // Login as admin user
        const adminLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                username: adminUser.username,
                password: 'password123' // Default password from createTestUser
            });

        expect(adminLoginResponse.status).toBe(200);
        adminAuthToken = adminLoginResponse.headers['set-cookie']?.[0] || '';

        // Login as regular user
        const userLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                username: regularUser.username,
                password: 'password123' // Default password from createTestUser
            });

        expect(userLoginResponse.status).toBe(200);
        userAuthToken = userLoginResponse.headers['set-cookie']?.[0] || '';
    });

    afterAll(async () => {
        // Clean up test users
        await cleanupTestUser(adminUser.id);
        await cleanupTestUser(regularUser.id);
    });

    describe('POST /api/users', () => {
        describe('Authorization', () => {
            it('should allow ADMIN users to create new users', async () => {
                const newUserData = {
                    username: 'new-test-user',
                    password: 'new-password'
                };

                const response = await request(app)
                    .post('/api/users')
                    .set('Cookie', adminAuthToken)
                    .send(newUserData);

                expect(response.status).toBe(201);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toMatchObject({
                    name: 'new-test-user',
                    email: 'new-test-user@example.com',
                    role: 'USER'
                });
                expect(response.body.data).not.toHaveProperty('password_hash');
                expect(response.body.message).toBe('User "new-test-user" created successfully');

                // Clean up the created user
                await cleanupTestUser(response.body.data.id);
            });

            it('should reject regular USER role from creating users', async () => {
                const newUserData = {
                    username: 'unauthorized-user',
                    password: 'unauthorized-password'
                };

                const response = await request(app)
                    .post('/api/users')
                    .set('Cookie', userAuthToken)
                    .send(newUserData);

                expect(response.status).toBe(403);
                expect(response.body.success).toBe(false);
                expect(response.body.error).toBe('Only ADMIN users can access this endpoint');
            });

            it('should reject unauthenticated requests', async () => {
                const newUserData = {
                    username: 'anonymous-user',
                    password: 'anonymous-password'
                };

                const response = await request(app)
                    .post('/api/users')
                    .send(newUserData);

                expect([401, 403]).toContain(response.status);
            });
        });

        describe('Input Validation', () => {
            it('should require username', async () => {
                const response = await request(app)
                    .post('/api/users')
                    .set('Cookie', adminAuthToken)
                    .send({
                        password: 'test-password'
                    });

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.error).toBe('Username and password are required');
            });

            it('should require password', async () => {
                const response = await request(app)
                    .post('/api/users')
                    .set('Cookie', adminAuthToken)
                    .send({
                        username: 'test-username'
                    });

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.error).toBe('Username and password are required');
            });

            it('should require both username and password', async () => {
                const response = await request(app)
                    .post('/api/users')
                    .set('Cookie', adminAuthToken)
                    .send({});

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.error).toBe('Username and password are required');
            });
        });

        describe('User Creation', () => {
            it('should create user with USER role by default', async () => {
                const newUserData = {
                    username: 'default-role-user',
                    password: 'default-password'
                };

                const response = await request(app)
                    .post('/api/users')
                    .set('Cookie', adminAuthToken)
                    .send(newUserData);

                expect(response.status).toBe(201);
                expect(response.body.data.role).toBe('USER');
                expect(response.body.data.email).toBe('default-role-user@example.com');

                // Clean up
                await cleanupTestUser(response.body.data.id);
            });

            it('should generate email from username', async () => {
                const newUserData = {
                    username: 'email-test-user',
                    password: 'email-password'
                };

                const response = await request(app)
                    .post('/api/users')
                    .set('Cookie', adminAuthToken)
                    .send(newUserData);

                expect(response.status).toBe(201);
                expect(response.body.data.email).toBe('email-test-user@example.com');

                // Clean up
                await cleanupTestUser(response.body.data.id);
            });

            it('should not return password hash in response', async () => {
                const newUserData = {
                    username: 'no-password-hash-user',
                    password: 'no-hash-password'
                };

                const response = await request(app)
                    .post('/api/users')
                    .set('Cookie', adminAuthToken)
                    .send(newUserData);

                expect(response.status).toBe(201);
                expect(response.body.data).not.toHaveProperty('password_hash');
                expect(response.body.data).toHaveProperty('id');
                expect(response.body.data).toHaveProperty('name');
                expect(response.body.data).toHaveProperty('email');
                expect(response.body.data).toHaveProperty('role');

                // Clean up
                await cleanupTestUser(response.body.data.id);
            });
        });

        describe('Duplicate Username Handling', () => {
            it('should reject duplicate usernames', async () => {
                const newUserData = {
                    username: 'duplicate-test-user',
                    password: 'duplicate-password'
                };

                // Create first user
                const firstResponse = await request(app)
                    .post('/api/users')
                    .set('Cookie', adminAuthToken)
                    .send(newUserData);

                expect(firstResponse.status).toBe(201);

                // Try to create second user with same username
                const secondResponse = await request(app)
                    .post('/api/users')
                    .set('Cookie', adminAuthToken)
                    .send(newUserData);

                expect(secondResponse.status).toBe(409);
                expect(secondResponse.body.success).toBe(false);
                expect(secondResponse.body.error).toBe('Username already exists');

                // Clean up
                await cleanupTestUser(firstResponse.body.data.id);
            });

            it('should allow different usernames', async () => {
                const firstUserData = {
                    username: 'unique-user-1',
                    password: 'unique-password-1'
                };

                const secondUserData = {
                    username: 'unique-user-2',
                    password: 'unique-password-2'
                };

                // Create first user
                const firstResponse = await request(app)
                    .post('/api/users')
                    .set('Cookie', adminAuthToken)
                    .send(firstUserData);

                expect(firstResponse.status).toBe(201);

                // Create second user with different username
                const secondResponse = await request(app)
                    .post('/api/users')
                    .set('Cookie', adminAuthToken)
                    .send(secondUserData);

                expect(secondResponse.status).toBe(201);
                expect(secondResponse.body.data.name).toBe('unique-user-2');

                // Clean up
                await cleanupTestUser(firstResponse.body.data.id);
                await cleanupTestUser(secondResponse.body.data.id);
            });
        });

        describe('Created User Functionality', () => {
            it('should allow created user to log in', async () => {
                const newUserData = {
                    username: 'login-test-user',
                    password: 'login-test-password'
                };

                // Create user
                const createResponse = await request(app)
                    .post('/api/users')
                    .set('Cookie', adminAuthToken)
                    .send(newUserData);

                expect(createResponse.status).toBe(201);
                const createdUserId = createResponse.body.data.id;

                // Try to log in with created user
                const loginResponse = await request(app)
                    .post('/api/auth/login')
                    .send({
                        username: newUserData.username,
                        password: newUserData.password
                    });

                expect(loginResponse.status).toBe(200);
                expect(loginResponse.body.success).toBe(true);
                expect(loginResponse.body.data.userId).toBe(createdUserId);

                // Clean up
                await cleanupTestUser(createdUserId);
            });

            it('should reject login with wrong password', async () => {
                const newUserData = {
                    username: 'wrong-password-user',
                    password: 'correct-password'
                };

                // Create user
                const createResponse = await request(app)
                    .post('/api/users')
                    .set('Cookie', adminAuthToken)
                    .send(newUserData);

                expect(createResponse.status).toBe(201);
                const createdUserId = createResponse.body.data.id;

                // Try to log in with wrong password
                const loginResponse = await request(app)
                    .post('/api/auth/login')
                    .send({
                        username: newUserData.username,
                        password: 'wrong-password'
                    });

                expect(loginResponse.status).toBe(401);
                expect(loginResponse.body.success).toBe(false);

                // Clean up
                await cleanupTestUser(createdUserId);
            });
        });

        describe('Error Handling', () => {
            it('should handle malformed JSON gracefully', async () => {
                const response = await request(app)
                    .post('/api/users')
                    .set('Cookie', adminAuthToken)
                    .set('Content-Type', 'application/json')
                    .send('invalid json');

                expect([400, 500]).toContain(response.status);
            });

            it('should handle missing Content-Type header', async () => {
                const response = await request(app)
                    .post('/api/users')
                    .set('Cookie', adminAuthToken)
                    .send('username=test&password=test');

                expect([400, 500]).toContain(response.status);
            });
        });
    });

    describe('GET /api/users', () => {
        it('should require authentication', async () => {
            const response = await request(app).get('/api/users');
            expect(response.status).toBe(401);
        });

        it('should allow ADMIN to list users', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Cookie', adminAuthToken);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should include created users in the list', async () => {
            const uniqueSuffix = `_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const newUserData = {
                username: `list-test-user${uniqueSuffix}`,
                password: 'list-test-password'
            };

            // Create user
            const createResponse = await request(app)
                .post('/api/users')
                .set('Cookie', adminAuthToken)
                .send(newUserData);

            expect(createResponse.status).toBe(201);
            const createdUserId = createResponse.body.data.id;

            // Get users list
            const listResponse = await request(app)
                .get('/api/users')
                .set('Cookie', adminAuthToken);

            expect(listResponse.status).toBe(200);
            expect(listResponse.body.success).toBe(true);
            
            // Check if created user is in the list
            const userInList = listResponse.body.data.find((user: any) => user.id === createdUserId);
            expect(userInList).toBeDefined();
            expect(userInList.name).toBe(`list-test-user${uniqueSuffix}`);

            // Clean up
            await cleanupTestUser(createdUserId);
        });
    });
});
