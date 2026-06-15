import { type NextRequest, NextResponse } from "next/server"
import { getMemberById, updateMember, deleteMember } from "@/lib/db/queries/members"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const member = await getMemberById(id)

    if (!member) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: member })
  } catch (error) {
    console.error("[v0] Error fetching member:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch member" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const member = await updateMember(id, body)

    if (!member) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: member })
  } catch (error) {
    console.error("[v0] Error updating member:", error)
    return NextResponse.json({ success: false, error: "Failed to update member" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const success = await deleteMember(id)

    if (!success) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error("[v0] Error deleting member:", error)
    return NextResponse.json({ success: false, error: "Failed to delete member" }, { status: 500 })
  }
}
