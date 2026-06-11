"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Send, Wallet, Printer, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge"
import { PrintReceipt } from "@/components/orders/PrintReceipt"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import { toast } from "sonner"
import type { Order, OrderStatus, Payment } from "@/types"

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<OrderStatus>("pending")
  const [changingStatus, setChangingStatus] = useState(false)

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [paymentRef, setPaymentRef] = useState("")
  const [submittingPayment, setSubmittingPayment] = useState(false)

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${id}`)
        if (!res.ok) throw new Error("Order not found")
        const json = await res.json()
        setOrder(json.data || json)
      } catch {
        toast.error("Pesanan tidak ditemukan")
        router.push("/orders")
      } finally {
        setLoading(false)
      }
    }
    loadOrder()
  }, [id, router])

  const handleStatusChange = async () => {
    if (!order) return
    setChangingStatus(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Gagal mengubah status")
      toast.success("Status berhasil diubah")
      setStatusDialogOpen(false)
      // Reload
      const json = await res.json()
      setOrder(json.data || json)
    } catch {
      toast.error("Gagal mengubah status")
    } finally {
      setChangingStatus(false)
    }
  }

  const handlePayment = async () => {
    if (!order || !paymentAmount) return
    setSubmittingPayment(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(paymentAmount),
          method: paymentMethod,
          reference: paymentRef || "",
        }),
      })
      if (!res.ok) throw new Error("Gagal mencatat pembayaran")
      toast.success("Pembayaran berhasil dicatat")
      setPaymentDialogOpen(false)
      setPaymentAmount("")
      setPaymentRef("")
      // Reload
      const reloadRes = await fetch(`/api/orders/${id}`)
      const json = await reloadRes.json()
      setOrder(json.data || json)
    } catch (err: any) {
      toast.error(err.message || "Gagal mencatat pembayaran")
    } finally {
      setSubmittingPayment(false)
    }
  }

  const handleSendWA = async () => {
    if (!order) return
    try {
      const res = await fetch(`/api/orders/${order.id}/notify`, { method: "POST" })
      if (!res.ok) throw new Error("Gagal mengirim notifikasi")
      toast.success("Notifikasi WhatsApp berhasil dikirim")
    } catch {
      toast.error("Gagal mengirim notifikasi")
    }
  }

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!order) return null

  const totalPaid =
    order.payments?.reduce((sum, p) => sum + p.amount, 0) || 0
  const remaining = order.totalPrice - totalPaid
  const isOverpaid = remaining < 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon">
            <Link href="/orders">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{order.orderCode}</h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Dibuat {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <PrintReceipt order={order} />
          <Button variant="outline" onClick={handleSendWA}>
            <Send className="mr-2 h-4 w-4" />
            Kirim WA
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setNewStatus(order.status)
              setStatusDialogOpen(true)
            }}
          >
            Ubah Status
          </Button>
          <Button onClick={() => setPaymentDialogOpen(true)}>
            <Wallet className="mr-2 h-4 w-4" />
            Catat Pembayaran
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Pelanggan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Nama</p>
              <p className="font-medium">{order.customer?.name || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">No. HP</p>
              <p className="font-medium">{order.customer?.phone || "-"}</p>
            </div>
            {order.customer?.address && (
              <div>
                <p className="text-sm text-muted-foreground">Alamat</p>
                <p className="text-sm">{order.customer.address}</p>
              </div>
            )}
            {order.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Catatan</p>
                <p className="text-sm">{order.notes}</p>
              </div>
            )}
            {order.pickupDate && (
              <div>
                <p className="text-sm text-muted-foreground">Estimasi Selesai</p>
                <p className="font-medium">{formatDate(order.pickupDate, "dd MMM yyyy")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Item Pesanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(order.items || []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">{item.service?.name || "Layanan"}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
              <div className="flex justify-between pt-2 text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(order.totalPrice)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Total</span>
              <span className="font-medium">{formatCurrency(order.totalPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Dibayar</span>
              <span className="font-medium text-green-600">
                {formatCurrency(totalPaid)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span>Sisa</span>
              <span className={isOverpaid ? "text-green-600" : remaining > 0 ? "text-red-600" : ""}>
                {isOverpaid
                  ? `Lebih ${formatCurrency(Math.abs(remaining))}`
                  : remaining === 0
                    ? "Lunas"
                    : formatCurrency(remaining)}
              </span>
            </div>

            {(order.payments || []).length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Riwayat Pembayaran</p>
                {(order.payments || []).map((payment: Payment) => (
                  <div
                    key={payment.id}
                    className="rounded-lg border p-2 text-sm"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{formatCurrency(payment.amount)}</span>
                      <Badge variant="outline" className="text-xs">
                        {payment.method}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(payment.createdAt)}
                    </p>
                    {payment.reference && (
                      <p className="text-xs text-muted-foreground">Ref: {payment.reference}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Change Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ubah Status Pesanan</AlertDialogTitle>
            <AlertDialogDescription>
              Ubah status untuk {order.orderCode}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select
              value={newStatus}
              onValueChange={(v) => setNewStatus(v as OrderStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="processing">Diproses</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="delivered">Diambil</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusChange} disabled={changingStatus}>
              {changingStatus ? "Menyimpan..." : "Simpan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Dialog */}
      <AlertDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Catat Pembayaran</AlertDialogTitle>
            <AlertDialogDescription>
              Sisa yang harus dibayar: {formatCurrency(Math.max(0, remaining))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Jumlah (Rp)</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Metode</Label>
              <Select value={paymentMethod} onValueChange={(v) => v && setPaymentMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tunai</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Referensi (opsional)</Label>
              <Input
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="No. referensi"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handlePayment} disabled={submittingPayment || !paymentAmount}>
              {submittingPayment ? "Menyimpan..." : "Simpan Pembayaran"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
