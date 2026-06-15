-- ABANYABUZARE Investment Association Database Schema
-- PostgreSQL Database Setup Script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS deposits CASCADE;
DROP TABLE IF EXISTS loan_payments CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS shares CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Users table (for authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'treasurer', 'member')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Members table (association members)
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    member_number VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    national_id VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shares table (share purchases)
CREATE TABLE shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_per_share DECIMAL(15, 2) NOT NULL CHECK (price_per_share > 0),
    total_amount DECIMAL(15, 2) NOT NULL CHECK (total_amount > 0),
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) DEFAULT 'cash',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loans table
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    loan_number VARCHAR(50) UNIQUE NOT NULL,
    principal_amount DECIMAL(15, 2) NOT NULL CHECK (principal_amount > 0),
    interest_rate DECIMAL(5, 2) NOT NULL DEFAULT 10.00 CHECK (interest_rate >= 0),
    total_interest DECIMAL(15, 2) NOT NULL CHECK (total_interest >= 0),
    total_amount DECIMAL(15, 2) NOT NULL CHECK (total_amount > 0),
    duration_months INTEGER NOT NULL CHECK (duration_months > 0),
    monthly_payment DECIMAL(15, 2) NOT NULL CHECK (monthly_payment > 0),
    purpose TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'completed', 'rejected', 'defaulted')),
    application_date DATE NOT NULL DEFAULT CURRENT_DATE,
    approval_date DATE,
    disbursement_date DATE,
    due_date DATE,
    approved_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loan Payments table
CREATE TABLE loan_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) DEFAULT 'cash',
    receipt_number VARCHAR(50),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deposits table (voluntary savings)
CREATE TABLE deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    deposit_type VARCHAR(50) NOT NULL CHECK (deposit_type IN ('voluntary', 'loan_repayment', 'share_purchase', 'other')),
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    deposit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) DEFAULT 'cash',
    reference_id UUID,
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs table (track all important actions)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table (member alerts)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    attachment_name VARCHAR(255),
    attachment_type VARCHAR(100),
    attachment_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_shares_member_id ON shares(member_id);
CREATE INDEX idx_shares_purchase_date ON shares(purchase_date);
CREATE INDEX idx_loans_member_id ON loans(member_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loan_payments_loan_id ON loan_payments(loan_id);
CREATE INDEX idx_deposits_member_id ON deposits(member_id);
CREATE INDEX idx_deposits_deposit_type ON deposits(deposit_type);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_notifications_member_id ON notifications(member_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
