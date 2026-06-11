"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Phone, MapPin, StickyNote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import type { Customer, Order } from "@/types"

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/customers/${id}`)
        if (!res.ok) throw new Error("Not found")
        const json = await res.json()
        const data = json.data || json
        setCustomer(data)
        setOrders(data.orders || data.orderHistory || [])
      } catch {
        toast.error("Pelanggan tidak ditemukan")
        router.push("/customers")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!customer) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon">
          <Link href="/customers">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">
            Pelanggan sejak {formatDate(customer.createdAt, "dd MMMM yyyy")}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Pelanggan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{customer.phone}</p>
                <p className="text-xs text-muted-foreground">No. HP</p>
              </div>
            </div>
            {customer.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm">{customer.address}</p>
                  <p className="text-xs text-muted-foreground">Alamat</p>
                </div>
              </div>
            )}
            {customer.notes && (
              <div className="flex items-start gap-3">
                <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm">{customer.notes}</p>
                  <p className="text-xs text-muted-foreground">Catatan</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Statistik</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Pesanan</span>
              <span className="font-medium">{orders.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Belanja</span>
              <span className="font-medium">
                {formatCurrency(orders.reduce((sum, o) => sum + o.totalPrice, 0))}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pesanan Aktif</span>
              <span className="font-medium">
                {orders.filter((o) => o.status !== "PICKED_UP" && o.status !== "CANCELLED").length}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Quick action */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full">
              <Link href={`/orders/new?customerId=${customer.id}`}>
                Buat Pesanan Baru
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Riwayat Pesanan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Kode</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Pembayaran</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Belum ada riwayat pesanan
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {order.orderCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{formatCurrency(order.totalPrice)}</td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          order.paymentStatus === "PAID"
                            ? "outline"
                            : order.paymentStatus === "PARTIAL"
                              ? "secondary"
                              : "destructive"
                        }
                        className="text-xs"
                      >
                        {order.paymentStatus === "PAID"
                          ? "Lunas"
                          : order.paymentStatus === "PARTIAL"
                            ? "Sebagian"
                            : "Belum Bayar"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(order.createdAt, "dd MMM yyyy")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
