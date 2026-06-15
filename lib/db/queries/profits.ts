import { query } from "../connection"
import { createNotificationForMember } from "./notifications"

export async function createProfitDistribution(data: {
  totalAmount: number
  description: string
  period: string
}): Promise<any> {
  // Get all active members with their shares
  const membersResult = await query<any>(`
    SELECT 
      m.id as member_id,
      m.full_name,
      m.member_number,
      COALESCE(SUM(s.number_of_shares), 0) as total_shares
    FROM members m
    LEFT JOIN shares s ON m.id = s.member_id
    WHERE m.status = 'active'
    GROUP BY m.id, m.full_name, m.member_number
  `)

  const members = membersResult.rows
  const totalShares = members.reduce((sum: number, m: any) => sum + (m.total_shares || 0), 0)

  // Create profit distribution record
  const profitResult = await query<any>(
    `
    INSERT INTO profit_distributions (total_amount, total_shares, description, period, distribution_date)
    VALUES ($1, $2, $3, $4, CURRENT_DATE)
    RETURNING *
  `,
    [data.totalAmount, totalShares, data.description, data.period],
  )

  const profitDistribution = profitResult.rows[0]

  // Distribute profits to members (2% per share)
  const profitPerShare = 0.02 // 2/100 = 2%
  const distributions: any[] = []

  for (const member of members) {
    if (member.total_shares > 0) {
      const memberProfit = data.totalAmount * (member.total_shares * profitPerShare)
      
      const distributionResult = await query<any>(
        `
        INSERT INTO member_profits (member_id, profit_distribution_id, shares_count, profit_amount, status)
        VALUES ($1, $2, $3, $4, 'distributed')
        RETURNING *
      `,
        [member.member_id, profitDistribution.id, member.total_shares, memberProfit],
      )

      distributions.push(distributionResult.rows[0])

      // Notify member about profit distribution
      try {
        await createNotificationForMember(
          member.member_id,
          "Profit Distribution",
          `You have received ${memberProfit.toLocaleString()} RWF in profit distribution for ${data.period}. Based on ${member.total_shares} shares.`,
          "profit",
          profitDistribution.id,
          "success"
        )
      } catch (notificationError) {
        console.error("[v0] Error creating notification for member:", notificationError)
      }
    }
  }

  return {
    profitDistribution,
    distributions,
  }
}

export async function getProfitDistributions(): Promise<any[]> {
  try {
    const result = await query<any>(`
      SELECT 
        pd.*,
        COUNT(mp.id) as member_count
      FROM profit_distributions pd
      LEFT JOIN member_profits mp ON pd.id = mp.profit_distribution_id
      GROUP BY pd.id
      ORDER BY pd.distribution_date DESC
    `)

    return result.rows
  } catch (error) {
    console.warn("[v0] Profit distributions table unavailable, returning empty data.", error)
    return []
  }
}

export async function getMemberProfits(memberId: string): Promise<any[]> {
  try {
    const result = await query<any>(`
      SELECT 
        mp.*,
        pd.description,
        pd.period,
        pd.distribution_date
      FROM member_profits mp
      JOIN profit_distributions pd ON mp.profit_distribution_id = pd.id
      WHERE mp.member_id = $1
      ORDER BY pd.distribution_date DESC
    `,
      [memberId],
    )

    return result.rows
  } catch (error) {
    console.warn("[v0] Member profit tables unavailable, returning empty data.", error)
    return []
  }
}

export async function getTotalMemberProfits(memberId: string): Promise<number> {
  try {
    const result = await query<any>(`
      SELECT COALESCE(SUM(profit_amount), 0) as total
      FROM member_profits
      WHERE member_id = $1
      AND status = 'distributed'
    `,
      [memberId],
    )

    return Number.parseFloat(result.rows[0]?.total ?? 0)
  } catch (error) {
    console.warn("[v0] Member profit totals unavailable, returning 0.", error)
    return 0
  }
}
