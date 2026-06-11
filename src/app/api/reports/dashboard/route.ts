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
      include: { outlet: true },
    })
    if (!user?.outlet) {
      return NextResponse.json({ success: false, error: "Outlet not found" }, { status: 404 })
    }
    const outletId = user.outlet.id

    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(todayStart.getTime() + 86400000)

    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      doneOrders,
      todayOrders,
      totalCustomers,
      totalRevenue,
      todayRevenue,
      unpaidOrders,
    ] = await Promise.all([
      prisma.order.count({ where: { outletId, status: { not: "CANCELLED" } } }),
      prisma.order.count({ where: { outletId, status: "PENDING" } }),
      prisma.order.count({ where: { outletId, status: "PROCESSING" } }),
      prisma.order.count({ where: { outletId, status: "DONE" } }),
      prisma.order.count({
        where: {
          outletId,
          createdAt: { gte: todayStart, lt: todayEnd },
        },
      }),
      prisma.customer.count({ where: { outletId } }),
      prisma.order.aggregate({
        where: { outletId, status: { not: "CANCELLED" } },
        _sum: { totalPrice: true },
      }),
      prisma.order.aggregate({
        where: {
          outletId,
          createdAt: { gte: todayStart, lt: todayEnd },
          status: { not: "CANCELLED" },
        },
        _sum: { totalPrice: true },
      }),
      prisma.order.count({
        where: {
          outletId,
          paymentStatus: "UNPAID",
          status: { not: "CANCELLED" },
        },
      }),
    ])

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      where: { outletId },
      include: {
        customer: true,
        items: { include: { service: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    // Orders by status for chart
    const ordersByStatus = {
      PENDING: pendingOrders,
      PROCESSING: processingOrders,
      DONE: doneOrders,
      NOTIFIED: await prisma.order.count({ where: { outletId, status: "NOTIFIED" } }),
      PICKED_UP: await prisma.order.count({ where: { outletId, status: "PICKED_UP" } }),
      CANCELLED: await prisma.order.count({ where: { outletId, status: "CANCELLED" } }),
    }

    // Revenue last 7 days
    const last7Days: { date: string; revenue: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date(todayStart.getTime() - i * 86400000)
      const dayEnd = new Date(day.getTime() + 86400000)
      const result = await prisma.order.aggregate({
        where: {
          outletId,
          createdAt: { gte: day, lt: dayEnd },
          status: { not: "CANCELLED" },
        },
        _sum: { totalPrice: true },
      })
      last7Days.push({
        date: day.toISOString().split("T")[0],
        revenue: Number(result._sum.totalPrice || 0),
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        processingOrders,
        doneOrders,
        todayOrders,
        totalCustomers,
        totalRevenue: Number(totalRevenue._sum.totalPrice || 0),
        todayRevenue: Number(todayRevenue._sum.totalPrice || 0),
        unpaidOrders,
        ordersByStatus,
        recentOrders,
        revenueLast7Days: last7Days,
      },
    })
  } catch (error) {
    console.error("Dashboard GET error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
