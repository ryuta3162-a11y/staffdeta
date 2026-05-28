import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const guestEyeRedirects: Record<string, string> = {
  "/": "/guest-eye",
  "/login": "/guest-eye/login",
  "/register": "/guest-eye/register",
  "/home": "/guest-eye/home",
  "/report": "/guest-eye/home",
};

export function middleware(request: NextRequest) {
  if (process.env.APP_MODE !== "guest-eye") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/guest-eye") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const destination = guestEyeRedirects[pathname] || "/guest-eye";
  return NextResponse.redirect(new URL(destination, request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
