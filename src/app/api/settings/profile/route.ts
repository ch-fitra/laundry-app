import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user!.id },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
        phone: user?.phone,
      },
    })
  } catch (error) {
    console.error("Settings profile GET error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    const updated = await prisma.user.update({
      where: { id: session.user!.id },
      data: { ...(name !== undefined && { name }) },
    })

    return NextResponse.json({
      success: true,
      data: { id: updated.id, name: updated.name, email: updated.email },
    })
  } catch (error) {
    console.error("Settings profile PATCH error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
