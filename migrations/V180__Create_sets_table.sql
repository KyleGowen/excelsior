-- Create sets table
-- This table stores information about card sets/expansions
CREATE TABLE sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on code for faster lookups
CREATE INDEX idx_sets_code ON sets(code);

-- Create trigger for updated_at
CREATE TRIGGER update_sets_updated_at BEFORE UPDATE ON sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial sets
INSERT INTO sets (code, name) VALUES
    ('ERB', 'Edgar Rice Burroughs and the World Legends'),
    ('SKY', 'Skybound');

