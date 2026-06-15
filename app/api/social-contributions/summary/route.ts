import { type NextRequest, NextResponse } from "next/server"
import { getSocialContributionSummary } from "@/lib/db/queries/social-contributions"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get("year")

    const summary = await getSocialContributionSummary(year ? Number.parseInt(year) : undefined)
    return NextResponse.json(summary)
  } catch (error) {
    console.error("Error fetching social contribution summary:", error)
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 })
  }
}
