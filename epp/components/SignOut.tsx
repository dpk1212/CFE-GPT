"use client";

import { useClerk } from "@clerk/nextjs";
import { APP_URL } from "@/lib/appUrl";

function leaveUrl() {
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return `${window.location.origin}/`;
  return APP_URL;
}

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
        window.location.href = leaveUrl();
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
          await signOut({ redirectUrl: leaveUrl() });
        } catch {
          window.location.href = leaveUrl();
        }
      }}
    >
      Sign out
    </button>
  );
}
