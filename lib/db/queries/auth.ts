import { query } from "../connection"
import * as bcrypt from "bcryptjs"

export interface User {
  id: string
  email: string
  fullName: string
  role: string
  isActive: boolean
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const result = await query<any>(
      `
      SELECT id, email, password_hash, full_name, role, is_active
      FROM users
      WHERE email = $1 AND is_active = true
    `,
      [email],
    )
    console.log(result);

    if (result.rows.length === 0) {
      return null
    }

    const user = result.rows[0]

    // Compare password with hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      isActive: user.is_active,
    }
  } catch (error) {
    console.error("[v0] Authentication error:", error)
    return null
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const result = await query<any>(
      `
      SELECT id, email, full_name, role, is_active
      FROM users
      WHERE id = $1 AND is_active = true
    `,
      [id],
    )

    if (result.rows.length === 0) {
      return null
    }

    const user = result.rows[0]
    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      isActive: user.is_active,
    }
  } catch (error) {
    console.error("[v0] Error fetching user:", error)
    return null
  }
}

export async function createUser(data: {
  email: string
  password: string
  fullName: string
  role: string
}): Promise<User> {
  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10)

  const result = await query<any>(
    `
    INSERT INTO users (email, password_hash, full_name, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, full_name, role, is_active
  `,
    [data.email, passwordHash, data.fullName, data.role],
  )

  const user = result.rows[0]
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    isActive: user.is_active,
  }
}

export interface Permission {
  canAddMembers: boolean
  canEditMembers: boolean
  canDeleteMembers: boolean
  canManageShares: boolean
  canApproveLoan: boolean
  canManageDeposits: boolean
  canViewReports: boolean
}

export function getPermissionsForRole(role: string): Permission {
  switch (role) {
    case "admin":
      return {
        canAddMembers: true,
        canEditMembers: true,
        canDeleteMembers: true,
        canManageShares: true,
        canApproveLoan: true,
        canManageDeposits: true,
        canViewReports: true,
      }
    case "treasurer":
      return {
        canAddMembers: false,
        canEditMembers: false,
        canDeleteMembers: false,
        canManageShares: true,
        canApproveLoan: true,
        canManageDeposits: true,
        canViewReports: true,
      }
    case "member":
      return {
        canAddMembers: false,
        canEditMembers: false,
        canDeleteMembers: false,
        canManageShares: false,
        canApproveLoan: false,
        canManageDeposits: false,
        canViewReports: false,
      }
    default:
      return {
        canAddMembers: false,
        canEditMembers: false,
        canDeleteMembers: false,
        canManageShares: false,
        canApproveLoan: false,
        canManageDeposits: false,
        canViewReports: false,
      }
  }
}
