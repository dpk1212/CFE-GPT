import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { GOOGLE_SCOPES, googleConfigured, googlePublicOrigin, googleRedirectUri } from "@/lib/googleAuth";

export const runtime = "nodejs";

const STATE_COOKIE = "epp_google_state";

export async function GET(request: Request) {
  const host = request.headers.get("x-forwarded-host") || new URL(request.url).host;
  const origin = googlePublicOrigin(host);
  if (!googleConfigured()) {
    return NextResponse.redirect(`${origin}/login?notice=google-unavailable`);
  }
  const redirectUri = googleRedirectUri(host);
  const state = randomBytes(24).toString("base64url");
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    state,
  });
  const response = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  response.cookies.set({
    name: STATE_COOKIE,
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return response;
}
