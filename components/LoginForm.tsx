"use client";

import { FormEvent, useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setMessage("Enter your email and password.");
      return;
    }
    setMessage("Staff sign-in will connect here. This page is ready for that step.");
  }

  return (
    <form className="login-form" onSubmit={onSubmit}>
      <label>
        Email
        <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label>
        Password
        <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      <button className="btn-solid" type="submit">Sign in</button>
      {message ? <p className="form-note" role="status">{message}</p> : null}
    </form>
  );
}
