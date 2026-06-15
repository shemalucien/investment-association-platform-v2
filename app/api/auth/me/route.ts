import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth/jwt"
import { getUserById, getPermissionsForRole } from "@/lib/db/queries/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Verify token
    const payload = await verifyToken(token)

    if (!payload || !payload.userId) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Get user from database
    const user = await getUserById(payload.userId as string)

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Get permissions
    const permissions = getPermissionsForRole(user.role)

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
        },
        permissions,
      },
    })
  } catch (error) {
    console.error("[v0] Auth verification error:", error)
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 500 })
  }
}
