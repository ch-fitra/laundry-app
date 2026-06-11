import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createPaymentSchema = z.object({
  amount: z.number().positive("Jumlah pembayaran harus lebih dari 0"),
  method: z.enum(["CASH", "TRANSFER", "QRIS", "OTHER"]),
  referenceNo: z.string().optional().nullable(),
})

export async function POST(
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

    // Verify order belongs to this outlet
    const order = await prisma.order.findFirst({
      where: { id, outletId },
    })
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = createPaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validasi gagal", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { amount, method, referenceNo } = parsed.data

    const payment = await prisma.$transaction(async (tx) => {
      // Create payment
      const newPayment = await tx.payment.create({
        data: {
          orderId: id,
          amount,
          method: method as any,
          referenceNo: referenceNo || null,
          recordedById: session.user!.id,
        },
        include: {
          order: { include: { customer: true } },
          recordedBy: { select: { id: true, name: true } },
        },
      })

      // Calculate total paid
      const allPayments = await tx.payment.findMany({
        where: { orderId: id },
      })
      const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0)

      // Update payment status
      let paymentStatus: string
      if (totalPaid >= Number(order.totalPrice)) {
        paymentStatus = "PAID"
      } else if (totalPaid > 0) {
        paymentStatus = "PARTIAL"
      } else {
        paymentStatus = "UNPAID"
      }

      await tx.order.update({
        where: { id },
        data: { paymentStatus: paymentStatus as any },
      })

      return newPayment
    })

    return NextResponse.json({ success: true, data: payment }, { status: 201 })
  } catch (error) {
    console.error("Order payments POST error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
