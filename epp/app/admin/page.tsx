import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminDesk, type DeskAccount } from "@/components/AdminDesk";
import { openSession, SESSION_COOKIE } from "@/lib/session";
import { readAccounts } from "@/lib/store";

export const metadata: Metadata = { title: "Approvals" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await openSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || session.role !== "admin") redirect("/login?next=/admin");
  const accounts = await readAccounts();
  const visible: DeskAccount[] = accounts.map(({ passwordHash: _password, ...account }) => account);
  return (
    <article className="sheet">
      <header className="sheet-head">
        <p className="eyebrow">Admin</p>
        <h1>Access requests</h1>
        <p>Approve judge accounts. Add another admin when the team needs one.</p>
      </header>
      <AdminDesk accounts={visible} />
    </article>
  );
}
