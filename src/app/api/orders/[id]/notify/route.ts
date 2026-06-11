import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
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
      include: { customer: true },
    })
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        orderId: id,
        customerId: order.customerId,
        channel: "whatsapp",
        message: `Halo ${order.customer.name}, pesanan Anda (${order.orderCode}) sudah siap. Silakan ambil di ${user.outlet.name}.`,
        status: "pending",
      },
    })

    // Update order status to NOTIFIED
    await prisma.order.update({
      where: { id },
      data: { status: "NOTIFIED" },
    })

    // Record in status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        fromStatus: order.status,
        toStatus: "NOTIFIED",
        changedById: session.user!.id,
        note: "Notifikasi dikirim",
      },
    })

    return NextResponse.json({ success: true, data: notification })
  } catch (error) {
    console.error("Order notify POST error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
