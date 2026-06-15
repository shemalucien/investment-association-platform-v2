import { SignJWT, jwtVerify } from "jose"
import { hash } from "bcryptjs"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-this")

export async function signToken(payload: any): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch (error) {
    console.error("[v0] Token verification failed:", error)
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 10)
}
