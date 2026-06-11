import { z } from "zod";

// ── Auth ────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password harus diisi"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nama minimal 2 karakter")
      .max(100, "Nama maksimal 100 karakter"),
    email: z.string().email("Email tidak valid"),
    password: z
      .string()
      .min(6, "Password minimal 6 karakter")
      .max(100, "Password maksimal 100 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password harus diisi"),
    phone: z
      .string()
      .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, "Nomor HP tidak valid")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// ── Customer ────────────────────────────────────────────────

export const customerSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  phone: z
    .string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, "Nomor HP tidak valid"),
  address: z.string().max(500, "Alamat maksimal 500 karakter").optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const customerUpdateSchema = customerSchema.partial();

export type CustomerInput = z.infer<typeof customerSchema>;

// ── Service ─────────────────────────────────────────────────

export const serviceSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  description: z.string().max(500).optional().or(z.literal("")),
  category: z.enum(["laundry", "dry_clean", "ironing", "other"]),
  unit: z.enum(["kg", "pcs", "meter"]),
  pricePerUnit: z.coerce
    .number()
    .positive("Harga harus lebih dari 0")
    .max(1_000_000, "Harga maksimal Rp 1.000.000"),
  minQuantity: z.coerce.number().min(1, "Minimal quantity 1").default(1),
  isActive: z.boolean().default(true),
});

export const serviceUpdateSchema = serviceSchema.partial();

export type ServiceInput = z.infer<typeof serviceSchema>;

// ── Order ───────────────────────────────────────────────────

export const orderItemSchema = z.object({
  serviceId: z.string().min(1, "Layanan harus dipilih"),
  quantity: z.coerce
    .number()
    .positive("Jumlah harus lebih dari 0")
    .max(9999, "Jumlah terlalu besar"),
  unitPrice: z.coerce.number().positive("Harga satuan harus diisi"),
  notes: z.string().max(200).optional().or(z.literal("")),
});

export const createOrderSchema = z.object({
  customerId: z.string().min(1, "Pelanggan harus dipilih"),
  items: z
    .array(orderItemSchema)
    .min(1, "Minimal 1 item layanan"),
  pickupDate: z.string().optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "PROCESSING",
    "DONE",
    "PICKED_UP",
    "CANCELLED",
  ]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

// ── Payment ─────────────────────────────────────────────────

export const paymentSchema = z.object({
  orderId: z.string().min(1, "Order harus dipilih"),
  amount: z.coerce
    .number()
    .positive("Jumlah pembayaran harus lebih dari 0"),
  method: z.enum(["cash", "transfer", "qris", "other"], {
    message: "Metode pembayaran tidak valid",
  }),
  reference: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

// ── Profile ─────────────────────────────────────────────────

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100)
    .optional(),
  phone: z
    .string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, "Nomor HP tidak valid")
    .optional()
    .or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini harus diisi"),
    newPassword: z
      .string()
      .min(6, "Password minimal 6 karakter")
      .max(100),
    confirmNewPassword: z.string().min(1, "Konfirmasi password harus diisi"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Password tidak cocok",
    path: ["confirmNewPassword"],
  });
