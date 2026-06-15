-- Fix members table foreign key constraints to ensure CASCADE deletions work properly
-- This will allow members to be deleted even if they have related records

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
