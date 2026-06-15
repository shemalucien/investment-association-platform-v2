-- Fix members table status constraint to include 'pending'
-- Drop the old constraint and add a new one that includes 'pending'

-- First, drop the existing check constraint
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_status_check;

-- Add the new check constraint that includes 'pending'
ALTER TABLE members ADD CONSTRAINT members_status_check 
CHECK (status IN ('active', 'inactive', 'suspended', 'pending'));

-- Update the default to 'pending' for new registrations
ALTER TABLE members ALTER COLUMN status SET DEFAULT 'pending';
