export type UserRole = "admin" | "treasurer" | "member"

export interface User {
  id: string
  email: string
  password: string // In real app, this would be hashed
  name: string
  role: UserRole
  memberId?: string // Links to association member
  createdAt: Date
  lastLogin?: Date
}

export interface Session {
  userId: string
  user: User
  expiresAt: Date
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
}

// Role permissions
export const ROLE_PERMISSIONS = {
  admin: {
    canManageMembers: true,
    canManageShares: true,
    canApproveLoan: true,
    canManageDeposits: true,
    canViewReports: true,
    canManageUsers: true,
  },
  treasurer: {
    canManageMembers: true,
    canManageShares: true,
    canApproveLoan: true,
    canManageDeposits: true,
    canViewReports: true,
    canManageUsers: false,
  },
  member: {
    canManageMembers: false,
    canManageShares: false,
    canApproveLoan: false,
    canManageDeposits: false,
    canViewReports: true,
    canManageUsers: false,
  },
} as const
