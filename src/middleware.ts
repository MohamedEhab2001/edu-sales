import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-constants";
import { verifySession } from "@/lib/token";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isLogin = request.nextUrl.pathname === "/login";
  const isAuthApi = request.nextUrl.pathname.startsWith("/api/auth/");

  let authenticated = false;
  if (token) {
    try {
      await verifySession(token);
      authenticated = true;
    } catch {
      authenticated = false;
    }
  }

  if (isLogin && authenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isLogin && !isAuthApi && !authenticated) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
