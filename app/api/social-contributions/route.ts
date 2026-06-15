import { type NextRequest, NextResponse } from "next/server"
import { getAllSocialContributions, createSocialContribution } from "@/lib/db/queries/social-contributions"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get("year")

    const contributions = await getAllSocialContributions(year ? Number.parseInt(year) : undefined)
    return NextResponse.json(contributions)
  } catch (error) {
    console.error("Error fetching social contributions:", error)
    return NextResponse.json({ error: "Failed to fetch social contributions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const contribution = await createSocialContribution(body)
    return NextResponse.json(contribution, { status: 201 })
  } catch (error: any) {
    console.error("Error creating social contribution:", error)
    return NextResponse.json({ error: error.message || "Failed to create social contribution" }, { status: 500 })
  }
}
