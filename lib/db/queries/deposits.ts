import { query } from "../connection"
import type { Deposit } from "@/lib/types"

export async function getDepositsByMemberId(memberId: string): Promise<Deposit[]> {
  const result = await query<any>(
    `
    SELECT 
      d.*,
      m.full_name as member_name,
      m.member_number
    FROM deposits d
    JOIN members m ON d.member_id = m.id
    WHERE d.member_id = $1
    ORDER BY d.deposit_date DESC
  `,
    [memberId]
  )

  return result.rows.map((row) => ({
    id: row.id,
    memberId: row.member_id,
    memberName: row.member_name,
    depositType: row.deposit_type,
    amount: Number.parseFloat(row.amount),
    depositDate: row.deposit_date,
    paymentMethod: row.payment_method,
    description: row.description,
  }))
}

export async function getAllDeposits(): Promise<Deposit[]> {
  const result = await query<any>(`
    SELECT 
      d.*,
      m.full_name as member_name,
      m.member_number
    FROM deposits d
    JOIN members m ON d.member_id = m.id
    ORDER BY d.deposit_date DESC
  `)

  return result.rows.map((row) => ({
    id: row.id,
    memberId: row.member_id,
    memberName: row.member_name,
    depositType: row.deposit_type,
    amount: Number.parseFloat(row.amount),
    depositDate: row.deposit_date,
    paymentMethod: row.payment_method,
    description: row.description,
  }))
}

export async function createDeposit(data: {
  memberId: string
  depositType: string
  amount: number
  paymentMethod?: string
  description?: string
  createdBy?: string
  phoneNumber?: string
  cooperativeCode?: string
  cooperativeAccount?: string
  receiptFileName?: string
}): Promise<Deposit> {
  // Build description that includes extra info if provided
  let fullDescription = data.description || null
  const extras: string[] = []
  if (data.phoneNumber) extras.push(`Phone: ${data.phoneNumber}`)
  if (data.cooperativeAccount) extras.push(`Account: ${data.cooperativeAccount}`)
  if (data.receiptFileName) extras.push(`Receipt: ${data.receiptFileName}`)
  if (extras.length > 0) {
    fullDescription = fullDescription
      ? `${fullDescription} | ${extras.join(" | ")}`
      : extras.join(" | ")
  }

  const result = await query<any>(
    `
    INSERT INTO deposits (member_id, deposit_type, amount, payment_method, description, created_by)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `,
    [
      data.memberId,
      data.depositType,
      data.amount,
      data.paymentMethod || "cash",
      fullDescription,
      data.createdBy || null,
    ],
  )

  const row = result.rows[0]

  const memberResult = await query<any>(
    `SELECT full_name FROM members WHERE id = $1`,
    [data.memberId],
  )

  return {
    id: row.id,
    memberId: row.member_id,
    memberName: memberResult.rows[0]?.full_name ?? "",
    depositType: row.deposit_type,
    amount: Number.parseFloat(row.amount),
    depositDate: row.deposit_date,
    paymentMethod: row.payment_method,
    description: row.description,
  }
}

export async function getDepositsSummary(): Promise<{
  totalDeposits: number
  voluntaryDeposits: number
  loanRepayments: number
}> {
  const result = await query<any>(`
    SELECT 
      COALESCE(SUM(amount), 0) as total_deposits,
      COALESCE(SUM(amount) FILTER (WHERE deposit_type = 'voluntary'), 0) as voluntary_deposits,
      COALESCE(SUM(amount) FILTER (WHERE deposit_type = 'loan_repayment'), 0) as loan_repayments
    FROM deposits
  `)

  const row = result.rows[0]
  return {
    totalDeposits: Number.parseFloat(row.total_deposits),
    voluntaryDeposits: Number.parseFloat(row.voluntary_deposits),
    loanRepayments: Number.parseFloat(row.loan_repayments),
  }
}
