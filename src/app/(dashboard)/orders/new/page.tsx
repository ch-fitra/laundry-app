"use client"

import { OrderForm } from "@/components/orders/OrderForm"

export default function NewOrderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pesanan Baru</h1>
        <p className="text-sm text-muted-foreground">
          Buat pesanan laundry baru
        </p>
      </div>
      <OrderForm />
    </div>
  )
}
