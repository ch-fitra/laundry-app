"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  MoreHorizontal,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OrderStatusBadge, getStatusLabel } from "@/components/orders/OrderStatusBadge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import type { OrderStatus, Order } from "@/types"

interface OrdersResponse {
  items: Order[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const statusFilterOptions: { value: string; label: string }[] = [
  { value: "", label: "Semua Status" },
  { value: "PENDING", label: "Menunggu" },
  { value: "PROCESSING", label: "Diproses" },
  { value: "DONE", label: "Selesai" },
  { value: "PICKED_UP", label: "Diambil" },
  { value: "CANCELLED", label: "Dibatalkan" },
]

export default function OrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data, setData] = useState<OrdersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "")
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [statusChangeId, setStatusChangeId] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<OrderStatus>("PENDING")
  const [changingStatus, setChangingStatus] = useState(false)

  const limit = 10

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter) params.set("status", statusFilter)
      params.set("page", String(page))
      params.set("limit", String(limit))

      const res = await fetch(`/api/orders?${params.toString()}`)
      if (!res.ok) throw new Error("Gagal memuat data")
      const json = await res.json()
      setData(json.data || json)
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat pesanan")
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (statusFilter) params.set("status", statusFilter)
    if (page > 1) params.set("page", String(page))
    const qs = params.toString()
    router.replace(`/orders${qs ? `?${qs}` : ""}`, { scroll: false })
  }, [search, statusFilter, page, router])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/orders/${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Gagal menghapus")
      toast.success("Pesanan berhasil dihapus")
      setDeleteId(null)
      fetchOrders()
    } catch {
      toast.error("Gagal menghapus pesanan")
    }
  }

  const handleStatusChange = async () => {
    if (!statusChangeId) return
    setChangingStatus(true)
    try {
      const res = await fetch(`/api/orders/${statusChangeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Gagal mengubah status")
      toast.success("Status berhasil diubah")
      setStatusChangeId(null)
      fetchOrders()
    } catch {
      toast.error("Gagal mengubah status")
    } finally {
      setChangingStatus(false)
    }
  }

  const orders = data?.items || []
  const totalPages = data?.totalPages || 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pesanan</h1>
          <p className="text-sm text-muted-foreground">
            Kelola semua pesanan laundry
          </p>
        </div>
        <Button>
          <Link href="/orders/new">
            <Plus className="mr-2 h-4 w-4" />
            Pesanan Baru
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari kode atau nama pelanggan..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                if (v !== null) setStatusFilter(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                {statusFilterOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pembayaran</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="w-[80px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Belum ada pesanan
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-primary hover:underline"
                      >
                        {order.orderCode}
                      </Link>
                    </TableCell>
                    <TableCell>{order.customer?.name || "-"}</TableCell>
                    <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
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
                            : "Belum Dibayar"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(order.createdAt, "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem>
                            <Link href={`/orders/${order.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Detail
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setStatusChangeId(order.id)
                              setNewStatus(order.status)
                            }}
                          >
                            Ubah Status
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeleteId(order.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Selanjutnya
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pesanan?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Pesanan akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Dialog */}
      <AlertDialog
        open={!!statusChangeId}
        onOpenChange={(o) => !o && setStatusChangeId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ubah Status Pesanan</AlertDialogTitle>
            <AlertDialogDescription>
              Pilih status baru untuk pesanan ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Menunggu</SelectItem>
                <SelectItem value="PROCESSING">Diproses</SelectItem>
                <SelectItem value="DONE">Selesai</SelectItem>
                <SelectItem value="PICKED_UP">Diambil</SelectItem>
                <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
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
    </div>
  )
}
