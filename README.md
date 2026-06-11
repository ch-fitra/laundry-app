# 🧺 LaundryPro — Aplikasi Manajemen Laundry

Aplikasi web manajemen laundry untuk usaha kecil-menengah di Indonesia. Dibangun dengan Next.js 16, TypeScript, Tailwind CSS, Prisma ORM, dan PostgreSQL.

## ✨ Fitur Utama

- **📊 Dashboard** — Statistik real-time, grafik pendapatan, order terbaru
- **📋 Manajemen Order** — Buat, ubah status, lacak pesanan laundry
- **👥 Manajemen Pelanggan** — Data pelanggan lengkap dengan riwayat transaksi
- **🛠️ Manajemen Layanan** — Atur jenis layanan dan harga (Cuci Kering, Setrika, Dry Clean, dll)
- **💰 Manajemen Pembayaran** — Catat pembayaran (Cash/Transfer/QRIS)
- **📈 Laporan Keuangan** — Grafik pendapatan harian/mingguan/bulanan
- **💸 Pengeluaran** — Catat pengeluaran operasional
- **📱 Notifikasi WhatsApp** — Kirim notifikasi otomatis via Fonnte API
- **🖨️ Cetak Nota** — Cetak struk thermal printer
- **⚙️ Pengaturan Outlet** — Profil outlet, ganti password, konfigurasi notifikasi

## 🚀 Tech Stack

| Teknologi | Kegunaan |
|---|---|
| **Next.js 16** (App Router) | Framework React |
| **TypeScript** | Type safety |
| **Tailwind CSS v4** | Styling |
| **shadcn/ui v4** | Komponen UI |
| **Prisma v7** | ORM Database |
| **PostgreSQL** | Database |
| **NextAuth v5** | Autentikasi |
| **Zod** | Validasi form |
| **React Hook Form** | Manajemen form |
| **Recharts** | Grafik & chart |
| **jsPDF + html2canvas** | Cetak nota |
| **Fonnte API** | Notifikasi WhatsApp |
| **date-fns** | Manipulasi tanggal |

## 📁 Struktur Project

```
laundry-app/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Data demo
│   └── migrations/            # Migrasi database
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login & Register
│   │   ├── (dashboard)/       # Dashboard, Orders, Customers, Services,
│   │   │                      # Payments, Expenses, Reports, Settings
│   │   └── api/               # REST API routes
│   ├── components/
│   │   ├── layout/            # Sidebar, Header
│   │   ├── dashboard/         # StatCard, RevenueChart, RecentOrders
│   │   ├── orders/            # OrderForm, OrderStatusBadge, PrintReceipt
│   │   └── shared/            # ConfirmDialog
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── auth.ts            # NextAuth v5 config
│   │   ├── utils.ts           # Helper functions
│   │   ├── validations.ts     # Zod schemas
│   │   └── whatsapp.ts        # Fonnte API wrapper
│   ├── hooks/                 # Custom React hooks
│   └── types/                 # TypeScript interfaces
├── proxy.ts                   # Middleware (Next.js 16)
└── .env.local                 # Environment variables
```

## 🔧 Cara Install & Setup

### Prasyarat

- Node.js 20.9+
- PostgreSQL (via Docker atau lokal)
- npm

### 1. Clone & Install

```bash
git clone <repo-url> laundry-app
cd laundry-app
npm install
```

### 2. Setup Database (Docker)

```bash
docker run -d \
  --name laundry-db \
  -e POSTGRES_USER=laundry_user \
  -e POSTGRES_PASSWORD=*** \
  -e POSTGRES_DB=laundry_db \
  -p 5432:5432 \
  postgres:16-alpine
```

### 3. Konfigurasi Environment

Buat file `.env.local`:

```env
DATABASE_URL="postgresql://laundry_user:***@localhost:5432/laundry_db"
NEXTAUTH_SECRET="generate-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
FONNTE_TOKEN="your-fonnte-token"
NEXT_PUBLIC_APP_NAME="LaundryPro"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Migrasi Database

```bash
DATABASE_URL="postgresql://laundry_user:***@localhost:5432/laundry_db" npx prisma migrate dev --name init
```

### 5. Seed Data Demo

```bash
DATABASE_URL="postgresql://laundry_user:***@localhost:5432/laundry_db" npx tsx prisma/seed.ts
```

### 6. Jalankan Development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

### 📝 Akun Demo

| Email | Password | Role |
|---|---|---|
| dmo@laundrypro.com | dmo123 | Owner |

## 🐳 Setup Database (Alternatif — Supabase)

Untuk production, ganti `DATABASE_URL` di `.env.local` dengan connection string dari Supabase:

```env
DATABASE_URL="postgresql://postgres.vbesbdrokyrvgqfxzbkk:***@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true"
```

## 📱 Setup Notifikasi WhatsApp

1. Daftar di [Fonnte.com](https://fonnte.com)
2. Dapatkan API Token
3. Masukkan token ke `.env.local`: `FONNTE_TOKEN="your-token-here"`
4. Atur nomor WhatsApp di Pengaturan → Notifikasi

## 🚢 Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Pastikan environment variables di-set di dashboard Vercel.

## 📸 Screenshot

*(Tambahkan screenshot setelah deploy)*

## 👨‍💻 Developer

Dibangun oleh **AutoCraft AI** — Software House AI milik Fitra.

## 📄 Lisensi

Private — Hak Cipta © 2026
