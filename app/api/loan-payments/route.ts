import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db/connection"
import { createNotificationForMember } from "@/lib/db/queries/notifications"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const memberParam = searchParams.get("memberId")
    const pendingOnly = searchParams.get("pending") === "true"

    // Admin: fetch all pending payments across all members
    if (pendingOnly) {
      const result = await query<any>(
        `SELECT 
          lp.id, lp.loan_id, lp.amount, lp.payment_date, lp.status,
          lp.receipt_file_name, lp.confirmed_at,
          l.loan_number, l.total_amount as loan_total_amount, l.monthly_payment as loan_monthly_payment,
          m.full_name as member_name, m.member_number
        FROM loan_payments lp
        JOIN loans l ON lp.loan_id = l.id
        JOIN members m ON l.member_id = m.id
        WHERE lp.status = 'pending'
        ORDER BY lp.payment_date DESC`
      )
      return NextResponse.json({
        success: true,
        data: result.rows.map((row) => ({
          id: row.id,
          loanId: row.loan_id,
          loanNumber: row.loan_number,
          memberName: row.member_name,
          memberNumber: row.member_number,
          amount: Number.parseFloat(row.amount),
          paymentDate: row.payment_date,
          status: row.status,
          receiptFileName: row.receipt_file_name,
          confirmedAt: row.confirmed_at,
        })),
      })
    }

    if (!memberParam) {
      return NextResponse.json({ success: false, error: "Missing memberId parameter" }, { status: 400 })
    }

    // Resolve user_id → members.id
    const memberLookup = await query<any>(
      `SELECT id FROM members WHERE id = $1 OR user_id = $1`,
      [memberParam]
    )
    const memberId = memberLookup.rows[0]?.id ?? memberParam

    const result = await query<any>(
      `
      SELECT 
        lp.*,
        l.loan_number,
        l.total_amount as loan_total_amount,
        l.monthly_payment as loan_monthly_payment
      FROM loan_payments lp
      JOIN loans l ON lp.loan_id = l.id
      WHERE l.member_id = $1
      ORDER BY lp.payment_date DESC
      `,
      [memberId]
    )

    return NextResponse.json({
      success: true,
      data: result.rows.map((row) => ({
        id: row.id,
        loanId: row.loan_id,
        loanNumber: row.loan_number,
        amount: Number.parseFloat(row.amount),
        paymentDate: row.payment_date,
        status: row.status,
        receiptFileName: row.receipt_file_name,
        confirmedAt: row.confirmed_at,
        loanTotalAmount: Number.parseFloat(row.loan_total_amount),
        loanMonthlyPayment: Number.parseFloat(row.loan_monthly_payment),
      }))
    })
  } catch (error) {
    console.error("[v0] Error fetching loan payments:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch loan payments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type")

    if (contentType?.includes("multipart/form-data")) {
      // Handle FormData with file upload
      const formData = await request.formData()
      const loanId = formData.get("loanId") as string
      const amount = formData.get("amount") as string
      const receipt = formData.get("receipt") as File

      if (!loanId || !amount) {
        return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
      }

      // Create loan payment with pending status
      const result = await query<any>(
        `
        INSERT INTO loan_payments (loan_id, amount, payment_date, status, receipt_file_name)
        VALUES ($1, $2, CURRENT_DATE, 'pending', $3)
        RETURNING *
      `,
        [loanId, Number.parseFloat(amount), receipt?.name || null],
      )

      const payment = result.rows[0]

      // Get loan details for notification
      const loanResult = await query<any>(
        `SELECT l.*, m.id as member_id, m.full_name as member_name FROM loans l JOIN members m ON l.member_id = m.id WHERE l.id = $1`,
        [loanId],
      )

      if (loanResult.rows.length > 0) {
        const loan = loanResult.rows[0]

        // Notify admin about pending loan payment
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
              "Loan Payment Pending Confirmation",
              `Loan payment of ${Number.parseFloat(amount).toLocaleString()} RWF submitted by ${loan.member_name} for loan ${loan.loan_number} on ${new Date().toLocaleDateString()}. Receipt: ${receipt?.name || 'No receipt'}. Please confirm.`,
              "loan_payment",
              payment.id,
              "info"
            )
          }
        } catch (notificationError) {
          console.error("[v0] Error creating notification for admin:", notificationError)
        }
      }

      return NextResponse.json({ success: true, data: payment }, { status: 201 })
    } else {
      // Handle JSON request (backward compatibility)
      const body = await request.json()

      if (!body.loanId || !body.amount) {
        return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
      }

      const result = await query<any>(
        `
        INSERT INTO loan_payments (loan_id, amount, payment_date, status)
        VALUES ($1, $2, CURRENT_DATE, 'pending')
        RETURNING *
      `,
        [body.loanId, body.amount],
      )

      return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 })
    }
  } catch (error) {
    console.error("[v0] Error creating loan payment:", error)
    return NextResponse.json({ success: false, error: "Failed to create loan payment" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.paymentId || !body.status) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Update payment status
    const result = await query<any>(
      `UPDATE loan_payments
       SET status = $1, confirmed_at = CURRENT_DATE
       WHERE id = $2
       RETURNING *`,
      [body.status, body.paymentId],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 })
    }

    const payment = result.rows[0]

    // Get loan + member details
    const loanResult = await query<any>(
      `SELECT l.*, m.id as member_id, m.full_name as member_name
       FROM loans l
       JOIN members m ON l.member_id = m.id
       WHERE l.id = $1`,
      [payment.loan_id],
    )

    if (loanResult.rows.length > 0) {
      const loan = loanResult.rows[0]

      if (body.status === "confirmed") {
        // Check if loan is now fully paid (sum only confirmed payments)
        const paidResult = await query<any>(
          `SELECT COALESCE(SUM(amount), 0) as total_confirmed
           FROM loan_payments
           WHERE loan_id = $1 AND status = 'confirmed'`,
          [payment.loan_id]
        )
        const totalConfirmed = Number.parseFloat(paidResult.rows[0]?.total_confirmed || "0")
        const totalRepayment = Number.parseFloat(loan.total_amount)

        if (totalConfirmed >= totalRepayment) {
          // Mark loan as completed
          await query(
            `UPDATE loans SET status = 'completed' WHERE id = $1`,
            [payment.loan_id]
          )

          // Notify member — loan fully paid
          try {
            await createNotificationForMember(
              loan.member_id,
              "Loan Fully Repaid 🎉",
              `Congratulations! Your loan ${loan.loan_number} of ${Number(loan.total_amount).toLocaleString()} RWF has been fully repaid. Your account is now clear.`,
              "loan_payment",
              payment.id,
              "success"
            )
          } catch (e) {
            console.error("[v0] Notification error:", e)
          }
        } else {
          // Partial payment confirmed
          try {
            await createNotificationForMember(
              loan.member_id,
              "Loan Payment Confirmed",
              `Your loan payment of ${Number(payment.amount).toLocaleString()} RWF for loan ${loan.loan_number} has been confirmed. Remaining balance: ${(totalRepayment - totalConfirmed).toLocaleString()} RWF.`,
              "loan_payment",
              payment.id,
              "success"
            )
          } catch (e) {
            console.error("[v0] Notification error:", e)
          }
        }
      } else if (body.status === "rejected") {
        try {
          await createNotificationForMember(
            loan.member_id,
            "Loan Payment Rejected",
            `Your loan payment of ${Number(payment.amount).toLocaleString()} RWF for loan ${loan.loan_number} has been rejected. Please contact the cooperative office for details.`,
            "loan_payment",
            payment.id,
            "warning"
          )
        } catch (e) {
          console.error("[v0] Notification error:", e)
        }
      }
    }

    return NextResponse.json({ success: true, data: payment }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error updating loan payment:", error)
    return NextResponse.json({ success: false, error: "Failed to update loan payment" }, { status: 500 })
  }
}
