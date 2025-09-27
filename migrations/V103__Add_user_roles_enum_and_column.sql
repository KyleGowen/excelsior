-- Create user roles enum
CREATE TYPE user_role AS ENUM ('GUEST', 'USER', 'ADMIN');

-- Add role column to users table
ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'USER';

-- Add comment for documentation
COMMENT ON TYPE user_role IS 'User role types: GUEST (limited access), USER (standard access), ADMIN (full access)';
COMMENT ON COLUMN users.role IS 'User role determining access level and permissions';
