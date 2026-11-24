export type Role = "admin" | "judge";
export type Status = "pending" | "approved" | "declined";

export type Account = {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: Status;
  createdAt: string;
  reviewedAt: string | null;
};

export const BOOTSTRAP_ADMIN_EMAIL = "kolnitd@umich.edu";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function bootstrapAdmin(accounts: Account[], passwordHash: string, now: string) {
  if (accounts.some((account) => account.email === BOOTSTRAP_ADMIN_EMAIL)) return accounts;
  return [
    ...accounts,
    {
      name: "Dale Kolnitys",
      email: BOOTSTRAP_ADMIN_EMAIL,
      passwordHash,
      role: "admin" as const,
      status: "approved" as const,
      createdAt: now,
      reviewedAt: now,
    },
  ];
}

export function requestJudge(accounts: Account[], input: { name: string; email: string; passwordHash: string }, now: string) {
  const name = input.name.trim().replace(/\s+/g, " ");
  const email = normalizeEmail(input.email);
  if (name.length < 2 || !email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
    return { accounts, error: "Enter your name and a valid email." };
  }
  const existing = accounts.find((account) => account.email === email);
  if (existing?.status === "approved") return { accounts, error: "This email already has access. Log in instead." };
  if (existing?.status === "pending") return { accounts, error: "This request is already waiting for an admin." };
  const next: Account = {
    name,
    email,
    passwordHash: input.passwordHash,
    role: "judge",
    status: "pending",
    createdAt: now,
    reviewedAt: null,
  };
  return { accounts: [...accounts.filter((account) => account.email !== email), next] };
}

export function reviewRequest(accounts: Account[], email: string, action: "approve" | "decline", now: string) {
  const target = normalizeEmail(email);
  const existing = accounts.find((account) => account.email === target);
  if (!existing || existing.status !== "pending" || existing.role !== "judge") {
    return { accounts, error: "That request is no longer waiting." };
  }
  return {
    accounts: accounts.map((account) =>
      account.email === target
        ? { ...account, status: action === "approve" ? ("approved" as const) : ("declined" as const), reviewedAt: now }
        : account,
    ),
  };
}

export function createAdmin(accounts: Account[], input: { name: string; email: string; passwordHash: string }, now: string) {
  const name = input.name.trim().replace(/\s+/g, " ");
  const email = normalizeEmail(input.email);
  if (name.length < 2 || !email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
    return { accounts, error: "Enter a name and a valid email." };
  }
  if (accounts.some((account) => account.email === email)) return { accounts, error: "That email already has an account." };
  const next: Account = {
    name,
    email,
    passwordHash: input.passwordHash,
    role: "admin",
    status: "approved",
    createdAt: now,
    reviewedAt: now,
  };
  return { accounts: [...accounts, next] };
}

export function admitGoogleIdentity(
  accounts: Account[],
  input: { name: string; email: string; passwordHash: string },
  now: string,
) {
  const name = input.name.trim().replace(/\s+/g, " ");
  const email = normalizeEmail(input.email);
  if (name.length < 2 || !email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
    return { accounts, error: "Google did not return a usable name and email." };
  }
  const existing = accounts.find((account) => account.email === email);
  if (existing?.status === "approved") return { accounts, outcome: "approved" as const, account: existing };
  if (existing?.status === "pending" || existing?.role === "admin") return { accounts, outcome: "pending" as const };
  const requested = requestJudge(accounts, { name, email, passwordHash: input.passwordHash }, now);
  if (requested.error) return { accounts, error: requested.error };
  return { accounts: requested.accounts, outcome: "pending" as const };
}

export function loginResult(accounts: Account[], email: string, passwordMatches: boolean, role: Role) {
  const account = accounts.find((item) => item.email === normalizeEmail(email));
  if (!account || !passwordMatches) return { ok: false as const, error: "Email or password is incorrect." };
  if (account.status === "pending") return { ok: false as const, error: "An admin has not approved this account yet." };
  if (account.status === "declined") return { ok: false as const, error: "This request was declined. Submit a new request if you still need access." };
  if (account.role !== role) {
    return {
      ok: false as const,
      error: account.role === "admin" ? "This account is an admin. Switch the toggle to Admin." : "This account is a judge. Switch the toggle to Judge.",
    };
  }
  return { ok: true as const, account };
}
