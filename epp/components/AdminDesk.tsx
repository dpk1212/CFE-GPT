"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export type DeskAccount = {
  name: string;
  email: string;
  role: "admin" | "judge";
  status: "pending" | "approved" | "declined";
  createdAt: string;
};

function when(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AdminDesk({ accounts }: { accounts: DeskAccount[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const pending = accounts.filter((account) => account.status === "pending");
  const judges = accounts.filter((account) => account.role === "judge" && account.status === "approved");
  const admins = accounts.filter((account) => account.role === "admin" && account.status === "approved");

  async function review(email: string, action: "approve" | "decline") {
    setBusy(email);
    setMessage("");
    const response = await fetch("/api/admin/requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, action }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setBusy("");
    if (!response.ok) {
      setMessage(body?.error ?? "That update did not save.");
      return;
    }
    router.refresh();
  }

  async function createAdminAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy("create");
    setMessage("");
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: data.get("name"), email: data.get("email"), password: data.get("password") }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setBusy("");
    if (!response.ok) {
      setMessage(body?.error ?? "The admin account was not created.");
      return;
    }
    form.reset();
    setMessage("Admin account created. They can sign in now.");
    router.refresh();
  }

  return (
    <div className="desk">
      <section>
        <h2>Waiting for approval</h2>
        {pending.length === 0 ? <p className="quiet">No judge requests are waiting.</p> : null}
        <ul className="request-list">
          {pending.map((account) => (
            <li key={account.email}>
              <div>
                <strong>{account.name}</strong>
                <span>{account.email}</span>
                <em>Requested {when(account.createdAt)} ET</em>
              </div>
              <div className="row-actions">
                <button className="btn-solid" type="button" disabled={busy === account.email} onClick={() => review(account.email, "approve")}>Approve</button>
                <button className="btn-line" type="button" disabled={busy === account.email} onClick={() => review(account.email, "decline")}>Decline</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Approved judges</h2>
        {judges.length === 0 ? <p className="quiet">No judges are approved yet.</p> : (
          <ul className="plain-list">
            {judges.map((account) => <li key={account.email}><strong>{account.name}</strong> {account.email}</li>)}
          </ul>
        )}
      </section>
      <section>
        <h2>Admins</h2>
        <ul className="plain-list">
          {admins.map((account) => <li key={account.email}><strong>{account.name}</strong> {account.email}</li>)}
        </ul>
        <form className="stack-form compact" onSubmit={createAdminAccount}>
          <h3>Add an admin</h3>
          <label>Name<input name="name" required /></label>
          <label>Email<input name="email" type="email" required /></label>
          <label>Password<input name="password" type="password" minLength={8} required /></label>
          <button className="btn-solid" type="submit" disabled={busy === "create"}>{busy === "create" ? "Saving" : "Create admin"}</button>
        </form>
      </section>
      {message ? <p className="form-note" role="status">{message}</p> : null}
    </div>
  );
}
