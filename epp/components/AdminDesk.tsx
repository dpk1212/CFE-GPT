"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type DeskAccount = {
  name: string;
  email: string;
  role: "admin" | "judge";
  status: "pending" | "approved" | "declined";
  createdAt: string;
  reviewedAt?: string | null;
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

export function AdminAccounts({ accounts, view }: { accounts: DeskAccount[]; view: "judges" | "admins" }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const pending = accounts.filter((account) => account.role === "judge" && account.status === "pending");
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

  async function addJudge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy("add-judge");
    setMessage("");
    const response = await fetch("/api/admin/judges", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: data.get("email"), name: data.get("name") }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setBusy("");
    if (!response.ok) {
      setMessage(body?.error ?? "The judge was not added.");
      return;
    }
    form.reset();
    setMessage("Judge added. They can sign in with that email.");
    router.refresh();
  }

  async function removeJudgeAccount(email: string) {
    setBusy(email);
    setMessage("");
    const response = await fetch("/api/admin/judges", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, action: "remove" }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setBusy("");
    if (!response.ok) {
      setMessage(body?.error ?? "That judge was not removed.");
      return;
    }
    setMessage("Judge removed. They will need approval before they can sign in again.");
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
    dialogRef.current?.close();
    setMessage("Admin account created. They can sign in now.");
    router.refresh();
  }

  if (view === "judges") {
    return (
      <div className="console-stack">
        <section>
          <h2>Waiting for approval <span className="count-badge">{pending.length}</span></h2>
          {pending.length === 0 ? <p className="quiet">No judge requests are waiting.</p> : (
            <div className="console-table-wrap">
              <table className="console-table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Requested</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((account) => (
                    <tr key={account.email}>
                      <th scope="row">{account.name}</th>
                      <td>{account.email}</td>
                      <td>{when(account.createdAt)} ET</td>
                      <td className="row-actions">
                        <button className="btn-solid" type="button" disabled={busy === account.email} onClick={() => review(account.email, "approve")}>Approve</button>
                        <button className="btn-line" type="button" disabled={busy === account.email} onClick={() => review(account.email, "decline")}>Decline</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section>
          <h2>Add a judge</h2>
          <p className="quiet">An added email is approved immediately. When that person signs in with it, they open the judge desk without requesting access.</p>
          <form className="stack-form" onSubmit={addJudge}>
            <label>
              Email
              <input name="email" type="email" required autoComplete="off" />
            </label>
            <label>
              Name (optional)
              <input name="name" autoComplete="off" />
            </label>
            <button className="btn-solid" type="submit" disabled={busy === "add-judge"}>{busy === "add-judge" ? "Saving" : "Add judge"}</button>
          </form>
        </section>
        <section>
          <h2>Approved judges <span className="count-badge">{judges.length}</span></h2>
          {judges.length === 0 ? <p className="quiet">No judges are approved yet.</p> : (
            <div className="console-table-wrap">
              <table className="console-table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Since</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {judges.map((account) => (
                    <tr key={account.email}>
                      <th scope="row">{account.name}</th>
                      <td>{account.email}</td>
                      <td>{when(account.reviewedAt || account.createdAt)} ET</td>
                      <td className="row-actions">
                        <button className="btn-line" type="button" disabled={busy === account.email} onClick={() => removeJudgeAccount(account.email)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        {message ? <p className="form-note" role="status">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className="console-stack">
      <div className="section-bar">
        <h2>Admins <span className="count-badge">{admins.length}</span></h2>
        <button className="btn" type="button" onClick={() => dialogRef.current?.showModal()}>Add an admin</button>
      </div>
      <div className="console-table-wrap">
        <table className="console-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((account) => (
              <tr key={account.email}>
                <th scope="row">{account.name}</th>
                <td>{account.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dialog ref={dialogRef} className="confirm-dialog">
        <form className="stack-form" onSubmit={createAdminAccount}>
          <h3>Add an admin</h3>
          <label>Name<input name="name" required /></label>
          <label>Email<input name="email" type="email" required /></label>
          <label>Password<input name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
          <div className="judge-form-actions">
            <button className="btn-line" type="button" onClick={() => dialogRef.current?.close()}>Cancel</button>
            <button className="btn-solid" type="submit" disabled={busy === "create"}>{busy === "create" ? "Saving" : "Create admin"}</button>
          </div>
        </form>
      </dialog>
      {message ? <p className="form-note" role="status">{message}</p> : null}
    </div>
  );
}
