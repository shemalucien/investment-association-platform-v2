import type { User } from "./types"

// Mock users database (In production, this would be PostgreSQL)
export const MOCK_USERS: User[] = [
  {
    id: "1",
    email: "admin@abanyabuzare.rw",
    password: "admin123", // In real app: bcrypt hash
    name: "Admin User",
    role: "admin",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    email: "treasurer@abanyabuzare.rw",
    password: "treasurer123",
    name: "Jean Baptiste",
    role: "treasurer",
    memberId: "1",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "3",
    email: "member@abanyabuzare.rw",
    password: "member123",
    name: "Marie Claire",
    role: "member",
    memberId: "2",
    createdAt: new Date("2024-01-01"),
  },
]
