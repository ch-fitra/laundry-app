"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Order, OrderItem } from "@/types"
import { Printer } from "lucide-react"

interface PrintReceiptProps {
  order: Order
}

export function PrintReceipt({ order }: PrintReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nota Laundry - ${order.orderCode}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 300px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 15px; }
          .header h1 { font-size: 16px; margin: 0 0 5px; }
          .header p { margin: 2px 0; color: #555; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .info { margin-bottom: 10px; }
          .info-row { display: flex; justify-content: space-between; margin: 2px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 4px 0; text-align: left; }
          th { border-bottom: 1px solid #000; }
          .text-right { text-align: right; }
          .total { font-weight: bold; font-size: 14px; margin-top: 10px; }
          .footer { text-align: center; margin-top: 15px; font-size: 10px; color: #888; }
          .status-paid { color: green; font-weight: bold; }
          .status-unpaid { color: red; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>NOTA LAUNDRY</h1>
      <p>${process.env.NEXT_PUBLIC_OUTLET_NAME || "LaundryApp"}</p>
      <p>${process.env.NEXT_PUBLIC_OUTLET_ADDRESS || ""}</p>
      <p>Telp: ${process.env.NEXT_PUBLIC_OUTLET_PHONE || ""}</p>
    </div>
    <div class="divider"></div>
    <div class="info">
      <div class="info-row"><span>Kode</span><span>${order.orderCode}</span></div>
      <div class="info-row"><span>Pelanggan</span><span>${order.customer.name}</span></div>
      <div class="info-row"><span>Tanggal</span><span>${formatDate(order.createdAt, "dd MMM yyyy HH:mm")}</span></div>
      ${order.pickupDate ? `<div class="info-row"><span>Estimasi Selesai</span><span>${formatDate(order.pickupDate, "dd MMM yyyy")}</span></div>` : ""}
      ${order.notes ? `<div class="info-row"><span>Catatan</span><span>${order.notes}</span></div>` : ""}
    </div>
    <div class="divider"></div>
    <table>
      <thead>
        <tr>
          <th>Layanan</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Harga</th>
          <th class="text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${(order.items || [])
          .map(
            (item) => `
          <tr>
            <td>${item.service.name}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${formatCurrency(item.unitPrice)}</td>
            <td class="text-right">${formatCurrency(item.subtotal)}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
    <div class="divider"></div>
    <div class="info-row total">
      <span>TOTAL</span>
      <span>${formatCurrency(order.totalPrice)}</span>
    </div>
    <div class="info-row">
      <span>Status Pembayaran</span>
      <span class="${order.paymentStatus === "paid" ? "status-paid" : "status-unpaid"}">${order.paymentStatus === "paid" ? "LUNAS" : order.paymentStatus === "partial" ? "SEBAGIAN" : "BELUM DIBAYAR"}</span>
    </div>
    <div class="divider"></div>
    <div class="footer">
      <p>Terima kasih telah menggunakan jasa kami</p>
      <p>Barang yang sudah dibawa tidak dapat dikembalikan</p>
      <p>Simpan nota ini untuk pengambilan</p>
    </div>
  </body>
</html>`

    printWindow.document.write(receiptHtml)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 500)
  }

  return (
    <Button variant="outline" onClick={handlePrint}>
      <Printer className="mr-2 h-4 w-4" />
      Cetak Nota
    </Button>
  )
}
