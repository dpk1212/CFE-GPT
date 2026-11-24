import { NextResponse, type NextRequest } from "next/server";
import { openSession, SESSION_COOKIE } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const session = await openSession(request.cookies.get(SESSION_COOKIE)?.value);
  const admin = request.nextUrl.pathname.startsWith("/admin");
  const allowed = admin ? session?.role === "admin" : session?.role === "judge";
  if (allowed) return NextResponse.next();
  const login = new URL("/login", request.url);
  login.searchParams.set("next", admin ? "/admin" : "/judge");
  return NextResponse.redirect(login);
}

export const config = { matcher: ["/admin/:path*", "/judge/:path*"] };
