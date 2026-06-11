"use client"

import { Badge } from "@/components/ui/badge"
import type { OrderStatus } from "@/types"

interface OrderStatusBadgeProps {
  status: OrderStatus
  size?: "sm" | "default"
}

const statusConfig: Record<OrderStatus, { label: string; variant: "secondary" | "default" | "outline" | "destructive"; className?: string }> = {
  pending: { label: "Menunggu", variant: "secondary" },
  processing: { label: "Diproses", variant: "default" },
  completed: { label: "Selesai", variant: "outline" },
  delivered: { label: "Diambil", variant: "outline" },
  cancelled: { label: "Dibatalkan", variant: "destructive" },
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
    unpaid: "Belum Dibayar",
    paid: "Lunas",
    partial: "Sebagian",
  }
  return labels[paymentStatus] || paymentStatus
}
