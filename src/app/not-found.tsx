import Link from "next/link"
import { Home, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Animated icon */}
        <div className="relative">
          <div className="animate-bounce">
            <SearchX className="size-24 text-muted-foreground/30" />
          </div>
          <div className="absolute inset-0 animate-pulse rounded-full bg-primary/5 blur-xl" />
        </div>

        {/* Error code */}
        <h1 className="text-8xl font-bold tracking-tighter text-foreground">
          404
        </h1>

        {/* Message */}
        <div className="max-w-md space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-sm text-muted-foreground">
            Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau
            tidak pernah ada. Periksa kembali URL atau kembali ke beranda.
          </p>
        </div>

        {/* Action */}
        <Button render={<Link href="/dashboard" />} className="flex items-center gap-2">
          <Home className="size-4" />
          Kembali ke Beranda
        </Button>
      </div>
    </div>
  )
}
