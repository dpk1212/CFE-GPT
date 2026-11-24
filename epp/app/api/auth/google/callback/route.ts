import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { admitGoogleIdentity } from "@/lib/accounts";
import { googleConfigured, googlePublicOrigin, googleRedirectUri } from "@/lib/googleAuth";
import { hashPassword } from "@/lib/password";
import { sealSession, sessionCookie } from "@/lib/session";
import { updateAccounts } from "@/lib/store";

export const runtime = "nodejs";

const STATE_COOKIE = "epp_google_state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = googlePublicOrigin(request.headers.get("x-forwarded-host") || url.host);
  const fail = (notice: string) => {
    const response = NextResponse.redirect(`${origin}/login?notice=${notice}`);
    response.cookies.set({ name: STATE_COOKIE, value: "", path: "/", maxAge: 0 });
    return response;
  };
  if (!googleConfigured()) return fail("google-unavailable");
  if (url.searchParams.get("error")) return fail("google-denied");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const saved = (await cookies()).get(STATE_COOKIE)?.value;
  if (!code || !state || !saved || state !== saved) return fail("google-failed");

  const host = request.headers.get("x-forwarded-host") || url.host;
  const redirectUri = googleRedirectUri(host);
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
      client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const token = (await tokenResponse.json().catch(() => null)) as { access_token?: string } | null;
  if (!tokenResponse.ok || !token?.access_token) return fail("google-failed");

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const profile = (await profileResponse.json().catch(() => null)) as {
    email?: string;
    email_verified?: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
  } | null;
  if (!profileResponse.ok || !profile?.email || profile.email_verified === false) return fail("google-unverified");

  const name = [profile.name, profile.given_name, profile.family_name].find((value) => value && value.trim().length >= 2)?.trim()
    || profile.email.split("@")[0]?.replace(/[._-]+/g, " ")
    || "New judge";
  let outcome: ReturnType<typeof admitGoogleIdentity> | undefined;
  await updateAccounts((accounts) => {
    outcome = admitGoogleIdentity(
      accounts,
      { name, email: profile.email!, passwordHash: hashPassword(randomBytes(32).toString("hex")) },
      new Date().toISOString(),
    );
    return outcome.accounts;
  });
  if (!outcome || "error" in outcome || outcome.outcome !== "approved") {
    return fail(outcome && "error" in outcome ? "google-failed" : "pending");
  }

  const response = NextResponse.redirect(`${origin}/${outcome.account.role === "admin" ? "admin" : "judge"}`);
  response.cookies.set(sessionCookie(await sealSession({ email: outcome.account.email, role: outcome.account.role })));
  response.cookies.set({ name: STATE_COOKIE, value: "", path: "/", maxAge: 0 });
  return response;
}
