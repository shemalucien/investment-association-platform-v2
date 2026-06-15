import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser, getPermissionsForRole } from "@/lib/db/queries/auth"
import { signToken } from "@/lib/auth/jwt"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    // Authenticate user
    const user = await authenticateUser(email, password)

    console.log("user",user);

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
    }

    // Generate JWT token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Get permissions
    const permissions = getPermissionsForRole(user.role)

    // Create response with cookie
    const response = NextResponse.json({
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

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 })
  }
}
