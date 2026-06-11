import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths — no auth check
  const publicPaths = [
    "/login",
    "/register",
    "/api/auth",
  ]

  const isPublic = publicPaths.some((path) => pathname.startsWith(path))
  const isApiAuth = pathname.startsWith("/api/auth")

  // Skip auth check for public pages and API auth routes
  if (isPublic || isApiAuth) {
    return NextResponse.next()
  }

  // Verify session for protected routes
  const session = await auth()

  // Redirect to login if not authenticated
  if (!session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and favicon
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
