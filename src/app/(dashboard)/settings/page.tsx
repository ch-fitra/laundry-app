"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/page-header"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { SaveIcon, KeyIcon, BellIcon, StoreIcon } from "lucide-react"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("outlet")

  // Outlet state
  const [outletName, setOutletName] = useState("")
  const [outletAddress, setOutletAddress] = useState("")
  const [outletPhone, setOutletPhone] = useState("")
  const [outletWhatsapp, setOutletWhatsapp] = useState("")
  const [loadingOutlet, setLoadingOutlet] = useState(true)

  // Account state
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [loadingUser, setLoadingUser] = useState(true)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Notification state
  const [fonnteToken, setFonnteToken] = useState("")
  const [notifEnabled, setNotifEnabled] = useState(true)

  useEffect(() => {
    fetchOutlet()
    fetchUser()
  }, [])

  async function fetchOutlet() {
    try {
      const res = await fetch("/api/settings/outlet")
      const json = await res.json()
      if (json.success && json.data) {
        setOutletName(json.data.name || "")
        setOutletAddress(json.data.address || "")
        setOutletPhone(json.data.phone || "")
        setOutletWhatsapp(json.data.whatsapp || "")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingOutlet(false)
    }
  }

  async function fetchUser() {
    try {
      const res = await fetch("/api/settings/profile")
      const json = await res.json()
      if (json.success && json.data) {
        setUserName(json.data.name || "")
        setUserEmail(json.data.email || "")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingUser(false)
    }
  }

  async function saveOutlet(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch("/api/settings/outlet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: outletName,
          address: outletAddress,
          phone: outletPhone,
          whatsapp: outletWhatsapp,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Profil outlet berhasil disimpan")
      } else {
        toast.error(json.error || "Gagal menyimpan")
      }
    } catch (err) {
      toast.error("Terjadi kesalahan")
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userName }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Profil berhasil diperbarui")
      } else {
        toast.error(json.error || "Gagal menyimpan")
      }
    } catch (err) {
      toast.error("Terjadi kesalahan")
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("Password baru tidak cocok")
      return
    }
    try {
      const res = await fetch("/api/settings/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword: confirmPassword,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Password berhasil diubah")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast.error(json.error || "Gagal mengubah password")
      }
    } catch (err) {
      toast.error("Terjadi kesalahan")
    }
  }

  async function saveNotifications(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fonnteToken,
          enabled: notifEnabled,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Pengaturan notifikasi disimpan")
      } else {
        toast.error(json.error || "Gagal menyimpan")
      }
    } catch (err) {
      toast.error("Terjadi kesalahan")
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <PageHeader title="Pengaturan" description="Kelola profil outlet, akun, dan notifikasi" />

      <Tabs value={activeTab} onValueChange={(v) => v && setActiveTab(v)}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="outlet">
            <StoreIcon className="size-4" />
            Profil Outlet
          </TabsTrigger>
          <TabsTrigger value="account">
            <KeyIcon className="size-4" />
            Akun
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <BellIcon className="size-4" />
            Notifikasi
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: OUTLET ── */}
        <TabsContent value="outlet">
          <Card>
            <CardHeader>
              <CardTitle>Profil Outlet</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingOutlet ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  Memuat...
                </div>
              ) : (
                <form onSubmit={saveOutlet} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="outletName">Nama Outlet</Label>
                    <Input
                      id="outletName"
                      value={outletName}
                      onChange={(e) => setOutletName(e.target.value)}
                      placeholder="Nama laundry"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="outletAddress">Alamat</Label>
                    <Textarea
                      id="outletAddress"
                      value={outletAddress}
                      onChange={(e) => setOutletAddress(e.target.value)}
                      placeholder="Alamat outlet"
                      rows={3}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="outletPhone">No. Telepon</Label>
                    <Input
                      id="outletPhone"
                      value={outletPhone}
                      onChange={(e) => setOutletPhone(e.target.value)}
                      placeholder="0812xxxx"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="outletWhatsapp">No. WhatsApp (Fonnte)</Label>
                    <Input
                      id="outletWhatsapp"
                      value={outletWhatsapp}
                      onChange={(e) => setOutletWhatsapp(e.target.value)}
                      placeholder="0812xxxx"
                    />
                  </div>
                  <Separator />
                  <Button type="submit" className="self-start">
                    <SaveIcon className="size-4" />
                    Simpan
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 2: ACCOUNT ── */}
        <TabsContent value="account">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Akun</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUser ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    Memuat...
                  </div>
                ) : (
                  <form onSubmit={saveProfile} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="userName">Nama</Label>
                      <Input
                        id="userName"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="userEmail">Email</Label>
                      <Input
                        id="userEmail"
                        value={userEmail}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email tidak dapat diubah
                      </p>
                    </div>
                    <Separator />
                    <Button type="submit" className="self-start">
                      <SaveIcon className="size-4" />
                      Simpan
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ubah Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={changePassword} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="currentPassword">Password Saat Ini</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="newPassword">Password Baru</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Separator />
                  <Button type="submit" className="self-start" variant="outline">
                    <KeyIcon className="size-4" />
                    Ubah Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── TAB 3: NOTIFICATIONS ── */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Notifikasi WhatsApp</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveNotifications} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fonnteToken">Fonnte Token</Label>
                  <Input
                    id="fonnteToken"
                    type="password"
                    value={fonnteToken}
                    onChange={(e) => setFonnteToken(e.target.value)}
                    placeholder="Masukkan token Fonnte"
                  />
                  <p className="text-xs text-muted-foreground">
                    Dapatkan token dari{" "}
                    <a
                      href="https://fonnte.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      fonnte.com
                    </a>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notifEnabled"
                    checked={notifEnabled}
                    onChange={(e) => setNotifEnabled(e.target.checked)}
                    className="size-4"
                  />
                  <Label htmlFor="notifEnabled">Aktifkan notifikasi WhatsApp otomatis</Label>
                </div>
                <Separator />
                <Button type="submit" className="self-start">
                  <SaveIcon className="size-4" />
                  Simpan Pengaturan
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
