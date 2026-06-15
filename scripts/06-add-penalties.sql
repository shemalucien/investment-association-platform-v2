-- Migration: Add penalties table
-- Run this script if the penalties table does not exist yet

CREATE TABLE IF NOT EXISTS penalties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    penalty_type VARCHAR(50) NOT NULL CHECK (penalty_type IN ('contribution', 'loan_payment')),
    related_entity_id UUID,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
    penalty_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'waived')),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_penalties_member_id ON penalties(member_id);
CREATE INDEX IF NOT EXISTS idx_penalties_status ON penalties(status);
CREATE INDEX IF NOT EXISTS idx_penalties_type ON penalties(penalty_type);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_penalties_updated_at ON penalties;
CREATE TRIGGER update_penalties_updated_at BEFORE UPDATE ON penalties
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
