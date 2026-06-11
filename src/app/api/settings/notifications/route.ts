import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { fonnteToken, enabled } = body

    // In production, save to env or database
    // For now, just acknowledge
    return NextResponse.json({
      success: true,
      data: { fonnteToken: fonnteToken ? "***" : null, enabled },
    })
  } catch (error) {
    console.error("Notifications settings error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
