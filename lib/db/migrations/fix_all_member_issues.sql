-- Complete fix for all member registration and deletion issues
-- Run this entire script in your Neon database

-- 1. Fix members table - add missing columns
ALTER TABLE members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
ALTER TABLE members ADD COLUMN IF NOT EXISTS join_date TIMESTAMP DEFAULT CURRENT_DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE members ADD COLUMN IF NOT EXISTS address TEXT;

-- Update existing records to have join_date
UPDATE members SET join_date = created_at WHERE join_date IS NULL;
UPDATE members SET status = 'active' WHERE status IS NULL OR status = '';

-- 2. Fix members table status constraint to include 'pending'
-- Drop the old constraint and add a new one that includes 'pending'
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_status_check;
ALTER TABLE members ADD CONSTRAINT members_status_check 
CHECK (status IN ('active', 'inactive', 'suspended', 'pending'));
ALTER TABLE members ALTER COLUMN status SET DEFAULT 'pending';

-- 3. Fix members table foreign key constraints to ensure CASCADE deletions work properly
-- Drop existing foreign key constraints if they exist
ALTER TABLE shares DROP CONSTRAINT IF EXISTS shares_member_id_fkey;
ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_member_id_fkey;
ALTER TABLE deposits DROP CONSTRAINT IF EXISTS deposits_member_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_member_id_fkey;

-- Re-add foreign key constraints with CASCADE DELETE
ALTER TABLE shares 
ADD CONSTRAINT shares_member_id_fkey 
FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE loans 
ADD CONSTRAINT loans_member_id_fkey 
FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE deposits 
ADD CONSTRAINT deposits_member_id_fkey 
FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_member_id_fkey 
FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

-- Also ensure the user_id constraint allows deletion
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_user_id_fkey;
ALTER TABLE members 
ADD CONSTRAINT members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
