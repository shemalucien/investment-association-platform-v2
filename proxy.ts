import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth/jwt"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to the public homepage, login page, member registration API, and login API route
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/api/members/register" ||
    pathname.startsWith("/api/auth/login")
  ) {
    return NextResponse.next()
  }

  // Check if user is authenticated
  const token = request.cookies.get("auth-token")?.value

  if (!token) {
    // Redirect to login if not authenticated
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Verify token
  const payload = await verifyToken(token)

  if (!payload) {
    // Invalid token - redirect to login
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Add user info to headers for API routes
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-user-id", payload.userId as string)
  requestHeaders.set("x-user-role", payload.role as string)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
}
