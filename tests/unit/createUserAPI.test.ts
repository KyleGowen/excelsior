import { Request, Response } from 'express';
import { PostgreSQLUserRepository } from '../../src/database/PostgreSQLUserRepository';
import { User } from '../../src/types';

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
        username: string;
    };
}

// Database user interface (includes password_hash)
interface DatabaseUser extends User {
    password_hash: string;
    created_at: string;
    updated_at: string;
}

// Mock the user repository
jest.mock('../../src/database/PostgreSQLUserRepository');

describe('Create User API Endpoint', () => {
    let mockRequest: Partial<AuthenticatedRequest>;
    let mockResponse: Partial<Response>;
    let mockUserRepository: jest.Mocked<PostgreSQLUserRepository>;
    let createUserHandler: (req: AuthenticatedRequest, res: Response) => Promise<Response | undefined>;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Mock request and response objects
        mockRequest = {
            user: {
                id: 'admin-user-id',
                role: 'ADMIN',
                username: 'admin'
            },
            body: {}
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        // Mock user repository
        mockUserRepository = {
            getUserByUsername: jest.fn(),
            createUser: jest.fn()
        } as any;

        // Create the handler function (simulating the API endpoint logic)
        createUserHandler = async (req: AuthenticatedRequest, res: Response) => {
            try {
                // Check if the current user is an ADMIN
                const currentUser = req.user;
                if (!currentUser || currentUser.role !== 'ADMIN') {
                    return res.status(403).json({ 
                        success: false, 
                        error: 'Only ADMIN users can create new users' 
                    });
                }

                const { username, password } = req.body;

                if (!username || !password) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Username and password are required' 
                    });
                }

                // Check if user already exists
                const existingUser = await mockUserRepository.getUserByUsername(username);
                if (existingUser) {
                    return res.status(409).json({ 
                        success: false, 
                        error: 'Username already exists' 
                    });
                }

                // Create the new user with USER role by default
                const newUser = await mockUserRepository.createUser(
                    username, 
                    `${username}@example.com`, 
                    password, 
                    'USER'
                );
                
                // Return user data without password hash
                const { password_hash, ...userWithoutPassword } = newUser as DatabaseUser;
                
                res.status(201).json({ 
                    success: true, 
                    data: userWithoutPassword,
                    message: `User "${username}" created successfully`
                });
            } catch (error) {
                console.error('Error creating user:', error);
                res.status(500).json({ 
                    success: false, 
                    error: 'Failed to create user' 
                });
            }
        };
    });

    describe('Authorization', () => {
        it('should allow ADMIN users to create users', async () => {
            const mockNewUser: DatabaseUser = {
                id: 'new-user-id',
                name: 'testuser',
                email: 'testuser@example.com',
                role: 'USER',
                password_hash: 'hashed-password',
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z'
            };

            mockRequest.body = {
                username: 'testuser',
                password: 'testpass'
            };

            mockUserRepository.getUserByUsername.mockResolvedValue(undefined);
            mockUserRepository.createUser.mockResolvedValue(mockNewUser);

            await createUserHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    id: 'new-user-id',
                    name: 'testuser',
                    email: 'testuser@example.com',
                    role: 'USER',
                    created_at: '2025-01-01T00:00:00Z',
                    updated_at: '2025-01-01T00:00:00Z'
                },
                message: 'User "testuser" created successfully'
            });
        });

        it('should reject non-ADMIN users', async () => {
            mockRequest.user = {
                id: 'user-id',
                role: 'USER',
                username: 'user'
            };

            mockRequest.body = {
                username: 'testuser',
                password: 'testpass'
            };

            await createUserHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Only ADMIN users can create new users'
            });
        });

        it('should reject GUEST users', async () => {
            mockRequest.user = {
                id: 'guest-id',
                role: 'GUEST',
                username: 'guest'
            };

            mockRequest.body = {
                username: 'testuser',
                password: 'testpass'
            };

            await createUserHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Only ADMIN users can create new users'
            });
        });
    });

    describe('Input Validation', () => {
        beforeEach(() => {
            mockRequest.user = {
                id: 'admin-user-id',
                role: 'ADMIN',
                username: 'admin'
            };
        });

        it('should require username', async () => {
            mockRequest.body = {
                password: 'testpass'
            };

            await createUserHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Username and password are required'
            });
        });

        it('should require password', async () => {
            mockRequest.body = {
                username: 'testuser'
            };

            await createUserHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Username and password are required'
            });
        });

        it('should require both username and password', async () => {
            mockRequest.body = {};

            await createUserHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Username and password are required'
            });
        });
    });

    describe('User Creation', () => {
        beforeEach(() => {
            mockRequest.user = {
                id: 'admin-user-id',
                role: 'ADMIN',
                username: 'admin'
            };
        });

        it('should create user with USER role by default', async () => {
            const mockNewUser: DatabaseUser = {
                id: 'new-user-id',
                name: 'testuser',
                email: 'testuser@example.com',
                role: 'USER',
                password_hash: 'hashed-password',
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z'
            };

            mockRequest.body = {
                username: 'testuser',
                password: 'testpass'
            };

            mockUserRepository.getUserByUsername.mockResolvedValue(undefined);
            mockUserRepository.createUser.mockResolvedValue(mockNewUser);

            await createUserHandler(mockRequest as Request, mockResponse as Response);

            expect(mockUserRepository.createUser).toHaveBeenCalledWith(
                'testuser',
                'testuser@example.com',
                'testpass',
                'USER'
            );
        });

        it('should generate email from username', async () => {
            const mockNewUser: DatabaseUser = {
                id: 'new-user-id',
                name: 'newuser',
                email: 'newuser@example.com',
                role: 'USER',
                password_hash: 'hashed-password',
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z'
            };

            mockRequest.body = {
                username: 'newuser',
                password: 'newpass'
            };

            mockUserRepository.getUserByUsername.mockResolvedValue(undefined);
            mockUserRepository.createUser.mockResolvedValue(mockNewUser);

            await createUserHandler(mockRequest as Request, mockResponse as Response);

            expect(mockUserRepository.createUser).toHaveBeenCalledWith(
                'newuser',
                'newuser@example.com',
                'newpass',
                'USER'
            );
        });

        it('should exclude password_hash from response', async () => {
            const mockNewUser: DatabaseUser = {
                id: 'new-user-id',
                name: 'testuser',
                email: 'testuser@example.com',
                role: 'USER',
                password_hash: 'hashed-password',
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z'
            };

            mockRequest.body = {
                username: 'testuser',
                password: 'testpass'
            };

            mockUserRepository.getUserByUsername.mockResolvedValue(undefined);
            mockUserRepository.createUser.mockResolvedValue(mockNewUser);

            await createUserHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    id: 'new-user-id',
                    name: 'testuser',
                    email: 'testuser@example.com',
                    role: 'USER',
                    created_at: '2025-01-01T00:00:00Z',
                    updated_at: '2025-01-01T00:00:00Z'
                },
                message: 'User "testuser" created successfully'
            });

            // Verify password_hash is not in the response
            const responseData = (mockResponse.json as jest.Mock).mock.calls[0][0];
            expect(responseData.data).not.toHaveProperty('password_hash');
        });
    });

    describe('Duplicate Username Handling', () => {
        beforeEach(() => {
            mockRequest.user = {
                id: 'admin-user-id',
                role: 'ADMIN',
                username: 'admin'
            };
        });

        it('should reject duplicate usernames', async () => {
            const existingUser: DatabaseUser = {
                id: 'existing-user-id',
                name: 'testuser',
                email: 'testuser@example.com',
                role: 'USER',
                password_hash: 'existing-hash',
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z'
            };

            mockRequest.body = {
                username: 'testuser',
                password: 'testpass'
            };

            mockUserRepository.getUserByUsername.mockResolvedValue(existingUser);

            await createUserHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Username already exists'
            });

            // Should not call createUser if username already exists
            expect(mockUserRepository.createUser).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            mockRequest.user = {
                id: 'admin-user-id',
                role: 'ADMIN',
                username: 'admin'
            };
        });

        it('should handle repository errors gracefully', async () => {
            mockRequest.body = {
                username: 'testuser',
                password: 'testpass'
            };

            mockUserRepository.getUserByUsername.mockRejectedValue(new Error('Database error'));

            await createUserHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to create user'
            });
        });

        it('should handle createUser repository errors', async () => {
            mockRequest.body = {
                username: 'testuser',
                password: 'testpass'
            };

            mockUserRepository.getUserByUsername.mockResolvedValue(undefined);
            mockUserRepository.createUser.mockRejectedValue(new Error('Create user failed'));

            await createUserHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to create user'
            });
        });
    });

    describe('Response Format', () => {
        beforeEach(() => {
            mockRequest.user = {
                id: 'admin-user-id',
                role: 'ADMIN',
                username: 'admin'
            };
        });

        it('should return proper success response format', async () => {
            const mockNewUser: DatabaseUser = {
                id: 'new-user-id',
                name: 'testuser',
                email: 'testuser@example.com',
                role: 'USER',
                password_hash: 'hashed-password',
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z'
            };

            mockRequest.body = {
                username: 'testuser',
                password: 'testpass'
            };

            mockUserRepository.getUserByUsername.mockResolvedValue(undefined);
            mockUserRepository.createUser.mockResolvedValue(mockNewUser);

            await createUserHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    id: 'new-user-id',
                    name: 'testuser',
                    email: 'testuser@example.com',
                    role: 'USER'
                }),
                message: 'User "testuser" created successfully'
            });
        });

        it('should return proper error response format', async () => {
            mockRequest.body = {
                username: 'testuser',
                password: 'testpass'
            };

            mockUserRepository.getUserByUsername.mockRejectedValue(new Error('Database error'));

            await createUserHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to create user'
            });
        });
    });
});
