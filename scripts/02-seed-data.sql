-- ABANYABUZARE Investment Association - Sample Data
-- Run this after creating tables

-- Insert default users (passwords are hashed version of 'password123')
-- In production, use bcrypt with proper salt rounds
INSERT INTO users (id, email, password_hash, full_name, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@abanyabuzare.rw', '$2b$10$uqIwg.o//73Y9vntuVWVfOVidzacZX0DmfslnRgVKTfPIx8PTcmL.', 'Jean Claude Habimana', 'admin'),
('550e8400-e29b-41d4-a716-446655440002', 'treasurer@abanyabuzare.rw', '$2b$10$uqIwg.o//73Y9vntuVWVfOVidzacZX0DmfslnRgVKTfPIx8PTcmL.', 'Marie Uwamahoro', 'treasurer'),
('550e8400-e29b-41d4-a716-446655440003', 'member@abanyabuzare.rw', '$2b$10$uqIwg.o//73Y9vntuVWVfOVidzacZX0DmfslnRgVKTfPIx8PTcmL.', 'Paul Kagame', 'member');

-- Insert members
INSERT INTO members (id, user_id, member_number, full_name, email, phone, national_id, address, join_date) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'ABZ001', 'Jean Claude Habimana', 'admin@abanyabuzare.rw', '+250788123456', '1198012345678901', 'Kigali, Gasabo', '2023-01-15'),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'ABZ002', 'Marie Uwamahoro', 'treasurer@abanyabuzare.rw', '+250788234567', '1198123456789012', 'Kigali, Kicukiro', '2023-01-15'),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'ABZ003', 'Paul Kagame', 'member@abanyabuzare.rw', '+250788345678', '1198234567890123', 'Kigali, Nyarugenge', '2023-01-20'),
('650e8400-e29b-41d4-a716-446655440004', NULL, 'ABZ004', 'Grace Mukasine', 'grace.m@example.rw', '+250788456789', '1198345678901234', 'Kigali, Gasabo', '2023-02-01'),
('650e8400-e29b-41d4-a716-446655440005', NULL, 'ABZ005', 'David Nshimiyimana', 'david.n@example.rw', '+250788567890', '1198456789012345', 'Kigali, Kicukiro', '2023-02-15'),
('650e8400-e29b-41d4-a716-446655440006', NULL, 'ABZ006', 'Alice Mukamazimpaka', 'alice.m@example.rw', '+250788678901', '1198567890123456', 'Kigali, Nyarugenge', '2023-03-01'),
('650e8400-e29b-41d4-a716-446655440007', NULL, 'ABZ007', 'Patrick Mugabo', 'patrick.m@example.rw', '+250788789012', '1198678901234567', 'Kigali, Gasabo', '2023-03-15'),
('650e8400-e29b-41d4-a716-446655440008', NULL, 'ABZ008', 'Claudine Uwera', 'claudine.u@example.rw', '+250788890123', '1198789012345678', 'Kigali, Kicukiro', '2023-04-01'),
('650e8400-e29b-41d4-a716-446655440009', NULL, 'ABZ009', 'Emmanuel Nkusi', 'emmanuel.n@example.rw', '+250788901234', '1198890123456789', 'Kigali, Nyarugenge', '2023-04-15'),
('650e8400-e29b-41d4-a716-446655440010', NULL, 'ABZ010', 'Sylvie Nirere', 'sylvie.n@example.rw', '+250789012345', '1198901234567890', 'Kigali, Gasabo', '2023-05-01');

-- Insert shares
INSERT INTO shares (member_id, quantity, price_per_share, total_amount, purchase_date, created_by) VALUES
('650e8400-e29b-41d4-a716-446655440001', 100, 5000, 500000, '2023-01-15', '550e8400-e29b-41d4-a716-446655440001'),
('650e8400-e29b-41d4-a716-446655440002', 80, 5000, 400000, '2023-01-15', '550e8400-e29b-41d4-a716-446655440001'),
('650e8400-e29b-41d4-a716-446655440003', 60, 5000, 300000, '2023-01-20', '550e8400-e29b-41d4-a716-446655440001'),
('650e8400-e29b-41d4-a716-446655440004', 70, 5000, 350000, '2023-02-01', '550e8400-e29b-41d4-a716-446655440001'),
('650e8400-e29b-41d4-a716-446655440005', 90, 5000, 450000, '2023-02-15', '550e8400-e29b-41d4-a716-446655440001'),
('650e8400-e29b-41d4-a716-446655440006', 50, 5000, 250000, '2023-03-01', '550e8400-e29b-41d4-a716-446655440001'),
('650e8400-e29b-41d4-a716-446655440007', 75, 5000, 375000, '2023-03-15', '550e8400-e29b-41d4-a716-446655440001'),
('650e8400-e29b-41d4-a716-446655440008', 85, 5000, 425000, '2023-04-01', '550e8400-e29b-41d4-a716-446655440001'),
('650e8400-e29b-41d4-a716-446655440009', 65, 5000, 325000, '2023-04-15', '550e8400-e29b-41d4-a716-446655440001'),
('650e8400-e29b-41d4-a716-446655440010', 55, 5000, 275000, '2023-05-01', '550e8400-e29b-41d4-a716-446655440001');

-- Insert loans
INSERT INTO loans (id, member_id, loan_number, principal_amount, interest_rate, total_interest, total_amount, duration_months, monthly_payment, purpose, status, application_date, approval_date, disbursement_date, approved_by) VALUES
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', 'LOAN001', 500000, 10.00, 50000, 550000, 12, 45833.33, 'Small business expansion', 'active', '2023-06-01', '2023-06-05', '2023-06-10', '550e8400-e29b-41d4-a716-446655440001'),
('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440005', 'LOAN002', 300000, 10.00, 30000, 330000, 6, 55000, 'Education fees', 'active', '2023-07-15', '2023-07-18', '2023-07-20', '550e8400-e29b-41d4-a716-446655440001'),
('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440007', 'LOAN003', 200000, 10.00, 20000, 220000, 12, 18333.33, 'Home improvement', 'pending', '2024-01-10', NULL, NULL, NULL);

-- Insert loan payments
INSERT INTO loan_payments (loan_id, amount, payment_date, created_by) VALUES
('750e8400-e29b-41d4-a716-446655440001', 45833.33, '2023-07-10', '550e8400-e29b-41d4-a716-446655440002'),
('750e8400-e29b-41d4-a716-446655440001', 45833.33, '2023-08-10', '550e8400-e29b-41d4-a716-446655440002'),
('750e8400-e29b-41d4-a716-446655440001', 45833.33, '2023-09-10', '550e8400-e29b-41d4-a716-446655440002'),
('750e8400-e29b-41d4-a716-446655440002', 55000, '2023-08-20', '550e8400-e29b-41d4-a716-446655440002'),
('750e8400-e29b-41d4-a716-446655440002', 55000, '2023-09-20', '550e8400-e29b-41d4-a716-446655440002');

-- Insert deposits
INSERT INTO deposits (member_id, deposit_type, amount, deposit_date, created_by) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'voluntary', 50000, '2023-06-01', '550e8400-e29b-41d4-a716-446655440002'),
('650e8400-e29b-41d4-a716-446655440002', 'voluntary', 30000, '2023-06-15', '550e8400-e29b-41d4-a716-446655440002'),
('650e8400-e29b-41d4-a716-446655440004', 'voluntary', 40000, '2023-07-01', '550e8400-e29b-41d4-a716-446655440002'),
('650e8400-e29b-41d4-a716-446655440006', 'voluntary', 25000, '2023-07-15', '550e8400-e29b-41d4-a716-446655440002'),
('650e8400-e29b-41d4-a716-446655440008', 'voluntary', 35000, '2023-08-01', '550e8400-e29b-41d4-a716-446655440002');

-- Add audit log entries
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'CREATE', 'member', '650e8400-e29b-41d4-a716-446655440001', '{"action": "Member created"}'),
('550e8400-e29b-41d4-a716-446655440001', 'APPROVE', 'loan', '750e8400-e29b-41d4-a716-446655440001', '{"action": "Loan approved", "amount": 500000}'),
('550e8400-e29b-41d4-a716-446655440002', 'CREATE', 'deposit', NULL, '{"action": "Deposit recorded", "amount": 50000}');
