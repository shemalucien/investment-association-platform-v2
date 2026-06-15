# ABANYABUZARE - Investment Association Management Platform

ABANYABUZARE is a comprehensive full-stack platform designed for investment associations to manage their finances, members, and social activities transparently and efficiently.

## Core Features

- **Member Management**: Track member profiles, join dates, and financial status.
- **Shares Tracking**: Manage share purchases and distribution among members.
- **Loan System**: Automated loan applications with 10% interest calculations and approval workflows.
- **Deposits & Savings**: Record voluntary deposits and loan repayments.
- **Social Contributions**: Manage the mandatory 50,000 RWF annual contribution for social activities.
- **Financial Reporting**: Detailed balance sheets, liquidity analysis, and profit distribution reports.
- **Role-Based Security**: Admin, Treasurer, and Member roles with specific authorization levels.

## Tech Stack

- **Frontend**: Next.js 16, Tailwind CSS, Shadcn UI
- **Backend**: Next.js Route Handlers (API Routes)
- **Database**: PostgreSQL (Local or Remote)
- **Auth**: JWT-based authentication with Bcrypt password hashing

## Setup Instructions

### 1. Database Setup
Please refer to the detailed [DATABASE_SETUP.md](./DATABASE_SETUP.md) for instructions on how to set up your local PostgreSQL database.

### 2. Environment Configuration
Create a `.env` file in the root directory (refer to the setup guide for details):
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/abanyabuzare
JWT_SECRET=your-secret-key
```

### 3. Installation
```bash
npm install
npm run dev
```

## User Access Levels

- **Admin**: Can manage all aspects of the association.
- **Treasurer**: Focuses on financial transactions, deposits, and loan management.
- **Member**: Can view personal data and apply for loans.

## License
Proprietary - Developed for ABANYABUZARE Association.
