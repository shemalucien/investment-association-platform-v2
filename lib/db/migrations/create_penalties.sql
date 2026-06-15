-- Create penalties table
CREATE TABLE IF NOT EXISTS penalties (
  id SERIAL PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id),
  loan_id UUID REFERENCES loans(id),
  penalty_type VARCHAR(50) NOT NULL, -- 'weekly_contribution' or 'loan_payment'
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_penalties_member_id ON penalties(member_id);
CREATE INDEX IF NOT EXISTS idx_penalties_loan_id ON penalties(loan_id);
CREATE INDEX IF NOT EXISTS idx_penalties_is_paid ON penalties(is_paid);
