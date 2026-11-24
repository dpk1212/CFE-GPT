import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { JudgeWorkspace } from "@/components/JudgeWorkspace";
import { openSession, SESSION_COOKIE } from "@/lib/session";
import { readAccounts } from "@/lib/store";

export const metadata: Metadata = { title: "Fuel Judge Desk" };
export const dynamic = "force-dynamic";

export default async function JudgePage() {
  const session = await openSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || session.role !== "judge") redirect("/login?next=/judge");
  const account = (await readAccounts()).find((item) => item.email === session.email);
  return (
    <JudgeWorkspace
      judgeName={account?.name ?? "Judge"}
      judgeEmail={session.email}
    />
  );
}
