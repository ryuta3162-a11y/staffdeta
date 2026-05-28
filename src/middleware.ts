import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const guestEyeRewrites: Record<string, string> = {
  "/": "/guest-eye",
  "/login": "/guest-eye/login",
  "/register": "/guest-eye/register",
  "/home": "/guest-eye/home",
  "/report": "/guest-eye/home",
};

const guestEyeCleanUrls: Record<string, string> = {
  "/guest-eye": "/",
  "/guest-eye/login": "/login",
  "/guest-eye/register": "/register",
  "/guest-eye/home": "/home",
};

export function middleware(request: NextRequest) {
  if (process.env.APP_MODE !== "guest-eye") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (guestEyeCleanUrls[pathname]) {
    return NextResponse.redirect(
      new URL(guestEyeCleanUrls[pathname], request.url),
    );
  }

  if (pathname.startsWith("/guest-eye/api/")) {
    const cleanPath = pathname.replace(/^\/guest-eye/, "");
    return NextResponse.redirect(new URL(cleanPath, request.url));
  }

  if (pathname.startsWith("/guest-eye")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.rewrite(
      new URL(`/guest-eye${pathname}`, request.url),
    );
  }

  const rewritePath = guestEyeRewrites[pathname];
  if (rewritePath) {
    return NextResponse.rewrite(new URL(rewritePath, request.url));
  }

  return NextResponse.rewrite(new URL("/guest-eye", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
