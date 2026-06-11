"use client"

import { useEffect } from "react"
import { TriangleAlert, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Animated icon */}
        <div className="relative">
          <div className="animate-pulse">
            <TriangleAlert className="size-24 text-destructive/40" />
          </div>
          <div className="absolute inset-0 animate-ping rounded-full bg-destructive/5 blur-xl" />
        </div>

        {/* Error code */}
        <h1 className="text-7xl font-bold tracking-tighter text-foreground">
          500
        </h1>

        {/* Message */}
        <div className="max-w-md space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Terjadi Kesalahan
          </h2>
          <p className="text-sm text-muted-foreground">
            Maaf, terjadi kesalahan yang tidak terduga. Tim kami telah
            diberitahu dan sedang memperbaikinya. Silakan coba lagi.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/50">
              Kode kesalahan: {error.digest}
            </p>
          )}
        </div>

        {/* Action */}
        <Button onClick={reset} className="flex items-center gap-2">
          <RefreshCw className="size-4" />
          Coba Lagi
        </Button>
      </div>
    </div>
  )
}
