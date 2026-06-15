import { query } from "../connection"
import type { Member } from "@/lib/types"

// Returns only active cooperative members for use as loan guarantors
export async function getActiveMembersForGuarantors(): Promise<Pick<Member, "id" | "name" | "memberNumber">[]> {
  const result = await query<any>(`
    SELECT id, full_name, member_number
    FROM members
    WHERE status = 'active'
    ORDER BY full_name ASC
  `)

  return result.rows.map((row) => ({
    id: row.id,
    name: row.full_name,
    memberNumber: row.member_number,
  }))
}

export async function getAllMembers(): Promise<Member[]> {
  const result = await query<any>(`
    SELECT 
      m.*,
      COALESCE(SUM(s.total_amount), 0) as total_shares,
      COALESCE(SUM(d.amount) FILTER (WHERE d.deposit_type = 'voluntary'), 0) as total_deposits
    FROM members m
    LEFT JOIN shares s ON m.id = s.member_id
    LEFT JOIN deposits d ON m.id = d.member_id
    GROUP BY m.id
    ORDER BY m.member_number
  `)

  return result.rows.map((row) => ({
    id: row.id,
    memberNumber: row.member_number,
    name: row.full_name,
    email: row.email,
    phone: row.phone,
    nationalId: row.national_id,
    address: row.address,
    joinDate: row.join_date,
    status: row.status,
    totalShares: Number.parseFloat(row.total_shares),
    totalDeposits: Number.parseFloat(row.total_deposits),
  }))
}

export async function getMemberById(id: string): Promise<Member | null> {
  const result = await query<any>(
    `
    SELECT 
      m.*,
      COALESCE(SUM(s.total_amount), 0) as total_shares,
      COALESCE(SUM(d.amount) FILTER (WHERE d.deposit_type = 'voluntary'), 0) as total_deposits
    FROM members m
    LEFT JOIN shares s ON m.id = s.member_id
    LEFT JOIN deposits d ON m.id = d.member_id
    WHERE m.id = $1
    GROUP BY m.id
  `,
    [id],
  )

  if (result.rows.length === 0) return null

  const row = result.rows[0]
  return {
    id: row.id,
    memberNumber: row.member_number,
    name: row.full_name,
    email: row.email,
    phone: row.phone,
    nationalId: row.national_id,
    address: row.address,
    joinDate: row.join_date,
    status: row.status,
    totalShares: Number.parseFloat(row.total_shares),
    totalDeposits: Number.parseFloat(row.total_deposits),
  }
}

export async function getMemberByUserId(userId: string): Promise<Member | null> {
  const result = await query<any>(
    `
    SELECT 
      m.*,
      COALESCE(SUM(s.total_amount), 0) as total_shares,
      COALESCE(SUM(d.amount) FILTER (WHERE d.deposit_type = 'voluntary'), 0) as total_deposits
    FROM members m
    LEFT JOIN shares s ON m.id = s.member_id
    LEFT JOIN deposits d ON m.id = d.member_id
    WHERE m.user_id = $1
    GROUP BY m.id
  `,
    [userId],
  )

  if (result.rows.length === 0) return null

  const row = result.rows[0]
  return {
    id: row.id,
    memberNumber: row.member_number,
    name: row.full_name,
    email: row.email,
    phone: row.phone,
    nationalId: row.national_id,
    address: row.address,
    joinDate: row.join_date,
    status: row.status,
    totalShares: Number.parseFloat(row.total_shares),
    totalDeposits: Number.parseFloat(row.total_deposits),
  }
}

export async function createMember(data: {
  fullName: string
  email: string
  phone: string
  nationalId: string
  address?: string
  userId?: string
}): Promise<Member> {
  // Generate member number
  const lastMemberResult = await query<{ member_number: string }>(`
    SELECT member_number FROM members ORDER BY member_number DESC LIMIT 1
  `)

  let memberNumber = "ABZ001"
  if (lastMemberResult.rows.length > 0) {
    const lastNumber = Number.parseInt(lastMemberResult.rows[0].member_number.replace("ABZ", ""))
    memberNumber = `ABZ${String(lastNumber + 1).padStart(3, "0")}`
  }

  const result = await query<any>(
    `
    INSERT INTO members (user_id, member_number, full_name, email, phone, national_id, address)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `,
    [data.userId || null, memberNumber, data.fullName, data.email, data.phone, data.nationalId, data.address || null],
  )

  const row = result.rows[0]
  return {
    id: row.id,
    memberNumber: row.member_number,
    name: row.full_name,
    email: row.email,
    phone: row.phone,
    nationalId: row.national_id,
    address: row.address,
    joinDate: row.join_date,
    status: row.status,
    totalShares: 0,
    totalDeposits: 0,
  }
}

export async function updateMember(
  id: string,
  data: Partial<{
    fullName: string
    email: string
    phone: string
    address: string
    status: string
  }>,
): Promise<Member | null> {
  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (data.fullName) {
    updates.push(`full_name = $${paramIndex++}`)
    values.push(data.fullName)
  }
  if (data.email) {
    updates.push(`email = $${paramIndex++}`)
    values.push(data.email)
  }
  if (data.phone) {
    updates.push(`phone = $${paramIndex++}`)
    values.push(data.phone)
  }
  if (data.address) {
    updates.push(`address = $${paramIndex++}`)
    values.push(data.address)
  }
  if (data.status) {
    updates.push(`status = $${paramIndex++}`)
    values.push(data.status)
  }

  if (updates.length === 0) return getMemberById(id)

  values.push(id)
  const result = await query<any>(
    `
    UPDATE members
    SET ${updates.join(", ")}
    WHERE id = $${paramIndex}
    RETURNING *
  `,
    values,
  )

  if (result.rows.length === 0) return null
  return getMemberById(id)
}

export async function deleteMember(id: string): Promise<boolean> {
  // Check existence first since DELETE RETURNING * is more reliable than rowCount with Neon
  const existing = await query<any>(`SELECT id FROM members WHERE id = $1`, [id])
  if (existing.rows.length === 0) return false

  await query<any>(`DELETE FROM members WHERE id = $1`, [id])
  return true
}
