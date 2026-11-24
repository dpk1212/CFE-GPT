import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SetPasswordForm } from "@/components/SetPasswordForm";
import { openSession, SESSION_COOKIE } from "@/lib/session";

export const metadata: Metadata = { title: "Set your password" };
export const dynamic = "force-dynamic";

export default async function SetPasswordPage() {
  const session = await openSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) redirect("/login/password?next=/judge");
  if (session.role !== "judge") redirect("/admin");
  const forced = session.mustChangePassword === true;
  return (
    <article className="gate">
      <section className="panel login-panel">
        <p className="eyebrow">Center for Entrepreneurship</p>
        <h1>{forced ? "Set your password" : "Change your password"}</h1>
        <SetPasswordForm forced={forced} />
        {forced ? null : (
          <p className="quiet">
            <Link href="/judge">Back to the desk</Link>
          </p>
        )}
      </section>
    </article>
  );
}
