import { query } from "../connection"
import type { SocialContribution, SocialActivity } from "@/lib/types"

// Get all social contributions with member details
export async function getAllSocialContributions(year?: number): Promise<SocialContribution[]> {
  const yearFilter = year ? `WHERE sc.contribution_year = $1` : ""
  const params = year ? [year] : []

  const result = await query<any>(
    `
    SELECT 
      sc.*,
      m.full_name as member_name
    FROM social_contributions sc
    JOIN members m ON sc.member_id = m.id
    ${yearFilter}
    ORDER BY sc.contribution_year DESC, m.full_name
  `,
    params,
  )

  return result.rows.map((row) => ({
    id: row.id,
    memberId: row.member_id,
    memberName: row.member_name,
    contributionYear: row.contribution_year,
    amount: Number.parseFloat(row.amount),
    paymentDate: row.payment_date,
    paymentMethod: row.payment_method,
    receiptNumber: row.receipt_number,
    notes: row.notes,
    status: row.status,
  }))
}

// Record a new social contribution
export async function createSocialContribution(data: {
  memberId: string
  contributionYear: number
  amount: number
  paymentMethod?: string
  receiptNumber?: string
  notes?: string
  status?: string
}): Promise<SocialContribution> {
  const result = await query<any>(
    `
    INSERT INTO social_contributions 
      (member_id, contribution_year, amount, payment_method, receipt_number, notes, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `,
    [
      data.memberId,
      data.contributionYear,
      data.amount,
      data.paymentMethod || "cash",
      data.receiptNumber || null,
      data.notes || null,
      data.status || "paid",
    ],
  )

  const row = result.rows[0]
  const member = await query<any>(`SELECT full_name FROM members WHERE id = $1`, [data.memberId])

  return {
    id: row.id,
    memberId: row.member_id,
    memberName: member.rows[0]?.full_name || "",
    contributionYear: row.contribution_year,
    amount: Number.parseFloat(row.amount),
    paymentDate: row.payment_date,
    paymentMethod: row.payment_method,
    receiptNumber: row.receipt_number,
    notes: row.notes,
    status: row.status,
  }
}

// Get social contribution summary
export async function getSocialContributionSummary(year?: number) {
  const currentYear = year || new Date().getFullYear()

  const result = await query<any>(
    `
    SELECT 
      COUNT(DISTINCT m.id) as total_members,
      COUNT(DISTINCT sc.member_id) as contributing_members,
      COALESCE(SUM(sc.amount), 0) as total_collected,
      COUNT(DISTINCT m.id) - COUNT(DISTINCT sc.member_id) as pending_members
    FROM members m
    LEFT JOIN social_contributions sc ON m.id = sc.member_id AND sc.contribution_year = $1
    WHERE m.status = 'active'
  `,
    [currentYear],
  )

  const row = result.rows[0]
  return {
    totalMembers: Number.parseInt(row.total_members),
    contributingMembers: Number.parseInt(row.contributing_members),
    totalCollected: Number.parseFloat(row.total_collected),
    pendingMembers: Number.parseInt(row.pending_members),
    expectedTotal: Number.parseInt(row.total_members) * 50000,
  }
}

// Get all social activities
export async function getAllSocialActivities(): Promise<SocialActivity[]> {
  const result = await query<any>(
    `
    SELECT * FROM social_activities
    ORDER BY activity_date DESC
  `,
  )

  return result.rows.map((row) => ({
    id: row.id,
    activityName: row.activity_name,
    activityDate: row.activity_date,
    description: row.description,
    totalBudget: Number.parseFloat(row.total_budget),
    amountSpent: Number.parseFloat(row.amount_spent),
    beneficiaries: row.beneficiaries,
    status: row.status,
    createdAt: row.created_at,
  }))
}

// Create a new social activity
export async function createSocialActivity(data: {
  activityName: string
  activityDate: string
  description?: string
  totalBudget: number
  beneficiaries?: string[]
  status?: string
  createdBy?: string
}): Promise<SocialActivity> {
  const result = await query<any>(
    `
    INSERT INTO social_activities 
      (activity_name, activity_date, description, total_budget, beneficiaries, status, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `,
    [
      data.activityName,
      data.activityDate,
      data.description || null,
      data.totalBudget,
      data.beneficiaries || null,
      data.status || "planned",
      data.createdBy || null,
    ],
  )

  const row = result.rows[0]
  return {
    id: row.id,
    activityName: row.activity_name,
    activityDate: row.activity_date,
    description: row.description,
    totalBudget: Number.parseFloat(row.total_budget),
    amountSpent: Number.parseFloat(row.amount_spent),
    beneficiaries: row.beneficiaries,
    status: row.status,
    createdAt: row.created_at,
  }
}

// Get social fund balance
export async function getSocialFundBalance() {
  const result = await query<any>(`
    SELECT 
      COALESCE(SUM(sc.amount), 0) as total_contributions,
      COALESCE(SUM(sa.amount_spent), 0) as total_spent
    FROM social_contributions sc
    CROSS JOIN social_activities sa
  `)

  const row = result.rows[0]
  const totalContributions = Number.parseFloat(row.total_contributions)
  const totalSpent = Number.parseFloat(row.total_spent)

  return {
    totalContributions,
    totalSpent,
    availableBalance: totalContributions - totalSpent,
  }
}
