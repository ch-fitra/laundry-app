"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { StatCard } from "@/components/dashboard/StatCard"
import { RevenueChart } from "@/components/dashboard/RevenueChart"
import { RecentOrders } from "@/components/dashboard/RecentOrders"
import * as Icons from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { DashboardStats, RevenueChartData, Order } from "@/types"

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    activeCustomers: 0,
  })
  const [revenueData, setRevenueData] = useState<RevenueChartData[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])

  useEffect(() => {
    fetch("/api/reports/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (data?.stats) setStats(data.stats)
        if (data?.revenue) setRevenueData(data.revenue)
        if (data?.recentOrders) setRecentOrders(data.recentOrders)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Memuat data...</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Ringkasan bisnis laundry Anda</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Pesanan"
          value={stats.totalOrders.toString()}
          subtitle="Semua status"
          icon={Icons.ShoppingBag}
        />
        <StatCard
          title="Pendapatan Hari Ini"
          value={formatCurrency(stats.todayRevenue)}
          subtitle="Pendapatan hari ini"
          icon={Icons.DollarSign}
        />
        <StatCard
          title="Sedang Diproses"
          value={stats.processingOrders.toString()}
          subtitle="Pesanan dalam proses"
          icon={Icons.Clock}
        />
        <StatCard
          title="Pelanggan Aktif"
          value={stats.activeCustomers.toString()}
          subtitle="Pelanggan terdaftar"
          icon={Icons.Users}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueData} />
        </div>
        <div className="lg:col-span-1">
          <RecentOrders orders={recentOrders} />
        </div>
      </div>
    </div>
  )
}
