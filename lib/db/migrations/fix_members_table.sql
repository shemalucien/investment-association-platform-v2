-- Fix members table - add missing columns
ALTER TABLE members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
ALTER TABLE members ADD COLUMN IF NOT EXISTS join_date TIMESTAMP DEFAULT CURRENT_DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE members ADD COLUMN IF NOT EXISTS address TEXT;

-- Update existing records to have join_date
UPDATE members SET join_date = created_at WHERE join_date IS NULL;
UPDATE members SET status = 'active' WHERE status IS NULL OR status = '';
