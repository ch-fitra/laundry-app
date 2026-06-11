import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createPaymentSchema = z.object({
  orderId: z.string().min(1, "Order harus dipilih"),
  amount: z.number().positive("Jumlah pembayaran harus lebih dari 0"),
  method: z.enum(["CASH", "TRANSFER", "QRIS", "OTHER"]),
  referenceNo: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const method = searchParams.get("method")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const search = searchParams.get("search")

    const where: any = {
      order: { outletId },
    }

    if (method) where.method = method
    if (dateFrom || dateTo) {
      where.paidAt = {}
      if (dateFrom) where.paidAt.gte = new Date(dateFrom)
      if (dateTo) where.paidAt.lte = new Date(dateTo + "T23:59:59.999Z")
    }
    if (search) {
      where.order = {
        ...where.order,
        OR: [
          { orderCode: { contains: search, mode: "insensitive" } },
          { customer: { name: { contains: search, mode: "insensitive" } } },
        ],
      }
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          order: {
            include: { customer: true },
          },
          recordedBy: { select: { id: true, name: true } },
        },
        orderBy: { paidAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: payments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Payments GET error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

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
    const parsed = createPaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validasi gagal", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { orderId, amount, method, referenceNo } = parsed.data

    // Verify order belongs to this outlet
    const order = await prisma.order.findFirst({
      where: { id: orderId, outletId },
      include: { payments: true },
    })
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    const payment = await prisma.$transaction(async (tx) => {
      // Create payment
      const newPayment = await tx.payment.create({
        data: {
          orderId,
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
        where: { orderId },
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
        where: { id: orderId },
        data: { paymentStatus: paymentStatus as any },
      })

      return newPayment
    })

    return NextResponse.json({ success: true, data: payment }, { status: 201 })
  } catch (error) {
    console.error("Payments POST error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
