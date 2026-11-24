import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { openSession, SESSION_COOKIE } from "@/lib/session";
import { readAccounts } from "@/lib/store";

export const metadata: Metadata = { title: "Judge" };
export const dynamic = "force-dynamic";

export default async function JudgePage() {
  const session = await openSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || session.role !== "judge") redirect("/login?next=/judge");
  const account = (await readAccounts()).find((item) => item.email === session.email);
  return (
    <article className="sheet">
      <header className="sheet-head">
        <p className="eyebrow">Judge</p>
        <h1>{account?.name ?? "Welcome"}</h1>
        <p>You are signed in. Scoring and review tools will be added here. The landing page remains available from the header.</p>
      </header>
    </article>
  );
}
