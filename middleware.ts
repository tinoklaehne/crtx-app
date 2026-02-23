import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout", "/api/webhook/airtable"];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return false;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/static") || pathname.startsWith("/assets")) return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Allow non-auth APIs by default; user-specific APIs enforce auth themselves.
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/user")) {
    return NextResponse.next();
  }

  const hasSession = Boolean(req.cookies.get("crtx_session")?.value);

  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$).*)",
    "/",
  ],
};

