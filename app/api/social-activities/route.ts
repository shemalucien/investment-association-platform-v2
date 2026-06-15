import { type NextRequest, NextResponse } from "next/server"
import {
  getAllSocialActivities,
  createSocialActivity,
  getSocialFundBalance,
} from "@/lib/db/queries/social-contributions"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get("action")

    if (action === "balance") {
      const balance = await getSocialFundBalance()
      return NextResponse.json(balance)
    }

    const activities = await getAllSocialActivities()
    return NextResponse.json(activities)
  } catch (error) {
    console.error("Error fetching social activities:", error)
    return NextResponse.json({ error: "Failed to fetch social activities" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const activity = await createSocialActivity(body)
    return NextResponse.json(activity, { status: 201 })
  } catch (error: any) {
    console.error("Error creating social activity:", error)
    return NextResponse.json({ error: error.message || "Failed to create social activity" }, { status: 500 })
  }
}
