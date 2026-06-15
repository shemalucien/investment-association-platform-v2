import { query } from "../connection"
import { createNotificationForMember } from "./notifications"
import type { Loan } from "@/lib/types"

export async function getAllLoans(): Promise<Loan[]> {
  const result = await query<any>(`
    SELECT 
      l.*,
      m.full_name as member_name,
      m.member_number,
      COALESCE(SUM(lp.amount) FILTER (WHERE lp.status = 'confirmed'), 0) as amount_paid
    FROM loans l
    LEFT JOIN members m ON l.member_id = m.id
    LEFT JOIN loan_payments lp ON l.id = lp.loan_id
    GROUP BY l.id, m.full_name, m.member_number
    ORDER BY l.application_date DESC
  `)

  return result.rows.map((row) => {
    const totalRepayment = Number.parseFloat(row.total_amount || 0)
    const amountPaid = Number.parseFloat(row.amount_paid || 0)
    const remainingBalance = totalRepayment - amountPaid
    
    return {
      id: row.id,
      memberId: row.member_id,
      memberName: row.member_name || 'Unknown Member',
      principalAmount: Number.parseFloat(row.principal_amount),
      interestRate: Number.parseFloat(row.interest_rate),
      duration: row.duration_months,
      monthlyPayment: Number.parseFloat(row.monthly_payment),
      totalRepayment: totalRepayment,
      amountPaid: amountPaid,
      remainingBalance: remainingBalance,
      applicationDate: row.application_date,
      approvalDate: row.approval_date,
      status: row.status,
      guarantors: row.guarantors ? JSON.parse(row.guarantors) : [],
      agreementFileName: row.agreement_file_name,
    }
  })
}

export async function getLoansByMemberId(memberId: string): Promise<Loan[]> {
  const result = await query<any>(
    `
    SELECT 
      l.*,
      m.full_name as member_name,
      m.member_number,
      COALESCE(SUM(lp.amount) FILTER (WHERE lp.status = 'confirmed'), 0) as amount_paid
    FROM loans l
    LEFT JOIN members m ON l.member_id = m.id
    LEFT JOIN loan_payments lp ON l.id = lp.loan_id
    WHERE l.member_id = $1
    GROUP BY l.id, m.full_name, m.member_number
    ORDER BY l.application_date DESC
  `,
    [memberId],
  )

  return result.rows.map((row) => {
    const totalRepayment = Number.parseFloat(row.total_amount || 0)
    const amountPaid = Number.parseFloat(row.amount_paid || 0)
    const remainingBalance = totalRepayment - amountPaid

    return {
      id: row.id,
      memberId: row.member_id,
      memberName: row.member_name || "Unknown Member",
      principalAmount: Number.parseFloat(row.principal_amount),
      interestRate: Number.parseFloat(row.interest_rate),
      duration: row.duration_months,
      monthlyPayment: Number.parseFloat(row.monthly_payment),
      totalRepayment,
      amountPaid,
      remainingBalance,
      applicationDate: row.application_date,
      approvalDate: row.approval_date,
      status: row.status,
      guarantors: row.guarantors ? JSON.parse(row.guarantors) : [],
      agreementFileName: row.agreement_file_name,
    }
  })
}

export async function getLoanById(id: string): Promise<Loan | null> {
  const result = await query<any>(
    `
    SELECT 
      l.*,
      m.full_name as member_name,
      m.member_number,
      COALESCE(SUM(lp.amount) FILTER (WHERE lp.status = 'confirmed'), 0) as amount_paid
    FROM loans l
    LEFT JOIN members m ON l.member_id = m.id
    LEFT JOIN loan_payments lp ON l.id = lp.loan_id
    WHERE l.id = $1
    GROUP BY l.id, m.full_name, m.member_number
  `,
    [id],
  )

  if (result.rows.length === 0) return null

  const row = result.rows[0]
  const totalRepayment = Number.parseFloat(row.total_amount || 0)
  const amountPaid = Number.parseFloat(row.amount_paid || 0)
  const remainingBalance = totalRepayment - amountPaid
  
  return {
    id: row.id,
    memberId: row.member_id,
    memberName: row.member_name || 'Unknown Member',
    principalAmount: Number.parseFloat(row.principal_amount),
    interestRate: Number.parseFloat(row.interest_rate),
    duration: row.duration_months,
    monthlyPayment: Number.parseFloat(row.monthly_payment),
    totalRepayment: totalRepayment,
    amountPaid: amountPaid,
    remainingBalance: remainingBalance,
    applicationDate: row.application_date,
    approvalDate: row.approval_date,
    status: row.status,
    guarantors: row.guarantors ? JSON.parse(row.guarantors) : [],
    agreementFileName: row.agreement_file_name,
  }
}

export async function createLoan(data: {
  memberId: string
  principalAmount: number
  interestRate: number
  durationMonths: number
  purpose: string
  notes?: string
  guarantors?: string[]
  agreementFileName?: string
}): Promise<Loan> {
  // Generate loan number safely using count
  const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM loans`)
  const count = Number.parseInt(countResult.rows[0]?.count || "0") + 1
  const loanNumber = `LOAN${String(count).padStart(3, "0")}`

  // Check for duplicate loan number just in case
  const existingResult = await query<{ id: string }>(`SELECT id FROM loans WHERE loan_number = $1`, [loanNumber])
  const finalLoanNumber = existingResult.rows.length > 0
    ? `LOAN${String(Date.now()).slice(-6)}`
    : loanNumber

  // Calculate loan details (10% flat rate on principal)
  const totalInterest = (data.principalAmount * data.interestRate) / 100
  const totalAmount = data.principalAmount + totalInterest
  const monthlyPayment = totalAmount / data.durationMonths

  const result = await query<any>(
    `
    INSERT INTO loans (
      member_id, loan_number, principal_amount, interest_rate, total_interest,
      total_amount, duration_months, monthly_payment, purpose, notes, status,
      guarantors, agreement_file_name
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11, $12)
    RETURNING *
  `,
    [
      data.memberId,
      finalLoanNumber,
      data.principalAmount,
      data.interestRate,
      totalInterest,
      totalAmount,
      data.durationMonths,
      monthlyPayment,
      data.purpose,
      data.notes || null,
      data.guarantors && data.guarantors.length > 0 ? JSON.stringify(data.guarantors) : null,
      data.agreementFileName || null,
    ],
  )

  const row = result.rows[0]

  const memberResult = await query<any>(
    `SELECT full_name FROM members WHERE id = $1`,
    [data.memberId],
  )

  const totalRepayment = Number.parseFloat(row.total_amount)

  return {
    id: row.id,
    memberId: row.member_id,
    memberName: memberResult.rows[0]?.full_name || "Unknown Member",
    principalAmount: Number.parseFloat(row.principal_amount),
    interestRate: Number.parseFloat(row.interest_rate),
    duration: row.duration_months,
    monthlyPayment: Number.parseFloat(row.monthly_payment),
    totalRepayment,
    amountPaid: 0,
    remainingBalance: totalRepayment,
    applicationDate: row.application_date,
    approvalDate: undefined,
    status: row.status,
    guarantors: data.guarantors || [],
    agreementFileName: data.agreementFileName,
  }
}

export async function updateLoanStatus(id: string, status: string, approvedBy?: string): Promise<Loan | null> {
  const existingLoan = await getLoanById(id)
  if (!existingLoan) {
    return null
  }

  const updates = ["status = $1"]
  const values: any[] = [status]
  let paramIndex = 2

  if (status === "approved" || status === "active") {
    updates.push(`approval_date = CURRENT_DATE`)
    if (approvedBy) {
      updates.push(`approved_by = $${paramIndex++}`)
      values.push(approvedBy)
    }
  }

  if (status === "active") {
    updates.push(`disbursement_date = CURRENT_DATE`)

    // Calculate due date based on duration
    updates.push(`due_date = CURRENT_DATE + INTERVAL '1 month' * duration_months`)
  }

  values.push(id)
  await query(
    `
    UPDATE loans
    SET ${updates.join(", ")}
    WHERE id = $${paramIndex}
  `,
    values,
  )

  const updatedLoan = await getLoanById(id)
  if (updatedLoan) {
    if (status === "active") {
      await createNotificationForMember(
        updatedLoan.memberId,
        `Loan Application Approved`,
        `Your loan application for RWF ${updatedLoan.principalAmount.toFixed(2)} has been approved and disbursed. Monthly payment: RWF ${updatedLoan.monthlyPayment.toFixed(2)}.`,
        "loan",
        updatedLoan.id,
        "success",
      )
    } else if (status === "rejected") {
      await createNotificationForMember(
        updatedLoan.memberId,
        `Loan Application Rejected`,
        `Your loan application has been rejected. Please contact the cooperative office for more details.`,
        "loan",
        updatedLoan.id,
        "warning",
      )
    }
  }

    return updatedLoan
}
