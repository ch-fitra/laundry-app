import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayoutClient } from "@/components/dashboard/DashboardLayoutClient"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <DashboardLayoutClient
      user={{
        name: session.user!.name || null,
        email: session.user!.email || "",
        role: (session.user as any).role || "admin",
      }}
    >
      {children}
    </DashboardLayoutClient>
  )
}
