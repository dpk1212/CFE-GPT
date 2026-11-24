import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { JudgeWorkspace } from "@/components/JudgeWorkspace";
import { openSession, SESSION_COOKIE } from "@/lib/session";
import { readAccounts } from "@/lib/store";

export const metadata: Metadata = { title: "Fuel Judge Desk" };
export const dynamic = "force-dynamic";

export default async function JudgePage() {
  const session = await openSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || (session.role !== "judge" && session.role !== "admin")) redirect("/login?next=/judge");
  if (session.role === "judge" && session.mustChangePassword) redirect("/login/password/update");
  const account = (await readAccounts()).find((item) => item.email === session.email);
  return (
    <>
      {session.role === "admin" ? (
        <p className="view-banner view-banner-slim">
          <span>Viewing as judge</span>
          <Link href="/admin">Back to admin</Link>
        </p>
      ) : null}
      <JudgeWorkspace
        judgeName={account?.name ?? "Judge"}
        judgeEmail={session.email}
        adminView={session.role === "admin"}
      />
    </>
  );
}
