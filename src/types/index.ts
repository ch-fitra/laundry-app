// ============================================================
// Laundry App — Core TypeScript Interfaces & Types
// ============================================================

// ── Enums ────────────────────────────────────────────────────

export type OrderStatus =
  | "PENDING"       // Menunggu
  | "PROCESSING"    // Sedang dicuci
  | "DONE"          // Selesai, siap diambil
  | "NOTIFIED"      // Sudah dinotifikasi
  | "PICKED_UP"     // Sudah diambil
  | "CANCELLED";    // Dibatalkan

export type PaymentStatus =
  | "UNPAID"
  | "PAID"
  | "PARTIAL";

export type PaymentMethod =
  | "CASH"
  | "TRANSFER"
  | "QRIS"
  | "OTHER";

export type UserRole = "OWNER" | "STAFF";

export type ServiceCategory = "laundry" | "dry_clean" | "ironing" | "other";

export type UnitType = "kg" | "pcs" | "meter";

// ── Database Models ─────────────────────────────────────────

export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  password: string;
  image: string | null;
  role: UserRole;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  orders?: Order[];
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  category: ServiceCategory;
  unit: UnitType;
  pricePerUnit: number;
  minQuantity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  orderItems?: OrderItem[];
}

export interface Order {
  id: string;
  orderCode: string;
  customerId: string;
  customer: Customer;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalPrice: number;
  totalWeight: number | null;
  pickupDate: Date | null;
  notes: string | null;
  createdBy: string;
  createdByUser?: User;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItem[];
  payments?: Payment[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  order: Order;
  serviceId: string;
  service: Service;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes: string | null;
  createdAt: Date;
}

export interface Payment {
  id: string;
  orderId: string;
  order: Order;
  amount: number;
  method: string;
  reference: string | null;
  notes: string | null;
  receivedBy: string;
  receivedByUser?: User;
  createdAt: Date;
}

// ── Session / Auth ──────────────────────────────────────────

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  image: string | null;
  phone: string | null;
}

// ── API Response Wrapper ────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// ── Pagination ──────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ── Dashboard ───────────────────────────────────────────────

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  activeCustomers: number;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  orders: number;
}

// ── Fonnte / WhatsApp ───────────────────────────────────────

export interface WhatsAppMessage {
  target: string;       // phone number
  message: string;
  schedule?: number;    // unix timestamp
  delay?: number;       // delay in seconds
}

export interface WhatsAppResponse {
  status: boolean;
  message: string;
  data?: unknown;
}
