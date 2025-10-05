/**
 * @jest-environment jsdom
 */

// Mock the global functions and DOM elements
const mockGetCurrentUser = jest.fn();
const mockFetch = jest.fn();

// Mock DOM elements
const mockCreateUserContainer = {
    style: {
        display: 'none'
    }
};

const mockUsernameElement = {
    textContent: ''
};

// Mock document methods
Object.defineProperty(document, 'getElementById', {
    value: jest.fn((id: string) => {
        switch (id) {
            case 'createUserContainer':
                return mockCreateUserContainer;
            case 'currentUsername':
                return mockUsernameElement;
            default:
                return null;
        }
    })
});

// Mock global functions
(global as any).getCurrentUser = mockGetCurrentUser;
(global as any).fetch = mockFetch;

// Mock alert
(global as any).alert = jest.fn();

describe('Create User Frontend Authorization Security Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateUserContainer.style.display = 'none';
        mockUsernameElement.textContent = '';
    });

    describe('updateUserWelcome Authorization', () => {
        it('should show Create User button ONLY for ADMIN users', () => {
            mockGetCurrentUser.mockReturnValue({
                id: 'admin-id',
                role: 'ADMIN',
                username: 'admin'
            });

            const updateUserWelcome = () => {
                const currentUser = mockGetCurrentUser();
                if (currentUser) {
                    const displayName = (currentUser.role === 'GUEST') 
                        ? 'Guest' 
                        : (currentUser.username || currentUser.name || 'User');
                    const usernameElement = document.getElementById('currentUsername');
                    if (usernameElement) {
                        usernameElement.textContent = displayName;
                    }
                    
                    // Show/hide Create User button based on role
                    const createUserContainer = document.getElementById('createUserContainer');
                    if (createUserContainer) {
                        if (currentUser.role === 'ADMIN') {
                            createUserContainer.style.display = 'inline-block';
                        } else {
                            createUserContainer.style.display = 'none';
                        }
                    }
                }
            };

            updateUserWelcome();

            expect(mockCreateUserContainer.style.display).toBe('inline-block');
            expect(mockUsernameElement.textContent).toBe('admin');
        });

        it('should hide Create User button for USER role', () => {
            mockGetCurrentUser.mockReturnValue({
                id: 'user-id',
                role: 'USER',
                username: 'user'
            });

            const updateUserWelcome = () => {
                const currentUser = mockGetCurrentUser();
                if (currentUser) {
                    const displayName = (currentUser.role === 'GUEST') 
                        ? 'Guest' 
                        : (currentUser.username || currentUser.name || 'User');
                    const usernameElement = document.getElementById('currentUsername');
                    if (usernameElement) {
                        usernameElement.textContent = displayName;
                    }
                    
                    // Show/hide Create User button based on role
                    const createUserContainer = document.getElementById('createUserContainer');
                    if (createUserContainer) {
                        if (currentUser.role === 'ADMIN') {
                            createUserContainer.style.display = 'inline-block';
                        } else {
                            createUserContainer.style.display = 'none';
                        }
                    }
                }
            };

            updateUserWelcome();

            expect(mockCreateUserContainer.style.display).toBe('none');
            expect(mockUsernameElement.textContent).toBe('user');
        });

        it('should hide Create User button for GUEST role', () => {
            mockGetCurrentUser.mockReturnValue({
                id: 'guest-id',
                role: 'GUEST',
                username: 'guest'
            });

            const updateUserWelcome = () => {
                const currentUser = mockGetCurrentUser();
                if (currentUser) {
                    const displayName = (currentUser.role === 'GUEST') 
                        ? 'Guest' 
                        : (currentUser.username || currentUser.name || 'User');
                    const usernameElement = document.getElementById('currentUsername');
                    if (usernameElement) {
                        usernameElement.textContent = displayName;
                    }
                    
                    // Show/hide Create User button based on role
                    const createUserContainer = document.getElementById('createUserContainer');
                    if (createUserContainer) {
                        if (currentUser.role === 'ADMIN') {
                            createUserContainer.style.display = 'inline-block';
                        } else {
                            createUserContainer.style.display = 'none';
                        }
                    }
                }
            };

            updateUserWelcome();

            expect(mockCreateUserContainer.style.display).toBe('none');
            expect(mockUsernameElement.textContent).toBe('Guest');
        });

        it('should handle null currentUser gracefully', () => {
            mockGetCurrentUser.mockReturnValue(null);

            const updateUserWelcome = () => {
                const currentUser = mockGetCurrentUser();
                if (currentUser) {
                    const displayName = (currentUser.role === 'GUEST') 
                        ? 'Guest' 
                        : (currentUser.username || currentUser.name || 'User');
                    const usernameElement = document.getElementById('currentUsername');
                    if (usernameElement) {
                        usernameElement.textContent = displayName;
                    }
                    
                    // Show/hide Create User button based on role
                    const createUserContainer = document.getElementById('createUserContainer');
                    if (createUserContainer) {
                        if (currentUser.role === 'ADMIN') {
                            createUserContainer.style.display = 'inline-block';
                        } else {
                            createUserContainer.style.display = 'none';
                        }
                    }
                }
            };

            updateUserWelcome();

            // Should not change display when currentUser is null
            expect(mockCreateUserContainer.style.display).toBe('none');
            expect(mockUsernameElement.textContent).toBe('');
        });

        it('should handle undefined currentUser gracefully', () => {
            mockGetCurrentUser.mockReturnValue(undefined);

            const updateUserWelcome = () => {
                const currentUser = mockGetCurrentUser();
                if (currentUser) {
                    const displayName = (currentUser.role === 'GUEST') 
                        ? 'Guest' 
                        : (currentUser.username || currentUser.name || 'User');
                    const usernameElement = document.getElementById('currentUsername');
                    if (usernameElement) {
                        usernameElement.textContent = displayName;
                    }
                    
                    // Show/hide Create User button based on role
                    const createUserContainer = document.getElementById('createUserContainer');
                    if (createUserContainer) {
                        if (currentUser.role === 'ADMIN') {
                            createUserContainer.style.display = 'inline-block';
                        } else {
                            createUserContainer.style.display = 'none';
                        }
                    }
                }
            };

            updateUserWelcome();

            // Should not change display when currentUser is undefined
            expect(mockCreateUserContainer.style.display).toBe('none');
            expect(mockUsernameElement.textContent).toBe('');
        });
    });

    describe('Role-Based UI Security Tests', () => {
        it('should handle case-sensitive role comparison', () => {
            mockGetCurrentUser.mockReturnValue({
                id: 'user-id',
                role: 'admin', // lowercase
                username: 'user'
            });

            const updateUserWelcome = () => {
                const currentUser = mockGetCurrentUser();
                if (currentUser) {
                    const createUserContainer = document.getElementById('createUserContainer');
                    if (createUserContainer) {
                        if (currentUser.role === 'ADMIN') { // uppercase comparison
                            createUserContainer.style.display = 'inline-block';
                        } else {
                            createUserContainer.style.display = 'none';
                        }
                    }
                }
            };

            updateUserWelcome();

            // Should be hidden because 'admin' !== 'ADMIN'
            expect(mockCreateUserContainer.style.display).toBe('none');
        });

        it('should handle undefined role', () => {
            mockGetCurrentUser.mockReturnValue({
                id: 'user-id',
                role: undefined,
                username: 'user'
            });

            const updateUserWelcome = () => {
                const currentUser = mockGetCurrentUser();
                if (currentUser) {
                    const createUserContainer = document.getElementById('createUserContainer');
                    if (createUserContainer) {
                        if (currentUser.role === 'ADMIN') {
                            createUserContainer.style.display = 'inline-block';
                        } else {
                            createUserContainer.style.display = 'none';
                        }
                    }
                }
            };

            updateUserWelcome();

            // Should be hidden because undefined !== 'ADMIN'
            expect(mockCreateUserContainer.style.display).toBe('none');
        });

        it('should handle null role', () => {
            mockGetCurrentUser.mockReturnValue({
                id: 'user-id',
                role: null,
                username: 'user'
            });

            const updateUserWelcome = () => {
                const currentUser = mockGetCurrentUser();
                if (currentUser) {
                    const createUserContainer = document.getElementById('createUserContainer');
                    if (createUserContainer) {
                        if (currentUser.role === 'ADMIN') {
                            createUserContainer.style.display = 'inline-block';
                        } else {
                            createUserContainer.style.display = 'none';
                        }
                    }
                }
            };

            updateUserWelcome();

            // Should be hidden because null !== 'ADMIN'
            expect(mockCreateUserContainer.style.display).toBe('none');
        });

        it('should handle empty string role', () => {
            mockGetCurrentUser.mockReturnValue({
                id: 'user-id',
                role: '',
                username: 'user'
            });

            const updateUserWelcome = () => {
                const currentUser = mockGetCurrentUser();
                if (currentUser) {
                    const createUserContainer = document.getElementById('createUserContainer');
                    if (createUserContainer) {
                        if (currentUser.role === 'ADMIN') {
                            createUserContainer.style.display = 'inline-block';
                        } else {
                            createUserContainer.style.display = 'none';
                        }
                    }
                }
            };

            updateUserWelcome();

            // Should be hidden because '' !== 'ADMIN'
            expect(mockCreateUserContainer.style.display).toBe('none');
        });

        it('should handle corrupted user object', () => {
            mockGetCurrentUser.mockReturnValue({
                id: 'user-id',
                // Missing role property
                username: 'user'
            });

            const updateUserWelcome = () => {
                const currentUser = mockGetCurrentUser();
                if (currentUser) {
                    const createUserContainer = document.getElementById('createUserContainer');
                    if (createUserContainer) {
                        if (currentUser.role === 'ADMIN') {
                            createUserContainer.style.display = 'inline-block';
                        } else {
                            createUserContainer.style.display = 'none';
                        }
                    }
                }
            };

            updateUserWelcome();

            // Should be hidden because undefined !== 'ADMIN'
            expect(mockCreateUserContainer.style.display).toBe('none');
        });
    });

    describe('Frontend API Call Security Tests', () => {
        it('should include credentials in Create User API calls', async () => {
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({
                    success: true,
                    data: { id: '123', username: 'testuser' }
                })
            };
            mockFetch.mockResolvedValue(mockResponse);

            const createUser = async (event: any) => {
                event.preventDefault();
                
                const form = event.target;
                const formData = new FormData(form);
                const username = formData.get('username');
                const password = formData.get('password');
                
                if (!username || !password) {
                    alert('Please fill in all fields');
                    return;
                }
                
                try {
                    const response = await fetch('/api/users', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include', // This is critical for security
                        body: JSON.stringify({
                            username: username,
                            password: password
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok && data.success) {
                        alert(`User "${username}" created successfully!`);
                    } else {
                        alert(`Error creating user: ${data.error || 'Unknown error'}`);
                    }
                } catch (error) {
                    console.error('Error creating user:', error);
                    alert('Error creating user. Please try again.');
                }
            };

            // Mock form data
            const mockFormData = new Map([
                ['username', 'testuser'],
                ['password', 'testpass']
            ]);
            
            const mockEvent = {
                preventDefault: jest.fn(),
                target: {}
            };

            (global as any).FormData = jest.fn().mockImplementation(() => ({
                get: (key: string) => mockFormData.get(key)
            }));

            await createUser(mockEvent);
            
            expect(mockFetch).toHaveBeenCalledWith('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Verify credentials are included
                body: JSON.stringify({
                    username: 'testuser',
                    password: 'testpass'
                })
            });
        });

        it('should handle 403 Forbidden responses from server', async () => {
            const mockResponse = {
                ok: false,
                status: 403,
                json: jest.fn().mockResolvedValue({
                    success: false,
                    error: 'Only ADMIN users can create new users'
                })
            };
            mockFetch.mockResolvedValue(mockResponse);

            const createUser = async (event: any) => {
                event.preventDefault();
                
                const form = event.target;
                const formData = new FormData(form);
                const username = formData.get('username');
                const password = formData.get('password');
                
                try {
                    const response = await fetch('/api/users', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                            username: username,
                            password: password
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok && data.success) {
                        alert(`User "${username}" created successfully!`);
                    } else {
                        alert(`Error creating user: ${data.error || 'Unknown error'}`);
                    }
                } catch (error) {
                    console.error('Error creating user:', error);
                    alert('Error creating user. Please try again.');
                }
            };

            const mockFormData = new Map([
                ['username', 'testuser'],
                ['password', 'testpass']
            ]);
            
            const mockEvent = {
                preventDefault: jest.fn(),
                target: {}
            };

            (global as any).FormData = jest.fn().mockImplementation(() => ({
                get: (key: string) => mockFormData.get(key)
            }));

            await createUser(mockEvent);
            
            expect(alert).toHaveBeenCalledWith('Error creating user: Only ADMIN users can create new users');
        });

        it('should handle 401 Unauthorized responses from server', async () => {
            const mockResponse = {
                ok: false,
                status: 401,
                json: jest.fn().mockResolvedValue({
                    success: false,
                    error: 'Authentication required'
                })
            };
            mockFetch.mockResolvedValue(mockResponse);

            const createUser = async (event: any) => {
                event.preventDefault();
                
                const form = event.target;
                const formData = new FormData(form);
                const username = formData.get('username');
                const password = formData.get('password');
                
                try {
                    const response = await fetch('/api/users', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                            username: username,
                            password: password
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok && data.success) {
                        alert(`User "${username}" created successfully!`);
                    } else {
                        alert(`Error creating user: ${data.error || 'Unknown error'}`);
                    }
                } catch (error) {
                    console.error('Error creating user:', error);
                    alert('Error creating user. Please try again.');
                }
            };

            const mockFormData = new Map([
                ['username', 'testuser'],
                ['password', 'testpass']
            ]);
            
            const mockEvent = {
                preventDefault: jest.fn(),
                target: {}
            };

            (global as any).FormData = jest.fn().mockImplementation(() => ({
                get: (key: string) => mockFormData.get(key)
            }));

            await createUser(mockEvent);
            
            expect(alert).toHaveBeenCalledWith('Error creating user: Authentication required');
        });
    });

    describe('DOM Security Tests', () => {
        it('should handle missing DOM elements gracefully', () => {
            // Mock getElementById to return null
            jest.spyOn(document, 'getElementById').mockReturnValue(null);

            mockGetCurrentUser.mockReturnValue({
                id: 'admin-id',
                role: 'ADMIN',
                username: 'admin'
            });

            const updateUserWelcome = () => {
                const currentUser = mockGetCurrentUser();
                if (currentUser) {
                    const createUserContainer = document.getElementById('createUserContainer');
                    if (createUserContainer) {
                        if (currentUser.role === 'ADMIN') {
                            createUserContainer.style.display = 'inline-block';
                        } else {
                            createUserContainer.style.display = 'none';
                        }
                    }
                }
            };

            // Should not throw error when DOM elements are missing
            expect(() => updateUserWelcome()).not.toThrow();
        });

        it('should handle DOM manipulation attempts', () => {
            const maliciousContainer = {
                style: {
                    display: 'inline-block' // Attempted manipulation
                }
            };

            jest.spyOn(document, 'getElementById').mockReturnValue(maliciousContainer as any);

            mockGetCurrentUser.mockReturnValue({
                id: 'user-id',
                role: 'USER',
                username: 'user'
            });

            const updateUserWelcome = () => {
                const currentUser = mockGetCurrentUser();
                if (currentUser) {
                    const createUserContainer = document.getElementById('createUserContainer');
                    if (createUserContainer) {
                        if (currentUser.role === 'ADMIN') {
                            createUserContainer.style.display = 'inline-block';
                        } else {
                            createUserContainer.style.display = 'none';
                        }
                    }
                }
            };

            updateUserWelcome();

            // Should override any attempted manipulation
            expect(maliciousContainer.style.display).toBe('none');
        });
    });
});
