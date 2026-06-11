import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id: session.user!.id },
      include: { outlet: true },
    })
    if (!user?.outlet) {
      return NextResponse.json({ success: false, error: "Outlet not found" }, { status: 404 })
    }
    const outletId = user.outlet.id

    const service = await prisma.service.findFirst({
      where: { id, outletId },
    })
    if (!service) {
      return NextResponse.json({ success: false, error: "Service not found" }, { status: 404 })
    }

    const body = await request.json()
    const { name, unit, pricePerUnit, estDurationHours, isActive } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (unit !== undefined) updateData.unit = unit
    if (pricePerUnit !== undefined) updateData.pricePerUnit = pricePerUnit
    if (estDurationHours !== undefined) updateData.estDurationHours = estDurationHours
    if (isActive !== undefined) updateData.isActive = isActive

    const updated = await prisma.service.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("Service PATCH error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id: session.user!.id },
      include: { outlet: true },
    })
    if (!user?.outlet) {
      return NextResponse.json({ success: false, error: "Outlet not found" }, { status: 404 })
    }
    const outletId = user.outlet.id

    const service = await prisma.service.findFirst({
      where: { id, outletId },
    })
    if (!service) {
      return NextResponse.json({ success: false, error: "Service not found" }, { status: 404 })
    }

    // Soft delete — set inactive
    await prisma.service.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error("Service DELETE error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
