import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createServiceSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  unit: z.string().default("kg"),
  pricePerUnit: z.number().positive("Harga harus lebih dari 0"),
  estDurationHours: z.number().int().min(1).default(24),
  isActive: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user!.id },
      include: { outlet: true },
    })
    if (!user?.outlet) {
      return NextResponse.json({ success: false, error: "Outlet not found" }, { status: 404 })
    }
    const outletId = user.outlet.id

    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get("active") !== "false"

    const where: any = { outletId }
    if (activeOnly) where.isActive = true

    const services = await prisma.service.findMany({
      where,
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ success: true, data: services })
  } catch (error) {
    console.error("Services GET error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user!.id },
      include: { outlet: true },
    })
    if (!user?.outlet) {
      return NextResponse.json({ success: false, error: "Outlet not found" }, { status: 404 })
    }
    const outletId = user.outlet.id

    const body = await request.json()
    const parsed = createServiceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validasi gagal", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, unit, pricePerUnit, estDurationHours, isActive } = parsed.data

    const service = await prisma.service.create({
      data: {
        outletId,
        name,
        unit,
        pricePerUnit,
        estDurationHours,
        isActive,
      },
    })

    return NextResponse.json({ success: true, data: service }, { status: 201 })
  } catch (error) {
    console.error("Services POST error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
