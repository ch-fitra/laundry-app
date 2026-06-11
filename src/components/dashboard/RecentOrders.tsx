"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { OrderStatus } from "@/types"

interface RecentOrderItem {
  id: string
  orderCode: string
  customer: { name: string }
  totalPrice: number
  status: OrderStatus
  createdAt: Date | string
}

interface RecentOrdersProps {
  orders: RecentOrderItem[]
}

const statusLabel: Record<OrderStatus, string> = {
  PENDING: "Menunggu",
  PROCESSING: "Diproses",
  DONE: "Selesai",
  NOTIFIED: "Dinotifikasi",
  PICKED_UP: "Diambil",
  CANCELLED: "Dibatalkan",
}

const statusVariant: Record<OrderStatus, "secondary" | "default" | "outline" | "destructive"> = {
  PENDING: "secondary",
  PROCESSING: "default",
  DONE: "outline",
  NOTIFIED: "outline",
  PICKED_UP: "outline",
  CANCELLED: "destructive",
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Pesanan Terbaru</CardTitle>
        <Link
          href="/orders"
          className="text-sm text-primary hover:underline"
        >
          Lihat Semua
        </Link>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-muted-foreground">Kode</th>
                <th className="pb-3 font-medium text-muted-foreground">Pelanggan</th>
                <th className="pb-3 font-medium text-muted-foreground">Total</th>
                <th className="pb-3 font-medium text-muted-foreground">Status</th>
                <th className="pb-3 font-medium text-muted-foreground">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    Belum ada pesanan
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="py-3">
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {order.orderCode}
                      </Link>
                    </td>
                    <td className="py-3">{order.customer.name}</td>
                    <td className="py-3">{formatCurrency(order.totalPrice)}</td>
                    <td className="py-3">
                      <Badge variant={statusVariant[order.status]}>
                        {statusLabel[order.status]}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {formatDate(order.createdAt, "dd MMM HH:mm")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
