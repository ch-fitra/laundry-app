"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

interface RevenueChartDataItem {
  date: string
  revenue: number
  orders?: number
}

interface RevenueChartProps {
  data: RevenueChartDataItem[]
}

type ViewMode = "daily" | "weekly"

export function RevenueChart({ data }: RevenueChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("daily")

  const processedData =
    viewMode === "weekly"
      ? aggregateWeekly(data)
      : data

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Grafik Pendapatan</CardTitle>
        <div className="flex gap-1">
          <Button
            variant={viewMode === "daily" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("daily")}
          >
            Harian
          </Button>
          <Button
            variant={viewMode === "weekly" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("weekly")}
          >
            Mingguan
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={processedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `Rp${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: any) => [formatCurrency(value ?? 0), "Pendapatan"]}
                labelFormatter={(label) => `Tanggal: ${label}`}
              />
              <Bar
                dataKey="revenue"
                fill="var(--chart-1)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function aggregateWeekly(data: RevenueChartDataItem[]): RevenueChartDataItem[] {
  if (data.length === 0) return []

  const weeks: { label: string; revenue: number; orders: number; count: number }[] = []
  let currentWeek: { label: string; revenue: number; orders: number; count: number } | null = null

  for (const item of data) {
    const date = new Date(item.date)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`

    if (currentWeek && currentWeek.label === label) {
      currentWeek.revenue += item.revenue
      currentWeek.orders += item.orders || 0
      currentWeek.count++
    } else {
      if (currentWeek) {
        weeks.push({ ...currentWeek })
      }
      currentWeek = { label, revenue: item.revenue, orders: item.orders || 0, count: 1 }
    }
  }

  if (currentWeek) {
    weeks.push({ ...currentWeek })
  }

  return weeks.map((w) => ({
    date: `Minggu ${w.label}`,
    revenue: Math.round(w.revenue / w.count),
    orders: Math.round(w.orders / w.count),
  }))
}
