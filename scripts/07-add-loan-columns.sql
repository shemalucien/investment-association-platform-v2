-- Migration: Add missing columns to loans table
ALTER TABLE loans ADD COLUMN IF NOT EXISTS guarantors TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS agreement_file_name VARCHAR(255);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS receiving_account VARCHAR(255);

-- Migration: Add missing columns to deposits table (for future use)
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS cooperative_account VARCHAR(255);
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS receipt_file_name VARCHAR(255);

-- Migration: Add missing columns to loan_payments table
ALTER TABLE loan_payments ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE loan_payments ADD COLUMN IF NOT EXISTS receipt_file_name VARCHAR(255);
ALTER TABLE loan_payments ADD COLUMN IF NOT EXISTS confirmed_at DATE;
