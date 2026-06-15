-- Fix loans table - add missing columns
ALTER TABLE loans ADD COLUMN IF NOT EXISTS guarantors TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS agreement_file_name VARCHAR(255);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS application_date TIMESTAMP DEFAULT CURRENT_DATE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS disbursement_date TIMESTAMP;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES members(id);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS loan_number VARCHAR(50);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS principal_amount DECIMAL(15, 2);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS interest_rate DECIMAL(5, 2);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS total_interest DECIMAL(15, 2);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15, 2);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS duration_months INTEGER;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS monthly_payment DECIMAL(15, 2);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

-- Update existing records to have application_date
UPDATE loans SET application_date = created_at WHERE application_date IS NULL;

-- Fix foreign key constraint for member_id
ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_member_id_fkey;
ALTER TABLE loans ADD CONSTRAINT loans_member_id_fkey FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

-- Fix foreign key constraint for approved_by
ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_approved_by_fkey;
ALTER TABLE loans ADD CONSTRAINT loans_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;
