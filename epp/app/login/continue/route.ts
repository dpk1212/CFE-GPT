import { randomBytes } from "node:crypto";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { admitGoogleIdentity } from "@/lib/accounts";
import { clerkConfigured } from "@/lib/clerk";
import { googlePublicOrigin } from "@/lib/googleAuth";
import { hashPassword } from "@/lib/password";
import { sealSession, sessionCookie } from "@/lib/session";
import { updateAccounts } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = googlePublicOrigin(request.headers.get("x-forwarded-host") || url.host);
  if (!clerkConfigured()) return NextResponse.redirect(`${origin}/login/password`);
  const { userId } = await auth();
  if (!userId) return NextResponse.redirect(`${origin}/login`);
  const user = await currentUser();
  const primary = user?.primaryEmailAddress;
  if (!primary?.emailAddress || primary.verification?.status === "unverified") {
    return NextResponse.redirect(`${origin}/login?notice=google-unverified`);
  }
  const name = [user?.fullName, [user?.firstName, user?.lastName].filter(Boolean).join(" ")]
    .find((value) => value && value.trim().length >= 2)
    ?.trim()
    || primary.emailAddress.split("@")[0]?.replace(/[._-]+/g, " ")
    || "New judge";
  let outcome: ReturnType<typeof admitGoogleIdentity> | undefined;
  await updateAccounts((accounts) => {
    outcome = admitGoogleIdentity(
      accounts,
      { name, email: primary.emailAddress, passwordHash: hashPassword(randomBytes(32).toString("hex")) },
      new Date().toISOString(),
    );
    return outcome.accounts;
  });
  if (!outcome || "error" in outcome || outcome.outcome !== "approved") {
    return NextResponse.redirect(`${origin}/login/pending`);
  }
  const requested = url.searchParams.get("next");
  const role = outcome.account.role;
  const destination = requested === "/judge" || (requested === "/admin" && role === "admin")
    ? requested
    : role === "admin" ? "/admin" : "/judge";
  const response = NextResponse.redirect(`${origin}${destination}`);
  response.cookies.set(sessionCookie(await sealSession({ email: outcome.account.email, role })));
  return response;
}
