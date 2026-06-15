-- Fix loan_payments table - add missing columns
ALTER TABLE loan_payments ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE loan_payments ADD COLUMN IF NOT EXISTS receipt_file_name VARCHAR(255);
ALTER TABLE loan_payments ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;

-- Update existing records
UPDATE loan_payments SET status = 'confirmed' WHERE status IS NULL OR status = '';
