import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createOrderSchema = z.object({
  customerId: z.string().min(1, "Customer harus dipilih"),
  handledById: z.string().optional().nullable(),
  pickupDate: z.string().optional().nullable(),
  totalWeight: z.number().positive().optional().nullable(),
  discount: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        serviceId: z.string().min(1, "Layanan harus dipilih"),
        quantity: z.number().positive("Jumlah harus lebih dari 0"),
        unitPrice: z.number().positive("Harga satuan harus diisi"),
      })
    )
    .min(1, "Minimal 1 item layanan"),
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
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const paymentStatus = searchParams.get("paymentStatus")

    const where: any = { outletId }

    if (status) {
      where.status = status
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus
    }

    if (search) {
      where.OR = [
        { orderCode: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { phone: { contains: search, mode: "insensitive" } } },
      ]
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo + "T23:59:59.999Z")
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: true,
          items: { include: { service: true } },
          payments: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Orders GET error:", error)
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
    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validasi gagal", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { customerId, handledById, pickupDate, totalWeight, discount = 0, notes, items } = parsed.data

    // Verify customer belongs to this outlet
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, outletId },
    })
    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 })
    }

    // Verify all services belong to this outlet
    const serviceIds = items.map((i) => i.serviceId)
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, outletId },
    })
    if (services.length !== serviceIds.length) {
      return NextResponse.json({ success: false, error: "One or more services not found" }, { status: 404 })
    }

    // Generate order code
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(todayStart.getTime() + 86400000)
    const ordersToday = await prisma.order.count({
      where: { outletId, createdAt: { gte: todayStart, lt: todayEnd } },
    })

    const datePart = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`
    const seqPart = String(ordersToday + 1).padStart(4, "0")
    const orderCode = `LDR-${datePart}-${seqPart}`

    // Calculate subtotal and total
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const totalPrice = subtotal - discount

    // Calculate estDoneDate from max service duration
    const serviceDurationMap = new Map(services.map((s) => [s.id, s.estDurationHours]))
    let maxDuration = 0
    for (const item of items) {
      const duration = serviceDurationMap.get(item.serviceId) || 0
      if (duration > maxDuration) maxDuration = duration
    }
    const estDoneDate = maxDuration > 0 ? new Date(today.getTime() + maxDuration * 3600000) : null

    // Create order with items
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderCode,
          outletId,
          customerId,
          handledById: handledById || null,
          pickupDate: pickupDate ? new Date(pickupDate) : null,
          estDoneDate,
          totalWeight: totalWeight || null,
          subtotal,
          discount,
          totalPrice,
          notes: notes || null,
          items: {
            create: items.map((item) => ({
              serviceId: item.serviceId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.quantity * item.unitPrice,
            })),
          },
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: "PENDING",
              changedById: session.user!.id,
              note: "Pesanan dibuat",
            },
          },
        },
        include: {
          customer: true,
          items: { include: { service: true } },
          payments: true,
          statusHistory: true,
        },
      })

      // Increment customer total orders
      await tx.customer.update({
        where: { id: customerId },
        data: { totalOrders: { increment: 1 } },
      })

      return newOrder
    })

    return NextResponse.json({ success: true, data: order }, { status: 201 })
  } catch (error) {
    console.error("Orders POST error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
