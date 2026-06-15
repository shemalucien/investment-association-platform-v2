import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth/jwt"
import { getMemberByUserId } from "@/lib/db/queries/members"
import { markNotificationAsRead, markNotificationAsUnread } from "@/lib/db/queries/notifications"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const member = await getMemberByUserId(payload.userId as string)
    if (!member) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 })
    }

    const body = await request.json()
    const read = body.read !== false

    const notification = read
      ? await markNotificationAsRead(id, member.id)
      : await markNotificationAsUnread(id, member.id)

    if (!notification) {
      return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: notification })
  } catch (error) {
    console.error("[v0] Error updating notification:", error)
    return NextResponse.json({ success: false, error: "Failed to update notification" }, { status: 500 })
  }
}
