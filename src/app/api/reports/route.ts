import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    const period = searchParams.get("period") || "daily" // daily, weekly, monthly
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    // Default: last 30 days
    const endDate = dateTo ? new Date(dateTo + "T23:59:59.999Z") : new Date()
    const startDate = dateFrom
      ? new Date(dateFrom)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Revenue data
    const orders = await prisma.order.findMany({
      where: {
        outletId,
        createdAt: { gte: startDate, lte: endDate },
        status: { not: "CANCELLED" },
      },
      include: {
        payments: true,
        items: { include: { service: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    // Expenses data
    const expenses = await prisma.expense.findMany({
      where: {
        outletId,
        expenseDate: { gte: startDate, lte: endDate },
      },
    })

    // Calculate totals
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalPrice), 0)
    const totalOrders = orders.length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const netProfit = totalRevenue - totalExpenses

    // Revenue per day / week / month
    const revenuePerDay = groupByPeriod(orders, period, startDate, endDate)

    // Service breakdown
    const serviceBreakdown: Record<string, { name: string; total: number; count: number }> = {}
    for (const order of orders) {
      for (const item of order.items) {
        const key = item.service.name
        if (!serviceBreakdown[key]) {
          serviceBreakdown[key] = { name: key, total: 0, count: 0 }
        }
        serviceBreakdown[key].total += Number(item.subtotal)
        serviceBreakdown[key].count += Number(item.quantity)
      }
    }

    // Payment method breakdown
    const paymentMethodBreakdown: Record<string, number> = {}
    for (const order of orders) {
      for (const payment of order.payments) {
        const key = payment.method
        if (!paymentMethodBreakdown[key]) paymentMethodBreakdown[key] = 0
        paymentMethodBreakdown[key] += Number(payment.amount)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        revenuePerDay,
        serviceBreakdown: Object.values(serviceBreakdown).sort((a, b) => b.total - a.total),
        paymentMethodBreakdown: Object.entries(paymentMethodBreakdown).map(([method, total]) => ({
          method,
          total,
        })),
        totalExpenses,
        netProfit,
        period,
        dateFrom: startDate.toISOString(),
        dateTo: endDate.toISOString(),
      },
    })
  } catch (error) {
    console.error("Reports GET error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

function groupByPeriod(
  orders: any[],
  period: string,
  startDate: Date,
  endDate: Date
): { date: string; revenue: number; orders: number }[] {
  const groups: Record<string, { revenue: number; count: number }> = {}

  // Initialize all periods
  const cursor = new Date(startDate)
  while (cursor <= endDate) {
    let key: string
    if (period === "daily") {
      key = cursor.toISOString().split("T")[0]
      cursor.setDate(cursor.getDate() + 1)
    } else if (period === "weekly") {
      const weekStart = new Date(cursor)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      key = weekStart.toISOString().split("T")[0]
      cursor.setDate(cursor.getDate() + 7)
    } else {
      key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`
      cursor.setMonth(cursor.getMonth() + 1)
    }
    if (!groups[key]) groups[key] = { revenue: 0, count: 0 }
  }

  for (const order of orders) {
    let key: string
    const d = new Date(order.createdAt)
    if (period === "daily") {
      key = d.toISOString().split("T")[0]
    } else if (period === "weekly") {
      const weekStart = new Date(d)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      key = weekStart.toISOString().split("T")[0]
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    }
    if (groups[key]) {
      groups[key].revenue += Number(order.totalPrice)
      groups[key].count++
    }
  }

  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.count,
    }))
}
