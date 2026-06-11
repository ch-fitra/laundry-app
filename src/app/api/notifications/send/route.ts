import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const sendNotificationSchema = z.object({
  orderId: z.string().min(1, "Order harus dipilih"),
  message: z.string().min(1, "Pesan harus diisi"),
  channel: z.string().default("whatsapp"),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user!.id },
      include: { outlet: true },
    })
    if (!user?.outlet) {
      return NextResponse.json({ success: false, error: "Outlet not found" }, { status: 404 })
    }
    const outletId = user.outlet.id

    const body = await request.json()
    const parsed = sendNotificationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validasi gagal", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { orderId, message, channel } = parsed.data

    // Verify order belongs to this outlet
    const order = await prisma.order.findFirst({
      where: { id: orderId, outletId },
      include: { customer: true },
    })
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    if (!order.customer.phone) {
      return NextResponse.json(
        { success: false, error: "Customer has no phone number" },
        { status: 400 }
      )
    }

    // Send via Fonnte
    let fonnteResponse: any = { status: false, message: "Fonnte not configured" }

    try {
      const { sendCustomMessage } = await import("@/lib/whatsapp")
      fonnteResponse = await sendCustomMessage(order.customer.phone, message)
    } catch (err) {
      console.error("Fonnte send error:", err)
      fonnteResponse = { status: false, message: "Failed to send WhatsApp message" }
    }

    // Record notification
    const notification = await prisma.notification.create({
      data: {
        orderId,
        customerId: order.customerId,
        channel,
        message,
        status: fonnteResponse.status ? "sent" : "failed",
        sentAt: fonnteResponse.status ? new Date() : null,
      },
    })

    // Update order status to NOTIFIED if sent successfully
    if (fonnteResponse.status && order.status === "DONE") {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "NOTIFIED" },
      })

      await prisma.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: "DONE",
          toStatus: "NOTIFIED",
          changedById: session.user!.id,
          note: "Notifikasi WhatsApp terkirim",
        },
      })
    }

    return NextResponse.json({
      success: fonnteResponse.status,
      data: {
        notification,
        fonnteResponse,
      },
    })
  } catch (error) {
    console.error("Notifications send error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
