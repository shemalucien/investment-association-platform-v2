import { type NextRequest, NextResponse } from "next/server"
import { applyWeeklyContributionPenalties, applyLoanPaymentPenalties } from "@/lib/db/queries/penalties"
import { createNotificationForMember } from "@/lib/db/queries/notifications"
import { query } from "@/lib/db/connection"

export async function POST(request: NextRequest) {
  try {
    // Verify this is a cron job request (should have a secret header)
    const cronSecret = request.headers.get("x-cron-secret")
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Apply weekly contribution penalties
    const contributionPenalties = await applyWeeklyContributionPenalties()

    // Apply loan payment penalties
    const loanPenalties = await applyLoanPaymentPenalties()

    // Notify members about loan payment penalties
    if (loanPenalties > 0) {
      try {
        const recentLoanPenaltiesResult = await query<any>(
          `SELECT DISTINCT p.member_id, m.full_name, l.loan_number
           FROM penalties p
           JOIN members m ON p.member_id = m.id
           JOIN loans l ON p.related_entity_id::text = l.id
           WHERE p.penalty_type = 'loan_payment'
           AND p.created_at >= CURRENT_DATE - INTERVAL '1 day'
           AND p.status = 'pending'`
        )

        for (const penalty of recentLoanPenaltiesResult.rows) {
          await createNotificationForMember(
            penalty.member_id,
            "Loan Payment Penalty Applied",
            `You have missed a loan payment deadline for loan ${penalty.loan_number}. A 5% penalty has been applied. Penalties are applied monthly for missed payments. Please pay immediately to avoid further penalties.`,
            "penalty",
            "cron",
            "warning"
          )
        }
      } catch (notificationError) {
        console.error("[v0] Error creating notification for members:", notificationError)
      }
    }

    // Notify admin about applied penalties
    try {
      const adminUserResult = await query<any>(
        `SELECT u.id as user_id, m.id as member_id FROM users u 
         LEFT JOIN members m ON u.id = m.user_id 
         WHERE u.role = 'admin' AND u.is_active = true 
         LIMIT 1`
      )

      if (adminUserResult.rows.length > 0 && adminUserResult.rows[0].member_id) {
        await createNotificationForMember(
          adminUserResult.rows[0].member_id,
          "Penalties Applied",
          `${contributionPenalties} contribution penalties and ${loanPenalties} loan payment penalties have been applied automatically.`,
          "penalty",
          "cron",
          "warning"
        )
      }
    } catch (notificationError) {
      console.error("[v0] Error creating notification for admin:", notificationError)
    }

    return NextResponse.json({
      success: true,
      data: {
        contributionPenalties,
        loanPenalties,
        total: contributionPenalties + loanPenalties,
      },
    })
  } catch (error) {
    console.error("[v0] Error applying penalties:", error)
    return NextResponse.json({ success: false, error: "Failed to apply penalties" }, { status: 500 })
  }
}
