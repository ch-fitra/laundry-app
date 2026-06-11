"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { formatCurrency } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

interface ReportData {
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  revenuePerDay: { date: string; revenue: number; orders: number }[]
  serviceBreakdown: { name: string; total: number; count: number }[]
  paymentMethodBreakdown: { method: string; total: number }[]
  totalExpenses: number
  netProfit: number
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Tunai",
  TRANSFER: "Transfer",
  QRIS: "QRIS",
  OTHER: "Lainnya",
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("daily")
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(() => {
    const to = new Date()
    const from = new Date(to.getTime() - 30 * 86400000)
    return {
      dateFrom: from.toISOString().split("T")[0],
      dateTo: to.toISOString().split("T")[0],
    }
  })

  useEffect(() => {
    fetchReport()
  }, [period, dateRange])

  async function fetchReport() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        period,
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
      })
      const res = await fetch(`/api/reports?${params}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function setQuickRange(days: number) {
    const to = new Date()
    const from = new Date(to.getTime() - days * 86400000)
    setDateRange({
      dateFrom: from.toISOString().split("T")[0],
      dateTo: to.toISOString().split("T")[0],
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <PageHeader title="Laporan" description="Analisis bisnis laundry" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const servicePieData = (data?.serviceBreakdown || []).slice(0, 6).map((s) => ({
    name: s.name,
    value: s.total,
  }))

  const paymentPieData = (data?.paymentMethodBreakdown || []).map((p) => ({
    name: PAYMENT_METHOD_LABELS[p.method] || p.method,
    value: p.total,
  }))

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <PageHeader title="Laporan" description="Analisis bisnis laundry" />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Pendapatan</p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              {formatCurrency(data?.totalRevenue || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Pesanan</p>
            <p className="mt-1 text-2xl font-bold">{data?.totalOrders || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Rata-rata Pesanan</p>
            <p className="mt-1 text-2xl font-bold">
              {formatCurrency(data?.avgOrderValue || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Laba Bersih</p>
            <p
              className={`mt-1 text-2xl font-bold ${
                (data?.netProfit || 0) >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(data?.netProfit || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Period & Date Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={period} onValueChange={(v) => v && setPeriod(v)}>
              <TabsList>
                <TabsTrigger value="daily">Harian</TabsTrigger>
                <TabsTrigger value="weekly">Mingguan</TabsTrigger>
                <TabsTrigger value="monthly">Bulanan</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Cepat:</span>
              <Button variant="outline" size="xs" onClick={() => setQuickRange(7)}>
                7 hari
              </Button>
              <Button variant="outline" size="xs" onClick={() => setQuickRange(30)}>
                30 hari
              </Button>
              <Button variant="outline" size="xs" onClick={() => setQuickRange(90)}>
                90 hari
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Grafik Pendapatan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.revenuePerDay || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => {
                    if (period === "monthly") return v.slice(5)
                    return v.slice(5)
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value) || 0), "Pendapatan"]}
                  labelFormatter={(label) => `Tanggal: ${label}`}
                />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Service Breakdown & Payment Method */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Berdasarkan Layanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={servicePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                    }
                  >
                    {servicePieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value) || 0)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Berdasarkan Metode Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                    }
                  >
                    {paymentPieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value) || 0)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Biaya</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(data?.totalExpenses || 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Laba Bersih</p>
              <p
                className={`text-xl font-bold ${
                  (data?.netProfit || 0) >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(data?.netProfit || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
