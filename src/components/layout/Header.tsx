"use client"

import Link from "next/link"
import { useState } from "react"
import {
  Menu,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import Sidebar from "./Sidebar"

interface HeaderProps {
  title: string
  userName?: string | null
  userRole?: string
}

export default function Header({
  title,
  userName = "Pengguna",
  userRole,
}: HeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <DialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Buka menu navigasi"
              />
            }
          >
            <Menu className="size-5" />
          </DialogTrigger>
          <DialogContent className="top-0 left-0 h-full max-w-[280px] translate-x-0 translate-y-0 rounded-none p-0 ring-0 sm:max-w-[280px] data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left">
            <Sidebar userName={userName} userRole={userRole} />
          </DialogContent>
        </Dialog>

        <h1 className="text-lg font-semibold tracking-tight lg:text-xl">
          {title}
        </h1>
      </div>

      {/* Right side — User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-muted transition-colors" aria-label="Menu pengguna">
          <Avatar size="sm">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-tight">{userName}</p>
            {userRole && (
              <p className="text-xs capitalize text-muted-foreground">
                {userRole === "admin"
                  ? "Admin"
                  : userRole === "kasir"
                    ? "Kasir"
                    : "Pemilik"}
              </p>
            )}
          </div>
          <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{userName}</p>
              {userRole && (
                <p className="text-xs font-normal text-muted-foreground capitalize">
                  {userRole === "admin"
                    ? "Admin"
                    : userRole === "kasir"
                      ? "Kasir"
                      : "Pemilik"}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          </DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/settings" />}>
            <Settings className="size-4" />
            Pengaturan
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={signingOut}
            onSelect={(e: any) => {
              e.preventDefault()
              handleSignOut()
            }}
            className="flex items-center gap-2 text-destructive focus:text-destructive"
          >
            <LogOut className="size-4" />
            {signingOut ? "Keluar..." : "Keluar"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
