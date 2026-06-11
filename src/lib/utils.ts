import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { id } from "date-fns/locale/id";

// ── Utility classes ─────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Currency ────────────────────────────────────────────────

/**
 * Format a number as Indonesian Rupiah.
 * @example formatCurrency(15000) // "Rp 15.000"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Parse a formatted currency string back to a number.
 * @example parseCurrency("Rp 15.000") // 15000
 */
export function parseCurrency(value: string): number {
  return Number(value.replace(/[^0-9]/g, ""));
}

// ── Date / Time ─────────────────────────────────────────────

/**
 * Format a date string or Date object to Indonesian locale.
 * @example formatDate("2025-06-11") // "11 Juni 2025"
 */
export function formatDate(
  date: string | Date | null | undefined,
  fmt: string = "dd MMMM yyyy"
): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt, { locale: id });
}

/**
 * Format a date with time.
 * @example formatDateTime("2025-06-11T14:30:00") // "11 Juni 2025, 14:30"
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, "dd MMMM yyyy, HH:mm");
}

/**
 * Relative time (e.g., "2 jam yang lalu").
 */
export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: id });
}

// ── Order Code ──────────────────────────────────────────────

const ORDER_CODE_PREFIX = "LND";

/**
 * Generate a unique order code.
 * Format: LND-YYMMDD-XXXX (e.g. LND-250611-0001)
 */
export function generateOrderCode(counter: number = 1): string {
  const datePart = format(new Date(), "yyMMdd");
  const seqPart = String(counter).padStart(4, "0");
  return `${ORDER_CODE_PREFIX}-${datePart}-${seqPart}`;
}

// ── Phone Number ────────────────────────────────────────────

/**
 * Normalize Indonesian phone number to international format (62xxx).
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");

  // Convert leading 0 to 62
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  }
  // Convert leading 8 to 628 (assumes missing prefix)
  else if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned;
  }

  return cleaned;
}

// ── Misc ────────────────────────────────────────────────────

/**
 * Truncate a string to a max length with ellipsis.
 */
export function truncate(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Generate a random color (hex) based on a string seed.
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".slice(c.length) + c;
}

/**
 * Get initials from a name (up to 2 characters).
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
