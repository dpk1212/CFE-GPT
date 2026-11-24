import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { clerkConfigured } from "@/lib/clerk";
import { openSession, sealSession, sessionCookie, sessionShouldSlide, SESSION_COOKIE } from "@/lib/session";

async function gate(request: NextRequest) {
  const session = await openSession(request.cookies.get(SESSION_COOKIE)?.value);
  const path = request.nextUrl.pathname;
  const admin = path.startsWith("/admin");
  const judge = path.startsWith("/judge");
  if (admin && session?.role !== "admin") {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", "/admin");
    return NextResponse.redirect(login);
  }
  if (judge && session?.role !== "admin" && session?.role !== "judge") {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", "/judge");
    return NextResponse.redirect(login);
  }
  const response = NextResponse.next();
  if (session && sessionShouldSlide(session)) {
    response.cookies.set(sessionCookie(await sealSession({ email: session.email, role: session.role })));
  }
  return response;
}

const withClerk = clerkMiddleware(async (_auth, request) => gate(request));

export default function middleware(request: NextRequest, event: Parameters<typeof withClerk>[1]) {
  if (!clerkConfigured()) return gate(request);
  return withClerk(request, event);
}

export const config = { matcher: ["/", "/login", "/login/:path*", "/request", "/admin/:path*", "/judge/:path*"] };
