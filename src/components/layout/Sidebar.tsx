"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Shirt,
  CreditCard,
  TrendingDown,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Store,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface SidebarProps {
  userName?: string | null
  outletName?: string
  userRole?: string
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: ShoppingBag, label: "Pesanan", path: "/orders" },
  { icon: Users, label: "Pelanggan", path: "/customers" },
  { icon: Shirt, label: "Layanan", path: "/services" },
  { icon: CreditCard, label: "Pembayaran", path: "/payments" },
  { icon: TrendingDown, label: "Pengeluaran", path: "/expenses" },
  { icon: BarChart3, label: "Laporan", path: "/reports" },
  { icon: Settings, label: "Pengaturan", path: "/settings" },
]

export default function Sidebar({
  userName,
  outletName = "LaundryPro",
  userRole,
}: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await fetch("/api/auth/signout", { method: "POST" })
      window.location.href = "/login"
    } catch {
      window.location.href = "/login"
    }
  }

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r bg-sidebar transition-all duration-300 lg:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center border-b px-4",
          collapsed ? "justify-center" : "gap-3"
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Store className="size-4" />
        </div>
        {!collapsed && (
          <span className="text-lg font-semibold tracking-tight">
            {outletName}
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.path)
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className="size-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="px-3 pb-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center"
          aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
        >
          <ChevronLeft
            className={cn(
              "size-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      <Separator />

      {/* User Section */}
      <div className="p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2",
            collapsed ? "justify-center px-2" : ""
          )}
        >
          <Avatar size="sm">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {userName || "Pengguna"}
              </p>
              {userRole && (
                <p className="truncate text-xs text-sidebar-foreground/60 capitalize">
                  {userRole === "admin"
                    ? "Admin"
                    : userRole === "kasir"
                      ? "Kasir"
                      : "Pemilik"}
                </p>
              )}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={signingOut}
          onClick={handleSignOut}
          className={cn(
            "mt-1 w-full justify-start gap-2 text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && (
            <span>{signingOut ? "Keluar..." : "Keluar"}</span>
          )}
        </Button>
      </div>
    </aside>
  )
}
