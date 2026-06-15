import { type NextRequest, NextResponse } from "next/server"
import { getAllMembers, createMember, getActiveMembersForGuarantors } from "@/lib/db/queries/members"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const guarantorsOnly = searchParams.get("guarantors") === "true"

    if (guarantorsOnly) {
      // Only return active members suitable as guarantors
      const members = await getActiveMembersForGuarantors()
      return NextResponse.json({ success: true, data: members })
    }

    const members = await getAllMembers()
    return NextResponse.json({ success: true, data: members })
  } catch (error) {
    console.error("[v0] Error fetching members:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch members" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.fullName || !body.email || !body.phone || !body.nationalId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const member = await createMember({
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      nationalId: body.nationalId,
      address: body.address,
    })

    return NextResponse.json({ success: true, data: member }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating member:", error)
    return NextResponse.json({ success: false, error: "Failed to create member" }, { status: 500 })
  }
}
