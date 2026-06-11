"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Search,
  Loader2,
  Check,
} from "lucide-react"
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import type { Customer, Service } from "@/types"

// ── Form schema ───────────────────────────────────────────────

const formSchema = z.object({
  customerId: z.string().min(1, "Pilih pelanggan"),
  items: z
    .array(
      z.object({
        serviceId: z.string().min(1),
        serviceName: z.string().optional(),
        unitPrice: z.coerce.number().positive(),
        quantity: z.coerce.number().positive("Jumlah harus > 0"),
        subtotal: z.coerce.number().default(0),
        notes: z.string().optional(),
      })
    )
    .min(1, "Minimal 1 item"),
  discount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  pickupDate: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// ── Step labels ───────────────────────────────────────────────

const steps = [
  { title: "Pelanggan", description: "Pilih atau buat pelanggan baru" },
  { title: "Layanan", description: "Tambah item/jasa laundry" },
  { title: "Review", description: "Ringkasan & konfirmasi pesanan" },
]

export function OrderForm() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Data
  const [customers, setCustomers] = useState<Customer[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [customerSearch, setCustomerSearch] = useState("")
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", address: "" })

  // Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      customerId: "",
      items: [],
      discount: 0,
      notes: "",
      pickupDate: "",
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const watchedItems = form.watch("items")
  const discount = form.watch("discount") || 0

  // ── Fetch data ──────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const [custRes, svcRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/services"),
        ])
        if (custRes.ok) {
          const custData = await custRes.json()
          setCustomers(custData.data || custData.items || custData || [])
        }
        if (svcRes.ok) {
          const svcData = await svcRes.json()
          setServices(svcData.data || svcData.items || svcData || [])
        }
      } catch {
        // APIs may not exist yet
      }
    }
    load()
  }, [])

  // ── Create customer ─────────────────────────────────────────

  const handleCreateCustomer = async () => {
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.message || "Gagal membuat pelanggan")
        return
      }
      const data = await res.json()
      const created = data.data || data
      setCustomers((prev) => [...prev, created])
      form.setValue("customerId", created.id)
      setShowNewCustomer(false)
      setNewCustomer({ name: "", phone: "", address: "" })
      toast.success("Pelanggan berhasil dibuat")
    } catch {
      toast.error("Gagal membuat pelanggan")
    }
  }

  // ── Add service item ────────────────────────────────────────

  const handleAddItem = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId)
    if (!service) return

    // Check if already added
    const exists = watchedItems.find((i) => i.serviceId === serviceId)
    if (exists) {
      toast.info("Layanan sudah ditambahkan")
      return
    }

    append({
      serviceId: service.id,
      serviceName: service.name,
      unitPrice: service.pricePerUnit,
      quantity: service.minQuantity || 1,
      subtotal: service.pricePerUnit * (service.minQuantity || 1),
      notes: "",
    })
  }

  const updateItemSubtotal = (index: number) => {
    const items = form.getValues("items")
    if (!items[index]) return
    const item = items[index]
    const subtotal = (item.unitPrice || 0) * (item.quantity || 0)
    form.setValue(`items.${index}.subtotal`, subtotal)
  }

  // ── Computed totals ─────────────────────────────────────────

  const subtotal = watchedItems.reduce((sum, item) => sum + (item.subtotal || 0), 0)
  const total = Math.max(0, subtotal - discount)

  // ── Submit ──────────────────────────────────────────────────

  const onSubmit = async () => {
    const values = form.getValues()
    const result = formSchema.safeParse(values)
    if (!result.success) {
      const firstError = result.error.issues[0]
      toast.error(firstError?.message || "Lengkapi formulir")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        customerId: values.customerId,
        items: values.items.map((item) => ({
          serviceId: item.serviceId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes || "",
        })),
        pickupDate: values.pickupDate || null,
        notes: values.notes || "",
        discount: values.discount || 0,
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Gagal membuat pesanan")
      }

      const data = await res.json()
      const orderId = data.data?.id || data.id
      toast.success("Pesanan berhasil dibuat!")
      router.push(`/orders/${orderId}`)
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat pesanan")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Filtered customers ──────────────────────────────────────

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  )

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-3xl">
      {/* Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                        ? "border-2 border-primary text-primary"
                        : "border-2 border-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`mx-4 h-px w-12 sm:w-20 ${
                    i < step ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Select Customer */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pilih Pelanggan</CardTitle>
            <CardDescription>Cari pelanggan yang sudah ada atau buat baru</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau nomor HP..."
                className="pl-9"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => form.setValue("customerId", customer.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted ${
                    form.watch("customerId") === customer.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                  {customer.address && (
                    <p className="text-xs text-muted-foreground truncate">{customer.address}</p>
                  )}
                </button>
              ))}
              {filteredCustomers.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Pelanggan tidak ditemukan
                </p>
              )}
            </div>

            <Dialog open={showNewCustomer} onOpenChange={setShowNewCustomer}>
              <DialogTrigger>
                <Button variant="outline" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Pelanggan Baru
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Pelanggan Baru</DialogTitle>
                  <DialogDescription>Isi data pelanggan baru</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Nama</Label>
                    <Input
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Nama lengkap"
                    />
                  </div>
                  <div>
                    <Label>No. HP</Label>
                    <Input
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="08123456789"
                    />
                  </div>
                  <div>
                    <Label>Alamat</Label>
                    <Textarea
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, address: e.target.value }))}
                      placeholder="Alamat (opsional)"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewCustomer(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleCreateCustomer}>Simpan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
          <CardFooter className="justify-between">
            <div />
            <Button
              onClick={() => setStep(1)}
              disabled={!form.watch("customerId")}
            >
              Lanjut
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Add Items */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Tambah Layanan</CardTitle>
            <CardDescription>Pilih jasa laundry dan tentukan jumlah</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Service selector */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {services
                .filter((s) => s.isActive !== false)
                .map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleAddItem(service.id)}
                    className="rounded-lg border border-border p-3 text-left text-sm hover:bg-muted transition-colors"
                  >
                    <p className="font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(service.pricePerUnit)} / {service.unit}
                    </p>
                  </button>
                ))}
              {services.length === 0 && (
                <p className="col-span-full text-center text-sm text-muted-foreground py-4">
                  Belum ada layanan. Buat layanan terlebih dahulu.
                </p>
              )}
            </div>

            {/* Added items */}
            {fields.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Item yang Ditambahkan:</p>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2 rounded-lg border p-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{field.serviceName || `Layanan #${index + 1}`}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Harga Satuan</Label>
                          <Input
                            type="number"
                            {...form.register(`items.${index}.unitPrice`, {
                              valueAsNumber: true,
                              onChange: () => updateItemSubtotal(index),
                            })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="w-20">
                          <Label className="text-xs">Jumlah</Label>
                          <Input
                            type="number"
                            step="0.5"
                            {...form.register(`items.${index}.quantity`, {
                              valueAsNumber: true,
                              onChange: () => updateItemSubtotal(index),
                            })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="w-28">
                          <Label className="text-xs">Subtotal</Label>
                          <p className="mt-1 text-sm font-medium">
                            {formatCurrency(watchedItems[index]?.subtotal || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
            <Button onClick={() => setStep(2)} disabled={fields.length === 0}>
              Lanjut
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Pesanan</CardTitle>
            <CardDescription>Periksa kembali pesanan sebelum disimpan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer info */}
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Pelanggan</p>
              <p className="font-medium">
                {customers.find((c) => c.id === form.watch("customerId"))?.name || "-"}
              </p>
            </div>

            {/* Items summary */}
            <div>
              <p className="text-sm font-medium mb-2">Item Pesanan</p>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between rounded-lg border p-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{field.serviceName}</p>
                      <p className="text-xs text-muted-foreground">
                        {watchedItems[index]?.quantity} x {formatCurrency(watchedItems[index]?.unitPrice || 0)}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(watchedItems[index]?.subtotal || 0)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Discount */}
            <div>
              <Label>Diskon (Rp)</Label>
              <Input
                type="number"
                {...form.register("discount", { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            {/* Notes */}
            <div>
              <Label>Catatan</Label>
              <Textarea
                {...form.register("notes")}
                placeholder="Catatan untuk pesanan (opsional)"
              />
            </div>

            {/* Pickup date */}
            <div>
              <Label>Estimasi Selesai</Label>
              <Input type="date" {...form.register("pickupDate")} />
            </div>

            {/* Total */}
            <div className="rounded-lg bg-primary/5 p-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Diskon</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" onClick={() => setStep(1)} disabled={submitting}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
            <Button onClick={onSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Buat Pesanan"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
