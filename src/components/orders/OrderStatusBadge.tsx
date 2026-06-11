"use client"

import { Badge } from "@/components/ui/badge"
import type { OrderStatus } from "@/types"

interface OrderStatusBadgeProps {
  status: OrderStatus
  size?: "sm" | "default"
}

const statusConfig: Record<OrderStatus, { label: string; variant: "secondary" | "default" | "outline" | "destructive"; className?: string }> = {
  PENDING: { label: "Menunggu", variant: "secondary" },
  PROCESSING: { label: "Diproses", variant: "default" },
  DONE: { label: "Selesai", variant: "outline" },
  NOTIFIED: { label: "Dinotifikasi", variant: "outline" },
  PICKED_UP: { label: "Diambil", variant: "outline" },
  CANCELLED: { label: "Dibatalkan", variant: "destructive" },
}

export function OrderStatusBadge({ status, size = "default" }: OrderStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "secondary" as const }

  return (
    <Badge
      variant={config.variant}
      className={size === "sm" ? "text-xs px-1.5 py-0" : undefined}
    >
      {config.label}
    </Badge>
  )
}

export function getStatusLabel(status: OrderStatus): string {
  return statusConfig[status]?.label || status
}

export function getPaymentStatusLabel(paymentStatus: string): string {
  const labels: Record<string, string> = {
    UNPAID: "Belum Dibayar",
    PAID: "Lunas",
    PARTIAL: "Sebagian",
  }
  return labels[paymentStatus] || paymentStatus
}
