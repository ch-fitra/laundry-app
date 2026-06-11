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

    const order = await prisma.order.findFirst({
      where: { id, outletId },
      include: {
        customer: true,
        items: { include: { service: true } },
        payments: true,
        statusHistory: {
          include: { changedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error("Order detail GET error:", error)
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

    const order = await prisma.order.findFirst({
      where: { id, outletId },
    })
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    const body = await request.json()
    const { status, notes, handledById, pickupDate, totalWeight, discount } = body

    const updateData: any = {}

    if (status !== undefined) {
      updateData.status = status
      if (status === "DONE") {
        updateData.doneDate = new Date()
      }
    }
    if (notes !== undefined) updateData.notes = notes
    if (handledById !== undefined) updateData.handledById = handledById
    if (pickupDate !== undefined) updateData.pickupDate = pickupDate ? new Date(pickupDate) : null
    if (totalWeight !== undefined) updateData.totalWeight = totalWeight
    if (discount !== undefined) {
      updateData.discount = discount
      updateData.totalPrice = Number(order.subtotal) - discount
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          items: { include: { service: true } },
          payments: true,
          statusHistory: {
            include: { changedBy: { select: { id: true, name: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      })

      // Create status history if status changed
      if (status && status !== order.status) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            fromStatus: order.status,
            toStatus: status,
            changedById: session.user!.id,
            note: notes || null,
          },
        })
      }

      return updated
    })

    return NextResponse.json({ success: true, data: updatedOrder })
  } catch (error) {
    console.error("Order PATCH error:", error)
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

    const order = await prisma.order.findFirst({
      where: { id, outletId },
    })
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    // Set status to CANCELLED instead of hard delete
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    })

    // Record in status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        fromStatus: order.status,
        toStatus: "CANCELLED",
        changedById: session.user!.id,
        note: "Pesanan dibatalkan",
      },
    })

    return NextResponse.json({ success: true, data: updatedOrder })
  } catch (error) {
    console.error("Order DELETE error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
