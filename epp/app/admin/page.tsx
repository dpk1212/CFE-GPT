import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminDesk, type DeskAccount } from "@/components/AdminDesk";
import { FuelConfigPanel } from "@/components/FuelConfigPanel";
import { openSession, SESSION_COOKIE } from "@/lib/session";
import { readAccounts } from "@/lib/store";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await openSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || session.role !== "admin") redirect("/login?next=/admin");
  const accounts = await readAccounts();
  const visible: DeskAccount[] = accounts.map(({ passwordHash: _password, ...account }) => account);
  return (
    <article className="sheet admin-sheet">
      <header className="sheet-head">
        <p className="eyebrow">Admin</p>
        <h1>Entrepreneurial Practice Programs</h1>
        <p>Approve judge access and configure the Fuel review desk judges see.</p>
      </header>
      <AdminDesk accounts={visible} />
      <hr className="admin-rule" />
      <FuelConfigPanel />
    </article>
  );
}
