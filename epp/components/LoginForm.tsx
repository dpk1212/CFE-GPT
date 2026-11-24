"use client";

import { FormEvent, useState } from "react";
import type { Role } from "@/lib/accounts";

export function LoginForm({ next }: { next?: string }) {
  const [role, setRole] = useState<Role>(next === "/admin" ? "admin" : "judge");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string; role?: Role } | null;
    setPending(false);
    if (!response.ok || !body?.role) {
      setError(body?.error ?? "Sign-in did not complete.");
      return;
    }
    window.location.href = body.role === "admin" ? "/admin" : "/judge";
  }

  return (
    <form className="stack-form" onSubmit={onSubmit}>
      <fieldset className="role-toggle">
        <legend>Sign in as</legend>
        <div className="segment" role="group" aria-label="Sign in as">
          <button type="button" className={role === "judge" ? "on" : ""} aria-pressed={role === "judge"} onClick={() => setRole("judge")}>Judge</button>
          <button type="button" className={role === "admin" ? "on" : ""} aria-pressed={role === "admin"} onClick={() => setRole("admin")}>Admin</button>
        </div>
      </fieldset>
      <label>
        Email
        <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <label>
        Password
        <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </label>
      <button className="btn-solid" type="submit" disabled={pending}>{pending ? "Signing in" : "Sign in"}</button>
      {error ? <p className="form-note" role="status">{error}</p> : null}
    </form>
  );
}
