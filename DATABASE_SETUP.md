# ABANYABUZARE Database Setup Guide

## Prerequisites
- PostgreSQL 12 or higher installed on your PC
- PostgreSQL running and accessible

## Setup Instructions

### 1. Create Database
Open PostgreSQL command line (psql) or use pgAdmin and create the database:

```sql
CREATE DATABASE abanyabuzare;
```

### 2. Run Migration Scripts
Execute the SQL scripts in order:

```bash
# Using psql command line
psql -U postgres -d abanyabuzare -f scripts/01-create-tables.sql
psql -U postgres -d abanyabuzare -f scripts/02-seed-data.sql
```

Or using pgAdmin:
- Open Query Tool
- Load and execute `01-create-tables.sql`
- Load and execute `02-seed-data.sql`

### 3. Configure Environment Variables
Add these environment variables to your project:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/abanyabuzare
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

Replace:
- `username` with your PostgreSQL username (default: postgres)
- `password` with your PostgreSQL password
- `localhost:5432` with your PostgreSQL host and port

### 4. Test Connection
After setup, you can test the connection by running the Next.js app.

## Default Login Credentials

After seeding the database, you can login with:

**Admin Account:**
- Email: admin@abanyabuzare.rw
- Password: password123

**Treasurer Account:**
- Email: treasurer@abanyabuzare.rw
- Password: password123

**Member Account:**
- Email: member@abanyabuzare.rw
- Password: password123

**IMPORTANT:** Change these passwords in production!

## Database Schema Overview

### Tables:
- `users` - Authentication and user accounts
- `members` - Association member information
- `shares` - Share purchases by members
- `loans` - Loan applications and tracking
- `loan_payments` - Individual loan payment records
- `deposits` - Voluntary deposits and other transactions
- `audit_logs` - Activity tracking for compliance

### Roles & Permissions:
- **Admin** - Full access to all features
- **Treasurer** - Manage finances, approve loans, record transactions
- **Member** - View own information, apply for loans

## Backup & Maintenance

### Backup Database
```bash
pg_dump -U postgres abanyabuzare > backup.sql
```

### Restore Database
```bash
psql -U postgres -d abanyabuzare < backup.sql
```

## Troubleshooting

1. **Connection Error**: Check if PostgreSQL is running
2. **Permission Denied**: Ensure your user has proper database permissions
3. **Port Conflict**: Check if port 5432 is available or change in DATABASE_URL
