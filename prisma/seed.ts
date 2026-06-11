import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding database...");

  // ── Clean existing data ──
  await prisma.notification.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.service.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.outlet.deleteMany();
  await prisma.user.deleteMany();

  // ── 1. User OWNER ──
  const hashedPassword = await bcrypt.hash("dmo123", 10);
  const owner = await prisma.user.create({
    data: {
      name: "Dimas Maulana",
      email: "dmo@laundrypro.com",
      password: hashedPassword,
      role: "OWNER",
      phone: "081234567890",
    },
  });
  console.log(`✅ User created: ${owner.email} (${owner.role})`);

  // ── 2. Outlet ──
  const outlet = await prisma.outlet.create({
    data: {
      ownerId: owner.id,
      name: "Laundry Bersih Cemerlang",
      address: "Jl. Merdeka No. 123, Jakarta Pusat",
      phone: "08123456789",
      whatsapp: "628123456789",
    },
  });
  console.log(`✅ Outlet created: ${outlet.name}`);

  // ── 3. Services (5) ──
  const servicesData = [
    { name: "Cuci Kering", unit: "kg", pricePerUnit: 6000, estDurationHours: 24 },
    { name: "Cuci Setrika", unit: "kg", pricePerUnit: 9000, estDurationHours: 48 },
    { name: "Setrika Saja", unit: "kg", pricePerUnit: 5000, estDurationHours: 24 },
    { name: "Dry Clean", unit: "pcs", pricePerUnit: 25000, estDurationHours: 72 },
    { name: "Express Cuci Kering", unit: "kg", pricePerUnit: 10000, estDurationHours: 6 },
  ];

  const services = await Promise.all(
    servicesData.map((svc) =>
      prisma.service.create({
        data: { ...svc, outletId: outlet.id },
      })
    )
  );
  console.log(`✅ ${services.length} services created`);

  // ── 4. Customers (5) ──
  const customersData = [
    { name: "Siti Rahmawati", phone: "081298765432", address: "Jl. Sudirman No. 45, Jakarta" },
    { name: "Bambang Supriyadi", phone: "087812345678", address: "Jl. Gatot Subroto Kav. 12, Jakarta" },
    { name: "Dewi Sartika", phone: "085611223344", address: "Jl. Kuningan Barat No. 7, Jakarta" },
    { name: "Agus Prasetyo", phone: "082134567890", address: "Perumahan Cempaka Putih Blok A3, Jakarta" },
    { name: "Rina Marlina", phone: "081387654321", address: "Jl. Mangga Besar No. 88, Jakarta" },
  ];

  const customers = await Promise.all(
    customersData.map((c) =>
      prisma.customer.create({
        data: { ...c, outletId: outlet.id },
      })
    )
  );
  console.log(`✅ ${customers.length} customers created`);

  // ── Helper: random int ──
  const randInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  // ── 5. Orders (10) ──
  const now = new Date();
  const ordersData = [
    {
      customerIdx: 0,
      status: "PICKED_UP" as const,
      paymentStatus: "PAID" as const,
      weight: 3.5,
      daysAgo: 10,
      items: [{ serviceIdx: 1, qty: 3.5 }], // Cuci Setrika
      payments: [{ method: "CASH" as const, amount: 31500 }],
    },
    {
      customerIdx: 1,
      status: "DONE" as const,
      paymentStatus: "UNPAID" as const,
      weight: 2.0,
      daysAgo: 4,
      items: [{ serviceIdx: 0, qty: 2.0 }], // Cuci Kering
      payments: [],
    },
    {
      customerIdx: 2,
      status: "PROCESSING" as const,
      paymentStatus: "UNPAID" as const,
      weight: 4.0,
      daysAgo: 1,
      items: [{ serviceIdx: 1, qty: 4.0 }], // Cuci Setrika
      payments: [],
    },
    {
      customerIdx: 3,
      status: "PENDING" as const,
      paymentStatus: "UNPAID" as const,
      weight: 2.5,
      daysAgo: 0,
      items: [{ serviceIdx: 0, qty: 2.5 }], // Cuci Kering
      payments: [],
    },
    {
      customerIdx: 4,
      status: "NOTIFIED" as const,
      paymentStatus: "PAID" as const,
      weight: 1.0,
      daysAgo: 5,
      items: [{ serviceIdx: 4, qty: 1.0 }], // Express Cuci Kering
      payments: [{ method: "TRANSFER" as const, amount: 10000, referenceNo: "TRF-2024-001" }],
    },
    {
      customerIdx: 0,
      status: "PICKED_UP" as const,
      paymentStatus: "PAID" as const,
      weight: 5.0,
      daysAgo: 14,
      items: [
        { serviceIdx: 0, qty: 3.0 }, // Cuci Kering
        { serviceIdx: 2, qty: 2.0 }, // Setrika Saja
      ],
      payments: [{ method: "QRIS" as const, amount: 28000 }],
    },
    {
      customerIdx: 1,
      status: "CANCELLED" as const,
      paymentStatus: "UNPAID" as const,
      weight: 1.5,
      daysAgo: 7,
      items: [{ serviceIdx: 3, qty: 1 }], // Dry Clean 1 pcs
      payments: [],
    },
    {
      customerIdx: 2,
      status: "DONE" as const,
      paymentStatus: "PARTIAL" as const,
      weight: 3.0,
      daysAgo: 3,
      items: [{ serviceIdx: 0, qty: 3.0 }], // Cuci Kering
      payments: [{ method: "CASH" as const, amount: 10000 }],
    },
    {
      customerIdx: 3,
      status: "PROCESSING" as const,
      paymentStatus: "PAID" as const,
      weight: 6.0,
      daysAgo: 2,
      items: [{ serviceIdx: 1, qty: 6.0 }], // Cuci Setrika
      payments: [{ method: "TRANSFER" as const, amount: 54000, referenceNo: "TRF-2024-002" }],
    },
    {
      customerIdx: 4,
      status: "PENDING" as const,
      paymentStatus: "UNPAID" as const,
      weight: 2.0,
      daysAgo: 0,
      items: [{ serviceIdx: 4, qty: 2.0 }], // Express Cuci Kering
      payments: [],
    },
  ];

  for (let i = 0; i < ordersData.length; i++) {
    const d = ordersData[i];
    const customer = customers[d.customerIdx];

    // Calculate subtotal from items
    let subtotal = 0;
    for (const item of d.items) {
      const svc = services[item.serviceIdx];
      subtotal += Number(item.qty) * Number(svc.pricePerUnit);
    }

    const totalPrice = subtotal;
    const createdAt = new Date(now.getTime() - d.daysAgo * 24 * 60 * 60 * 1000);
    const orderCode = `ORD-${String(createdAt.getFullYear()).slice(-2)}${String(createdAt.getMonth() + 1).padStart(2, "0")}${String(createdAt.getDate()).padStart(2, "0")}-${String(i + 1).padStart(3, "0")}`;

    const order = await prisma.order.create({
      data: {
        orderCode,
        outletId: outlet.id,
        customerId: customer.id,
        handledById: owner.id,
        status: d.status,
        totalWeight: d.weight,
        subtotal,
        discount: 0,
        totalPrice,
        paymentStatus: d.paymentStatus,
        notes: null,
        createdAt,
        updatedAt: createdAt,
      },
    });

    // Order items
    for (const item of d.items) {
      const svc = services[item.serviceIdx];
      const itemSubtotal = Number(item.qty) * Number(svc.pricePerUnit);
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          serviceId: svc.id,
          quantity: item.qty,
          unitPrice: svc.pricePerUnit,
          subtotal: itemSubtotal,
        },
      });
    }

    // Payments
    for (const pmt of d.payments) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: pmt.amount,
          method: pmt.method,
          referenceNo: (pmt as any).referenceNo ?? null,
          paidAt: createdAt,
          recordedById: owner.id,
        },
      });
    }

    // Status history
    const statusFlow: Array<{ from: string | null; to: string }> = [
      { from: null, to: "PENDING" },
    ];
    if (d.status === "PROCESSING" || d.status === "CANCELLED" || d.status === "DONE" || d.status === "NOTIFIED" || d.status === "PICKED_UP") {
      statusFlow.push({ from: "PENDING", to: "PROCESSING" });
    }
    if (d.status === "DONE" || d.status === "NOTIFIED" || d.status === "PICKED_UP") {
      statusFlow.push({ from: "PROCESSING", to: "DONE" });
    }
    if (d.status === "NOTIFIED" || d.status === "PICKED_UP") {
      statusFlow.push({ from: "DONE", to: "NOTIFIED" });
    }
    if (d.status === "PICKED_UP") {
      statusFlow.push({ from: "NOTIFIED", to: "PICKED_UP" });
    }
    if (d.status === "CANCELLED") {
      statusFlow.push({ from: "PENDING", to: "CANCELLED" });
    }

    for (const step of statusFlow) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: step.from as any,
          toStatus: step.to as any,
          changedById: owner.id,
          note: null,
          createdAt,
        },
      });
    }

    // Update customer totalOrders
    await prisma.customer.update({
      where: { id: customer.id },
      data: { totalOrders: { increment: 1 } },
    });
  }
  console.log(`✅ ${ordersData.length} orders created`);

  // ── 6. Expenses ──
  const expensesData = [
    { category: "Listrik", description: "Pembayaran listrik bulan ini", amount: 500000, daysAgo: 5 },
    { category: "Air", description: "Pembayaran PDAM", amount: 150000, daysAgo: 6 },
    { category: "Sewa", description: "Sewa tempat bulanan", amount: 1500000, daysAgo: 2 },
    { category: "Logistik", description: "Pembelian deterjen 5kg", amount: 85000, daysAgo: 3 },
    { category: "Logistik", description: "Pembelian pewangi pakaian", amount: 45000, daysAgo: 4 },
  ];

  for (const exp of expensesData) {
    const expenseDate = new Date(now.getTime() - exp.daysAgo * 24 * 60 * 60 * 1000);
    await prisma.expense.create({
      data: {
        outletId: outlet.id,
        category: exp.category,
        description: exp.description,
        amount: exp.amount,
        expenseDate,
        recordedById: owner.id,
      },
    });
  }
  console.log(`✅ ${expensesData.length} expenses created`);

  console.log("\n🎉 Seed completed successfully!");
  console.log(`   Owner: dmo@laundrypro.com / dmo123`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
