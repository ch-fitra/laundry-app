import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
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

    const customer = await prisma.customer.findFirst({
      where: { id, outletId },
      include: {
        orders: {
          include: {
            items: { include: { service: true } },
            payments: true,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: customer })
  } catch (error) {
    console.error("Customer detail GET error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

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

    const customer = await prisma.customer.findFirst({
      where: { id, outletId },
    })
    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 })
    }

    const body = await request.json()
    const { name, phone, address } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (address !== undefined) updateData.address = address

    const updated = await prisma.customer.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("Customer PATCH error:", error)
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

    const customer = await prisma.customer.findFirst({
      where: { id, outletId },
    })
    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 })
    }

    await prisma.customer.delete({ where: { id } })

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error("Customer DELETE error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
