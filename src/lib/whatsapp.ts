// ============================================================
// Fonnte WhatsApp API Wrapper
// ============================================================
// Docs: https://fonnte.com
// Uses the Fonnte REST API to send WhatsApp messages.
// ============================================================

interface FonnteConfig {
  token: string;
  baseUrl?: string;
}

interface FonnteMessagePayload {
  target: string;
  message: string;
  schedule?: number;
  delay?: number;
}

interface FonnteResponse {
  status: boolean;
  message?: string;
  data?: unknown;
}

// ── Singleton configuration ─────────────────────────────────

let config: FonnteConfig = {
  token: process.env.FONNTE_TOKEN || "",
  baseUrl: process.env.FONNTE_BASE_URL || "https://api.fonnte.com",
};

export function configureWhatsApp(newConfig: Partial<FonnteConfig>) {
  if (newConfig.token !== undefined) config.token = newConfig.token;
  if (newConfig.baseUrl !== undefined) config.baseUrl = newConfig.baseUrl;
}

export function getWhatsAppConfig(): Readonly<FonnteConfig> {
  return { ...config };
}

// ── Core send function ─────────────────────────────────────

async function sendRaw(
  payload: FonnteMessagePayload
): Promise<FonnteResponse> {
  if (!config.token) {
    return { status: false, message: "Fonnte token not configured" };
  }

  const formData = new URLSearchParams();
  formData.append("target", payload.target);
  formData.append("message", payload.message);
  if (payload.schedule) formData.append("schedule", String(payload.schedule));
  if (payload.delay) formData.append("delay", String(payload.delay));

  try {
    const res = await fetch(`${config.baseUrl}/send`, {
      method: "POST",
      headers: {
        Authorization: `${config.token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const json: FonnteResponse = await res.json();
    return json;
  } catch (err) {
    return {
      status: false,
      message:
        err instanceof Error ? err.message : "Unknown WhatsApp API error",
    };
  }
}

// ── Domain-specific message helpers ─────────────────────────

/**
 * Send a new order notification to a customer.
 */
export async function sendOrderNotification(params: {
  phone: string;
  orderCode: string;
  customerName: string;
  totalPrice: number;
  pickupDate?: string;
}): Promise<FonnteResponse> {
  const lines = [
    `🧺 *Nota Laundry — ${params.orderCode}*`,
    "",
    `Halo *${params.customerName}*,`,
    `Pesanan laundry Anda telah diterima!`,
    "",
    `📋 Kode Order: *${params.orderCode}*`,
    `💰 Total: *Rp ${params.totalPrice.toLocaleString("id-ID")}*`,
  ];

  if (params.pickupDate) {
    lines.push(`📅 Estimasi selesai: *${params.pickupDate}*`);
  }

  lines.push(
    "",
    "Terima kasih telah menggunakan jasa kami 🙏",
    "",
    "_Pesan ini dikirim otomatis oleh sistem_"
  );

  return sendRaw({
    target: params.phone,
    message: lines.join("\n"),
  });
}

/**
 * Send order status update notification.
 */
export async function sendStatusUpdate(params: {
  phone: string;
  orderCode: string;
  customerName: string;
  status: string;
  notes?: string;
}): Promise<FonnteResponse> {
  const statusLabels: Record<string, string> = {
    pending: "📋 Menunggu",
    processing: "🔄 Sedang Diproses",
    completed: "✅ Selesai",
    delivered: "📦 Sudah Diambil",
    cancelled: "❌ Dibatalkan",
  };

  const label = statusLabels[params.status] || params.status;

  const lines = [
    `🧺 *Update Status Laundry*`,
    "",
    `Halo *${params.customerName}*,`,
    `Status pesanan Anda telah diperbarui:`,
    "",
    `📋 Kode Order: *${params.orderCode}*`,
    `🔔 Status: *${label}*`,
  ];

  if (params.notes) {
    lines.push("", `📝 Catatan: ${params.notes}`);
  }

  lines.push(
    "",
    "Terima kasih 🙏",
    "",
    "_Pesan ini dikirim otomatis oleh sistem_"
  );

  return sendRaw({
    target: params.phone,
    message: lines.join("\n"),
  });
}

/**
 * Send a payment confirmation message.
 */
export async function sendPaymentConfirmation(params: {
  phone: string;
  orderCode: string;
  customerName: string;
  amount: number;
  method: string;
}): Promise<FonnteResponse> {
  const lines = [
    `💳 *Konfirmasi Pembayaran*`,
    "",
    `Halo *${params.customerName}*,`,
    "Pembayaran Anda telah diterima!",
    "",
    `📋 Kode Order: *${params.orderCode}*`,
    `💰 Jumlah: *Rp ${params.amount.toLocaleString("id-ID")}*`,
    `💳 Metode: *${params.method}*`,
    "",
    "Terima kasih 🙏",
    "",
    "_Pesan ini dikirim otomatis oleh sistem_",
  ];

  return sendRaw({
    target: params.phone,
    message: lines.join("\n"),
  });
}

/**
 * Send a custom message to any phone number.
 */
export async function sendCustomMessage(
  phone: string,
  message: string
): Promise<FonnteResponse> {
  return sendRaw({ target: phone, message });
}

export default {
  configureWhatsApp,
  getWhatsAppConfig,
  sendOrderNotification,
  sendStatusUpdate,
  sendPaymentConfirmation,
  sendCustomMessage,
};
