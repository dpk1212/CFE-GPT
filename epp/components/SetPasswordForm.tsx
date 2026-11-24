"use client";

import { FormEvent, useState } from "react";

export function SetPasswordForm({ forced }: { forced: boolean }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords do not match.");
      return;
    }
    setPending(true);
    const response = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, confirm }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setPending(false);
      setError(body?.error ?? "The password could not be saved.");
      return;
    }
    window.location.href = "/judge";
  }

  return (
    <form className="stack-form" onSubmit={onSubmit}>
      <p className="quiet">
        {forced
          ? "This sign-in used a temporary password. Choose a new one before opening the judge desk."
          : "Choose a new password for the password sign-in. Google sign-in keeps working."}
      </p>
      <label>
        New password
        <input name="password" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      <label>
        Confirm password
        <input name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      <p className="quiet">At least 8 characters.</p>
      {error ? <p className="form-note" role="status">{error}</p> : null}
      <button className="btn-solid" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save password"}
      </button>
    </form>
  );
}
