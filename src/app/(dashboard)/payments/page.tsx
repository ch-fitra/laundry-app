"use client"

import { useEffect, useState, useCallback } from "react"
import { PlusIcon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/page-header"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface Payment {
  id: string
  amount: number
  method: string
  referenceNo: string | null
  paidAt: string
  order: {
    orderCode: string
    customer: { name: string }
  }
  recordedBy: { id: string; name: string } | null
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [method, setMethod] = useState("")
  const [open, setOpen] = useState(false)

  // Form state
  const [formOrderId, setFormOrderId] = useState("")
  const [formAmount, setFormAmount] = useState("")
  const [formMethod, setFormMethod] = useState("CASH")
  const [formReference, setFormReference] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (search) params.set("search", search)
      if (method) params.set("method", method)

      const res = await fetch(`/api/payments?${params}`)
      const json = await res.json()
      if (json.success) {
        setPayments(json.data)
        setTotal(json.total)
        setTotalPages(json.totalPages)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, search, method])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formOrderId || !formAmount) {
      toast.error("Order ID dan jumlah pembayaran harus diisi")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: formOrderId,
          amount: parseFloat(formAmount),
          method: formMethod,
          referenceNo: formReference || null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Pembayaran berhasil dicatat")
        setOpen(false)
        setFormOrderId("")
        setFormAmount("")
        setFormMethod("CASH")
        setFormReference("")
        fetchPayments()
      } else {
        toast.error(json.error || "Gagal mencatat pembayaran")
      }
    } catch (err) {
      toast.error("Terjadi kesalahan")
    } finally {
      setSubmitting(false)
    }
  }

  const methodBadge = (method: string) => {
    const labels: Record<string, string> = {
      CASH: "Tunai",
      TRANSFER: "Transfer",
      QRIS: "QRIS",
      OTHER: "Lainnya",
    }
    const variants: Record<string, "default" | "secondary" | "outline" | "ghost"> = {
      CASH: "default",
      TRANSFER: "secondary",
      QRIS: "outline",
      OTHER: "ghost",
    }
    return <Badge variant={variants[method] || "outline"}>{labels[method] || method}</Badge>
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <PageHeader
        title="Pembayaran"
        description={`Total ${total} pembayaran`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button size="sm">
                  <PlusIcon className="size-4" />
                  Catat Pembayaran
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Catat Pembayaran Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="orderId">ID Order</Label>
                  <Input
                    id="orderId"
                    placeholder="Masukkan ID Order"
                    value={formOrderId}
                    onChange={(e) => setFormOrderId(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="amount">Jumlah (Rp)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Masukkan jumlah"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Metode Pembayaran</Label>
                  <Select value={formMethod} onValueChange={(v) => v && setFormMethod(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Tunai</SelectItem>
                      <SelectItem value="TRANSFER">Transfer</SelectItem>
                      <SelectItem value="QRIS">QRIS</SelectItem>
                      <SelectItem value="OTHER">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="reference">No. Referensi (opsional)</Label>
                  <Input
                    id="reference"
                    placeholder="No. referensi"
                    value={formReference}
                    onChange={(e) => setFormReference(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Menyimpan..." : "Simpan"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Riwayat Pembayaran</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-full sm:w-48">
                <SearchIcon className="absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari..."
                  className="pl-7"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                />
              </div>
              <Select value={method} onValueChange={(v) => { if (v !== null) { setMethod(v); setPage(1) } }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Metode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">Semua</SelectItem>
                  <SelectItem value="CASH">Tunai</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                  <SelectItem value="QRIS">QRIS</SelectItem>
                  <SelectItem value="OTHER">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Referensi</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead>Dicatat Oleh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Belum ada pembayaran
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDateTime(payment.paidAt)}</TableCell>
                    <TableCell className="font-medium">{payment.order.orderCode}</TableCell>
                    <TableCell>{payment.order.customer.name}</TableCell>
                    <TableCell>{methodBadge(payment.method)}</TableCell>
                    <TableCell>{payment.referenceNo || "-"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(payment.amount))}
                    </TableCell>
                    <TableCell>{payment.recordedBy?.name || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Halaman {page} dari {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
