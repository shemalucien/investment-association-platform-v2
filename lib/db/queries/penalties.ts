import { query } from "../connection"

export async function createPenalty(data: {
  memberId: string
  penaltyType: "contribution" | "loan_payment"
  relatedEntityId?: string
  amount: number
  penaltyRate: number
  reason: string
}): Promise<any> {
  try {
    const result = await query<any>(
      `
      INSERT INTO penalties (
        member_id, penalty_type, related_entity_id, amount, penalty_rate, reason, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending', CURRENT_TIMESTAMP)
      RETURNING *
    `,
      [
        data.memberId,
        data.penaltyType,
        data.relatedEntityId || null,
        data.amount,
        data.penaltyRate,
        data.reason,
      ],
    )

    return result.rows[0]
  } catch (error) {
    const result = await query<any>(
      `
      INSERT INTO penalties (
        member_id, penalty_type, amount, reason, is_paid, applied_at
      )
      VALUES ($1, $2, $3, $4, false, CURRENT_TIMESTAMP)
      RETURNING *
    `,
      [data.memberId, data.penaltyType, data.amount, data.reason],
    )

    return result.rows[0]
  }
}

export async function getPenaltiesForMember(memberId: string): Promise<any[]> {
  try {
    const result = await query<any>(
      `
      SELECT 
        p.*,
        m.full_name as member_name,
        COALESCE(p.status, CASE WHEN p.is_paid THEN 'paid' ELSE 'pending' END) as status
      FROM penalties p
      LEFT JOIN members m ON p.member_id = m.id
      WHERE p.member_id = $1
      ORDER BY COALESCE(p.created_at, p.applied_at) DESC
    `,
      [memberId],
    )

    return result.rows.map((row) => ({
      ...row,
      status: row.status ?? (row.is_paid ? "paid" : "pending"),
      amount: Number(row.amount ?? 0),
      createdAt: row.created_at ?? row.applied_at,
      paidAt: row.paid_at ?? null,
    }))
  } catch (error) {
    const result = await query<any>(
      `
      SELECT 
        p.id,
        p.member_id,
        p.loan_id,
        p.penalty_type,
        p.amount,
        p.reason,
        p.applied_at,
        p.is_paid,
        p.paid_at,
        m.full_name as member_name
      FROM penalties p
      LEFT JOIN members m ON p.member_id = m.id
      WHERE p.member_id = $1
      ORDER BY p.applied_at DESC
    `,
      [memberId],
    )

    return result.rows.map((row) => ({
      ...row,
      status: row.is_paid ? "paid" : "pending",
      amount: Number(row.amount ?? 0),
      createdAt: row.applied_at,
      paidAt: row.paid_at ?? null,
    }))
  }
}

export async function getAllPenalties(): Promise<any[]> {
  try {
    const result = await query<any>(
      `
      SELECT 
        p.*,
        m.full_name as member_name,
        m.member_number,
        COALESCE(p.status, CASE WHEN p.is_paid THEN 'paid' ELSE 'pending' END) as status
      FROM penalties p
      LEFT JOIN members m ON p.member_id = m.id
      ORDER BY COALESCE(p.created_at, p.applied_at) DESC
    `,
    )

    return result.rows.map((row) => ({
      ...row,
      status: row.status ?? (row.is_paid ? "paid" : "pending"),
      amount: Number(row.amount ?? 0),
      createdAt: row.created_at ?? row.applied_at,
      paidAt: row.paid_at ?? null,
    }))
  } catch (error) {
    const result = await query<any>(
      `
      SELECT 
        p.id,
        p.member_id,
        p.loan_id,
        p.penalty_type,
        p.amount,
        p.reason,
        p.applied_at,
        p.is_paid,
        p.paid_at,
        m.full_name as member_name,
        m.member_number
      FROM penalties p
      LEFT JOIN members m ON p.member_id = m.id
      ORDER BY p.applied_at DESC
    `,
    )

    return result.rows.map((row) => ({
      ...row,
      status: row.is_paid ? "paid" : "pending",
      amount: Number(row.amount ?? 0),
      createdAt: row.applied_at,
      paidAt: row.paid_at ?? null,
    }))
  }
}

export async function markPenaltyAsPaid(penaltyId: string): Promise<any> {
  try {
    const result = await query<any>(
      `
      UPDATE penalties
      SET status = 'paid', paid_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `,
      [penaltyId],
    )

    return result.rows[0]
  } catch (error) {
    const result = await query<any>(
      `
      UPDATE penalties
      SET is_paid = true, paid_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `,
      [penaltyId],
    )

    return result.rows[0]
  }
}

export async function applyWeeklyContributionPenalties(): Promise<number> {
  // Find members who haven't made a contribution in the last 7 days
  const result = await query<any>(
    `
    INSERT INTO penalties (member_id, penalty_type, amount, penalty_rate, reason, status, created_at)
    SELECT 
      m.id as member_id,
      'contribution' as penalty_type,
      COALESCE(SUM(s.total_amount), 0) * 0.03 as amount,
      3 as penalty_rate,
      'Weekly contribution penalty - No contribution in the last 7 days' as reason,
      'pending' as status,
      CURRENT_TIMESTAMP as created_at
    FROM members m
    LEFT JOIN shares s ON m.id = s.member_id
    WHERE m.status = 'active'
    AND m.id NOT IN (
      SELECT DISTINCT d.member_id 
      FROM deposits d 
      WHERE d.deposit_date >= CURRENT_DATE - INTERVAL '7 days'
      AND d.deposit_type = 'voluntary'
    )
    AND m.id NOT IN (
      SELECT DISTINCT p.member_id 
      FROM penalties p 
      WHERE p.penalty_type = 'contribution'
      AND p.created_at >= CURRENT_DATE - INTERVAL '7 days'
      AND p.status = 'pending'
    )
    GROUP BY m.id
    RETURNING id
  `,
  )

  return result.rowCount || 0
}

export async function applyLoanPaymentPenalties(): Promise<number> {
  // Find active loans with missed payments
  const result = await query<any>(
    `
    INSERT INTO penalties (member_id, penalty_type, related_entity_id, amount, penalty_rate, reason, status, created_at)
    SELECT 
      l.member_id,
      'loan_payment' as penalty_type,
      l.id as related_entity_id,
      l.monthly_payment * 0.05 as amount,
      5 as penalty_rate,
      'Loan payment penalty - Missed payment deadline' as reason,
      'pending' as status,
      CURRENT_TIMESTAMP as created_at
    FROM loans l
    WHERE l.status = 'active'
    AND l.due_date < CURRENT_DATE
    AND l.id NOT IN (
      SELECT DISTINCT lp.loan_id 
      FROM loan_payments lp 
      WHERE lp.payment_date >= CURRENT_DATE - INTERVAL '30 days'
    )
    AND l.id NOT IN (
      SELECT DISTINCT p.related_entity_id::text 
      FROM penalties p 
      WHERE p.penalty_type = 'loan_payment'
      AND p.created_at >= CURRENT_DATE - INTERVAL '30 days'
      AND p.status = 'pending'
    )
    RETURNING id
  `,
  )

  return result.rowCount || 0
}
