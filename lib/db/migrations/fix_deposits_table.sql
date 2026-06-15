-- Fix deposits table - add missing columns
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS deposit_date TIMESTAMP DEFAULT CURRENT_DATE;
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS cooperative_code VARCHAR(255);
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS cooperative_account VARCHAR(255);
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS receipt_file_name VARCHAR(255);
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES members(id);

-- Update existing records to have deposit_date
UPDATE deposits SET deposit_date = created_at WHERE deposit_date IS NULL;
