-- Create profit distributions and member profits tables

-- Profit distributions table
CREATE TABLE IF NOT EXISTS profit_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    total_amount DECIMAL(15, 2) NOT NULL,
    total_shares INTEGER NOT NULL,
    description TEXT NOT NULL,
    period VARCHAR(50) NOT NULL,
    distribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Member profits table
CREATE TABLE IF NOT EXISTS member_profits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    profit_distribution_id UUID NOT NULL REFERENCES profit_distributions(id) ON DELETE CASCADE,
    shares_count INTEGER NOT NULL,
    profit_amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'distributed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on member_id for faster queries
CREATE INDEX IF NOT EXISTS idx_member_profits_member_id ON member_profits(member_id);
CREATE INDEX IF NOT EXISTS idx_member_profits_distribution_id ON member_profits(profit_distribution_id);
