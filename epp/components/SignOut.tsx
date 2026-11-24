"use client";

import { useClerk } from "@clerk/nextjs";

export function SignOut({ clerk = false }: { clerk?: boolean }) {
  if (clerk) return <ClerkSignOut />;
  return <PasswordSignOut />;
}

function PasswordSignOut() {
  return (
    <button
      className="nav-button"
      type="button"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
      }}
    >
      Sign out
    </button>
  );
}

function ClerkSignOut() {
  const { signOut } = useClerk();
  return (
    <button
      className="nav-button"
      type="button"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        try {
          await signOut({ redirectUrl: "/" });
        } catch {
          window.location.href = "/";
        }
      }}
    >
      Sign out
    </button>
  );
}
