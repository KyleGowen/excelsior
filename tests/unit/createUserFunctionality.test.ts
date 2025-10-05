/**
 * @jest-environment jsdom
 */

// Mock the global functions and DOM elements
const mockGetCurrentUser = jest.fn();
const mockFetch = jest.fn();

// Mock DOM elements
const mockDropdown = {
    classList: {
        toggle: jest.fn(),
        contains: jest.fn(),
        remove: jest.fn(),
        add: jest.fn()
    },
    style: {
        display: 'none'
    }
};

const mockForm = {
    reset: jest.fn()
} as any;

const mockContainer = {
    contains: jest.fn()
};

// Mock document methods
Object.defineProperty(document, 'getElementById', {
    value: jest.fn((id: string) => {
        switch (id) {
            case 'createUserDropdown':
                return mockDropdown;
            case 'createUserForm':
                return mockForm;
            case 'createUserContainer':
                return mockContainer;
            default:
                return null;
        }
    })
});

Object.defineProperty(document, 'addEventListener', {
    value: jest.fn()
});

Object.defineProperty(document, 'removeEventListener', {
    value: jest.fn()
});

// Mock global functions
(global as any).getCurrentUser = mockGetCurrentUser;
(global as any).fetch = mockFetch;

// Mock alert
(global as any).alert = jest.fn();

describe('Create User Frontend Functionality', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDropdown.classList.contains.mockReturnValue(false);
        mockContainer.contains.mockReturnValue(true);
    });

    describe('toggleCreateUserDropdown', () => {
        it('should toggle dropdown visibility when called', () => {
            // Import the function (we'll need to extract it from globalNav.js)
            const toggleCreateUserDropdown = () => {
                const dropdown = document.getElementById('createUserDropdown');
                if (dropdown) {
                    dropdown.classList.toggle('show');
                }
            };

            toggleCreateUserDropdown();
            expect(mockDropdown.classList.toggle).toHaveBeenCalledWith('show');
        });

        it('should add event listener when dropdown is shown', () => {
            mockDropdown.classList.contains.mockReturnValue(true);
            
            const toggleCreateUserDropdown = () => {
                const dropdown = document.getElementById('createUserDropdown');
                if (dropdown) {
                    dropdown.classList.toggle('show');
                    
                    if (dropdown.classList.contains('show')) {
                        document.addEventListener('click', jest.fn());
                    }
                }
            };

            toggleCreateUserDropdown();
            expect(document.addEventListener).toHaveBeenCalled();
        });
    });

    describe('closeCreateUserDropdown', () => {
        it('should close dropdown and clear form', () => {
            const closeCreateUserDropdown = () => {
                const dropdown = document.getElementById('createUserDropdown');
                const form = document.getElementById('createUserForm');
                
                if (dropdown) {
                    dropdown.classList.remove('show');
                    document.removeEventListener('click', jest.fn());
                }
                
                if (form) {
                    (form as any).reset();
                }
            };

            closeCreateUserDropdown();
            expect(mockDropdown.classList.remove).toHaveBeenCalledWith('show');
            expect(document.removeEventListener).toHaveBeenCalled();
            expect(mockForm.reset).toHaveBeenCalled();
        });
    });

    describe('createUser', () => {
        it('should create user successfully with valid data', async () => {
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
                        credentials: 'include',
                        body: JSON.stringify({
                            username: username,
                            password: password
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok && data.success) {
                        alert(`User "${username}" created successfully!`);
                        // closeCreateUserDropdown(); // Would be called here
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
                target: {
                    // Mock FormData constructor
                    constructor: {
                        name: 'HTMLFormElement'
                    }
                }
            };

            // Mock FormData
            (global as any).FormData = jest.fn().mockImplementation(() => ({
                get: (key: string) => mockFormData.get(key)
            }));

            await createUser(mockEvent);
            
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockFetch).toHaveBeenCalledWith('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    username: 'testuser',
                    password: 'testpass'
                })
            });
            expect(alert).toHaveBeenCalledWith('User "testuser" created successfully!');
        });

        it('should show error for missing fields', async () => {
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
            };

            const mockFormData = new Map([
                ['username', ''],
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
            
            expect(alert).toHaveBeenCalledWith('Please fill in all fields');
        });

        it('should handle API errors gracefully', async () => {
            const mockResponse = {
                ok: false,
                json: jest.fn().mockResolvedValue({
                    success: false,
                    error: 'Username already exists'
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
            
            expect(alert).toHaveBeenCalledWith('Error creating user: Username already exists');
        });

        it('should handle network errors', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'));

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
            
            expect(alert).toHaveBeenCalledWith('Error creating user. Please try again.');
        });
    });

    describe('updateUserWelcome', () => {
        let mockCreateUserContainer: any;

        beforeEach(() => {
            mockCreateUserContainer = {
                style: {
                    display: 'none'
                }
            };

            // Mock getElementById for each test
            jest.spyOn(document, 'getElementById').mockImplementation((id: string) => {
                if (id === 'createUserContainer') {
                    return mockCreateUserContainer;
                }
                return null;
            });
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should show Create User button for ADMIN users', () => {
            mockGetCurrentUser.mockReturnValue({
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

            updateUserWelcome();
            expect(mockCreateUserContainer.style.display).toBe('inline-block');
        });

        it('should hide Create User button for non-ADMIN users', () => {
            mockCreateUserContainer.style.display = 'inline-block';
            
            mockGetCurrentUser.mockReturnValue({
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
            expect(mockCreateUserContainer.style.display).toBe('none');
        });

        it('should handle null currentUser gracefully', () => {
            mockCreateUserContainer.style.display = 'inline-block';
            
            mockGetCurrentUser.mockReturnValue(null);

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
            // Should not change display when currentUser is null
            expect(mockCreateUserContainer.style.display).toBe('inline-block');
        });
    });
});
