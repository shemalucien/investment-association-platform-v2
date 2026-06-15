-- Social Contributions Table
-- Each member contributes 50,000 RWF per year for social activities

CREATE TABLE IF NOT EXISTS social_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  contribution_year INTEGER NOT NULL,
  amount DECIMAL(15, 2) NOT NULL DEFAULT 50000,
  payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payment_method VARCHAR(50) DEFAULT 'cash',
  receipt_number VARCHAR(100),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'partial')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(member_id, contribution_year)
);

-- Social Activities Expenses Table
CREATE TABLE IF NOT EXISTS social_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_name VARCHAR(255) NOT NULL,
  activity_date DATE NOT NULL,
  description TEXT,
  total_budget DECIMAL(15, 2) NOT NULL,
  amount_spent DECIMAL(15, 2) DEFAULT 0,
  beneficiaries TEXT[],
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Social Activity Expenses Line Items
CREATE TABLE IF NOT EXISTS social_activity_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES social_activities(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  expense_date DATE NOT NULL,
  receipt_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_contributions_member ON social_contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_social_contributions_year ON social_contributions(contribution_year);
CREATE INDEX IF NOT EXISTS idx_social_activities_date ON social_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_social_activity_expenses_activity ON social_activity_expenses(activity_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_social_contributions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_contributions_updated_at
  BEFORE UPDATE ON social_contributions
  FOR EACH ROW EXECUTE PROCEDURE update_social_contributions_updated_at();

CREATE TRIGGER social_activities_updated_at
  BEFORE UPDATE ON social_activities
  FOR EACH ROW EXECUTE PROCEDURE update_social_contributions_updated_at();

-- Insert sample data for current year
INSERT INTO social_contributions (member_id, contribution_year, amount, payment_date, status)
SELECT 
  id,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  50000,
  CURRENT_TIMESTAMP,
  'paid'
FROM members
WHERE status = 'active'
LIMIT 3;

-- Sample social activities
INSERT INTO social_activities (activity_name, activity_date, description, total_budget, amount_spent, status)
VALUES
  ('Annual General Meeting', CURRENT_DATE + INTERVAL '2 months', 'Annual general meeting with lunch and refreshments', 500000, 0, 'planned'),
  ('Members Welfare Support', CURRENT_DATE - INTERVAL '1 month', 'Support for member medical emergency', 200000, 200000, 'completed'),
  ('Year-end Celebration', CURRENT_DATE + INTERVAL '6 months', 'Year-end celebration dinner and awards', 800000, 0, 'planned');
