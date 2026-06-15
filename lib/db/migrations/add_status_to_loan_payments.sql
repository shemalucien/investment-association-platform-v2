-- Add status column to loan_payments table
ALTER TABLE loan_payments ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

-- Update existing records to have 'confirmed' status if they don't have a status
UPDATE loan_payments SET status = 'confirmed' WHERE status IS NULL OR status = '';
