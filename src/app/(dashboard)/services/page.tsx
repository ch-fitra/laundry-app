"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import type { Service, ServiceCategory, UnitType } from "@/types"

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const defaultForm = {
    name: "",
    description: "",
    category: "laundry" as ServiceCategory,
    unit: "kg" as UnitType,
    pricePerUnit: "",
    minQuantity: "1",
    isActive: true,
  }
  const [form, setForm] = useState(defaultForm)

  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/services")
      if (!res.ok) throw new Error("Gagal memuat")
      const json = await res.json()
      setServices(json.data || json.items || json || [])
    } catch {
      toast.error("Gagal memuat layanan")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const openNew = () => {
    setEditingId(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  const openEdit = (service: Service) => {
    setEditingId(service.id)
    setForm({
      name: service.name,
      description: service.description || "",
      category: service.category,
      unit: service.unit,
      pricePerUnit: String(service.pricePerUnit),
      minQuantity: String(service.minQuantity),
      isActive: service.isActive,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.pricePerUnit) {
      toast.error("Nama dan harga harus diisi")
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        category: form.category,
        unit: form.unit,
        pricePerUnit: Number(form.pricePerUnit),
        minQuantity: Number(form.minQuantity) || 1,
        isActive: form.isActive,
      }

      const url = editingId ? `/api/services/${editingId}` : "/api/services"
      const method = editingId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Gagal menyimpan")

      toast.success(editingId ? "Layanan berhasil diperbarui" : "Layanan berhasil dibuat")
      setDialogOpen(false)
      fetchServices()
    } catch {
      toast.error("Gagal menyimpan layanan")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/services/${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Gagal menghapus")
      toast.success("Layanan berhasil dihapus")
      setDeleteId(null)
      fetchServices()
    } catch {
      toast.error("Gagal menghapus layanan")
    }
  }

  const categoryLabel: Record<string, string> = {
    laundry: "Laundry",
    dry_clean: "Dry Clean",
    ironing: "Setrika",
    other: "Lainnya",
  }

  const unitLabel: Record<string, string> = {
    kg: "Kg",
    pcs: "Pcs",
    meter: "Meter",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Layanan</h1>
          <p className="text-sm text-muted-foreground">
            Kelola daftar jasa laundry
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Layanan Baru
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Satuan</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Min. Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Belum ada layanan
                  </TableCell>
                </TableRow>
              ) : (
                services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {categoryLabel[service.category] || service.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{unitLabel[service.unit] || service.unit}</TableCell>
                    <TableCell>{formatCurrency(service.pricePerUnit)}</TableCell>
                    <TableCell>{service.minQuantity}</TableCell>
                    <TableCell>
                      <Badge
                        variant={service.isActive ? "outline" : "secondary"}
                        className="text-xs"
                      >
                        {service.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(service)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => setDeleteId(service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Layanan" : "Layanan Baru"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Ubah data layanan" : "Tambah layanan laundry baru"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Layanan *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Cuci Kering"
              />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Deskripsi layanan (opsional)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kategori *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((p) => ({ ...p, category: v as ServiceCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="laundry">Laundry</SelectItem>
                    <SelectItem value="dry_clean">Dry Clean</SelectItem>
                    <SelectItem value="ironing">Setrika</SelectItem>
                    <SelectItem value="other">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Satuan *</Label>
                <Select
                  value={form.unit}
                  onValueChange={(v) => setForm((p) => ({ ...p, unit: v as UnitType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="pcs">Pcs</SelectItem>
                    <SelectItem value="meter">Meter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Harga per Satuan (Rp) *</Label>
                <Input
                  type="number"
                  value={form.pricePerUnit}
                  onChange={(e) => setForm((p) => ({ ...p, pricePerUnit: e.target.value }))}
                  placeholder="15000"
                />
              </div>
              <div>
                <Label>Min. Quantity</Label>
                <Input
                  type="number"
                  value={form.minQuantity}
                  onChange={(e) => setForm((p) => ({ ...p, minQuantity: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="text-sm">
                Layanan Aktif
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : editingId ? "Perbarui" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Layanan?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan.
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
    </div>
  )
}
