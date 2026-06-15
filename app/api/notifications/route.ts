import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth/jwt"
import { getMemberByUserId } from "@/lib/db/queries/members"
import { getNotificationsForMember, createNotificationForMember } from "@/lib/db/queries/notifications"

export async function GET(request: NextRequest) {
  try {
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
      return NextResponse.json({ success: true, data: [] })
    }

    const notifications = await getNotificationsForMember(member.id)
    return NextResponse.json({ success: true, data: notifications })
  } catch (error) {
    console.error("[v0] Error fetching notifications:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""

    let memberId: string | undefined
    let title: string | undefined
    let message: string | undefined
    let relatedEntityType: string | undefined
    let relatedEntityId: string | undefined
    let notificationType = "info"
    let attachmentName: string | undefined
    let attachmentType: string | undefined
    let attachmentData: string | undefined

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      memberId = String(formData.get("memberId") || "") || undefined
      title = String(formData.get("title") || "") || undefined
      message = String(formData.get("message") || "") || undefined
      relatedEntityType = String(formData.get("relatedEntityType") || "") || undefined
      relatedEntityId = String(formData.get("relatedEntityId") || "") || undefined
      notificationType = String(formData.get("notificationType") || "info")

      const file = formData.get("attachment") as File | null
      if (file && file.size > 0) {
        const bytes = new Uint8Array(await file.arrayBuffer())
        let binary = ""
        bytes.forEach((b) => (binary += String.fromCharCode(b)))
        attachmentName = file.name
        attachmentType = file.type || "application/octet-stream"
        attachmentData = `data:${attachmentType};base64,${Buffer.from(binary, "binary").toString("base64")}`
      }
    } else {
      const body = await request.json()
      memberId = body.memberId
      title = body.title
      message = body.message
      relatedEntityType = body.relatedEntityType
      relatedEntityId = body.relatedEntityId
      notificationType = body.notificationType || "info"
      attachmentName = body.attachmentName
      attachmentType = body.attachmentType
      attachmentData = body.attachmentData
    }

    if (!memberId || !title || !message) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const notification = await createNotificationForMember(
      memberId,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
      notificationType,
      attachmentName,
      attachmentType,
      attachmentData,
    )

    return NextResponse.json({ success: true, data: notification }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating notification:", error)
    return NextResponse.json({ success: false, error: "Failed to create notification" }, { status: 500 })
  }
}
