import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { APP_URL, productionCanonicalUrl } from "@/lib/appUrl";
import { clerkConfigured } from "@/lib/clerk";
import { openSession, sealSession, sessionCookie, sessionShouldSlide, SESSION_COOKIE } from "@/lib/session";

function requestHost(request: NextRequest) {
  return request.headers.get("x-forwarded-host") || request.headers.get("host");
}

function canonicalRedirect(request: NextRequest) {
  const path = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const target = productionCanonicalUrl(requestHost(request), path);
  if (!target) return null;
  return NextResponse.redirect(target, 308);
}

function appBase(request: NextRequest) {
  return process.env.VERCEL_ENV === "production" ? APP_URL : request.nextUrl.origin;
}

function loginRedirect(request: NextRequest, next: "/admin" | "/judge") {
  const login = new URL("/login", appBase(request));
  login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

async function gate(request: NextRequest) {
  const session = await openSession(request.cookies.get(SESSION_COOKIE)?.value);
  const path = request.nextUrl.pathname;
  const admin = path.startsWith("/admin");
  const judge = path.startsWith("/judge");
  if (admin && session?.role !== "admin") return loginRedirect(request, "/admin");
  if (judge && session?.role !== "admin" && session?.role !== "judge") return loginRedirect(request, "/judge");
  const response = NextResponse.next();
  if (session && sessionShouldSlide(session)) {
    response.cookies.set(sessionCookie(await sealSession({ email: session.email, role: session.role })));
  }
  return response;
}

const withClerk = clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const path = request.nextUrl.pathname;
  const session = await openSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (userId && !session && !path.startsWith("/login")) {
    const next = request.nextUrl.searchParams.get("next");
    const dest = new URL("/login/continue", appBase(request));
    if (next === "/admin" || next === "/judge") dest.searchParams.set("next", next);
    return NextResponse.redirect(dest);
  }
  return gate(request);
});

export default function middleware(request: NextRequest, event: Parameters<typeof withClerk>[1]) {
  const hop = canonicalRedirect(request);
  if (hop) return hop;
  if (!clerkConfigured()) return gate(request);
  return withClerk(request, event);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
