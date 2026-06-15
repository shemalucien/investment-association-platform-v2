// Core data types for ABANYABUZARE Investment Association

export interface Member {
  id: string
  memberNumber?: string
  name: string
  email: string
  phone: string
  nationalId?: string
  address?: string
  joinDate: string
  totalShares: number
  totalDeposits: number
  activeLoans: number
  status: "active" | "inactive" | "pending"
}

export interface Share {
  id: string
  memberId: string
  memberName: string
  numberOfShares: number
  pricePerShare: number
  totalAmount: number
  purchaseDate: string
  status: "active" | "sold"
}

export interface Loan {
  id: string
  memberId: string
  memberName: string
  principalAmount: number
  interestRate: number
  duration: number // in months
  monthlyPayment: number
  totalRepayment: number
  amountPaid: number
  remainingBalance: number
  applicationDate: string
  approvalDate?: string
  status: "pending" | "approved" | "active" | "completed" | "rejected"
  guarantors: string[]
  agreementFileName?: string
}

export interface Notification {
  id: string
  memberId: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "alert"
  read: boolean
  relatedEntityType?: string
  relatedEntityId?: string
  attachmentName?: string
  attachmentType?: string
  attachmentData?: string
  createdAt: string
}

export interface Deposit {
  id: string
  memberId: string
  memberName: string
  amount: number
  depositDate: string
  type: "voluntary" | "share-payment" | "loan-repayment"
  description: string
}

export interface Transaction {
  id: string
  memberId: string
  memberName: string
  type: "share-purchase" | "loan-disbursement" | "loan-repayment" | "deposit" | "withdrawal"
  amount: number
  date: string
  description: string
}

export interface FinancialSummary {
  totalCapital: number
  totalShares: number
  totalLoansIssued: number
  totalLoansOutstanding: number
  totalDeposits: number
  totalInterestEarned: number
  availableFunds: number
}

export interface SocialContribution {
  id: string
  memberId: string
  memberName: string
  contributionYear: number
  amount: number
  paymentDate: string
  paymentMethod: string
  receiptNumber?: string
  notes?: string
  status: "paid" | "pending" | "partial"
}

export interface SocialActivity {
  id: string
  activityName: string
  activityDate: string
  description?: string
  totalBudget: number
  amountSpent: number
  beneficiaries?: string[]
  status: "planned" | "ongoing" | "completed" | "cancelled"
  createdAt: string
}

export interface SocialActivityExpense {
  id: string
  activityId: string
  description: string
  amount: number
  expenseDate: string
  receiptNumber?: string
  notes?: string
}
