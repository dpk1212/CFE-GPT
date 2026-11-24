"use client";

import { FormEvent, useState } from "react";

export function RequestForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/access/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setPending(false);
    if (!response.ok) {
      setError(body?.error ?? "The request did not go through.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return <p className="form-note success" role="status">Request received. An admin will review it. You can log in as a judge after it is approved.</p>;
  }

  return (
    <form className="stack-form" onSubmit={onSubmit}>
      <p className="quiet">This request is for judge access. Any email is fine. An admin approves it before the account can sign in.</p>
      <label>
        Name
        <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
      </label>
      <label>
        Email
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
      </label>
      <label>
        Password
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required />
      </label>
      <button className="btn-solid" type="submit" disabled={pending}>{pending ? "Sending" : "Request access"}</button>
      {error ? <p className="form-note" role="status">{error}</p> : null}
    </form>
  );
}
