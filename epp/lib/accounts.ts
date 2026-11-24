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
  /** The person knows this password. A random hash for Google sign-in does not count. */
  passwordChosen?: boolean;
  /** An admin set this password. The judge must replace it before opening the desk. */
  mustChangePassword?: boolean;
};

export const BOOTSTRAP_ADMIN_EMAIL = "kolnitd@umich.edu";
/** Dale signs in with this Google account. It is an admin, same as the umich address. */
export const DALE_GOOGLE_ADMIN_EMAIL = "kolnitd12@gmail.com";

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

export function requestJudge(
  accounts: Account[],
  input: { name: string; email: string; passwordHash: string; passwordChosen?: boolean },
  now: string,
) {
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
    passwordChosen: input.passwordChosen !== false,
    mustChangePassword: false,
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

function validEmail(email: string) {
  return email.includes("@") && !email.startsWith("@") && !email.endsWith("@") && !email.includes(" ");
}

function judgeDisplayName(email: string, name: string | undefined, existing?: Account) {
  const cleaned = (name ?? "").trim().replace(/\s+/g, " ");
  if (cleaned.length >= 2) return cleaned;
  if (existing && existing.name.trim().length >= 2) return existing.name;
  const local = email.split("@")[0]?.replace(/[._+-]+/g, " ").trim() ?? "";
  const titled = local.replace(/\b\w/g, (letter) => letter.toUpperCase());
  return titled.length >= 2 ? titled : "Judge";
}

/** An admin adds a judge who is approved immediately. No request email is sent. */
export function addApprovedJudge(
  accounts: Account[],
  input: { name?: string; email: string; passwordHash: string; setPassword?: boolean },
  now: string,
) {
  const email = normalizeEmail(input.email);
  if (!validEmail(email)) return { accounts, error: "Enter a valid email." };
  if (email === BOOTSTRAP_ADMIN_EMAIL || email === DALE_GOOGLE_ADMIN_EMAIL) {
    return { accounts, error: "That email is an admin." };
  }
  const existing = accounts.find((account) => account.email === email);
  if (existing?.role === "admin") return { accounts, error: "That email is an admin." };
  if (existing?.role === "judge" && existing.status === "approved") {
    return { accounts, error: "This judge is already approved." };
  }
  const account: Account = {
    name: judgeDisplayName(email, input.name, existing),
    email,
    passwordHash: input.setPassword ? input.passwordHash : existing?.passwordHash || input.passwordHash,
    role: "judge",
    status: "approved",
    createdAt: existing?.createdAt || now,
    reviewedAt: now,
    passwordChosen: input.setPassword ? true : Boolean(existing?.passwordChosen),
    mustChangePassword: input.setPassword ? true : Boolean(existing?.mustChangePassword),
  };
  const next = existing
    ? accounts.map((item) => (item.email === email ? account : item))
    : [...accounts, account];
  return { accounts: next, account };
}

export function resetJudgePassword(accounts: Account[], email: string, passwordHash: string, now: string) {
  const target = normalizeEmail(email);
  const existing = accounts.find((account) => account.email === target);
  if (!existing || existing.role !== "judge" || existing.status !== "approved") {
    return { accounts, error: "That judge is not on the list." };
  }
  const account: Account = { ...existing, passwordHash, passwordChosen: true, mustChangePassword: true, reviewedAt: existing.reviewedAt ?? now };
  return {
    accounts: accounts.map((item) => (item.email === target ? account : item)),
    account,
  };
}

export function setJudgePassword(accounts: Account[], email: string, passwordHash: string) {
  const target = normalizeEmail(email);
  const existing = accounts.find((account) => account.email === target);
  if (!existing || existing.role !== "judge" || existing.status !== "approved") {
    return { accounts, error: "Sign in as a judge to set a password." };
  }
  const account: Account = { ...existing, passwordHash, passwordChosen: true, mustChangePassword: false };
  return {
    accounts: accounts.map((item) => (item.email === target ? account : item)),
    account,
  };
}

export function passwordStatus(account: { mustChangePassword?: boolean; passwordChosen?: boolean }) {
  if (account.mustChangePassword) return "temporary" as const;
  if (account.passwordChosen) return "chosen" as const;
  return "google" as const;
}

export function passwordStatusLabel(account: { mustChangePassword?: boolean; passwordChosen?: boolean }) {
  const status = passwordStatus(account);
  if (status === "temporary") return "Temporary password";
  if (status === "chosen") return "Password set";
  return "Google only";
}

export function loginDestination(account: { role: Role; mustChangePassword?: boolean }) {
  if (account.role === "judge" && account.mustChangePassword) return "/login/password/update";
  return account.role === "admin" ? "/admin" : "/judge";
}

export function passwordAuditChange(label: "password set" | "password reset" | "password changed", email: string) {
  return { field: "password", label, old: "", new: email };
}

export function removeJudge(accounts: Account[], email: string) {
  const target = normalizeEmail(email);
  const existing = accounts.find((account) => account.email === target);
  if (!existing || existing.role !== "judge") return { accounts, error: "That judge is not on the list." };
  return { accounts: accounts.filter((account) => account.email !== target), removed: existing };
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
  if (email === BOOTSTRAP_ADMIN_EMAIL || email === DALE_GOOGLE_ADMIN_EMAIL) {
    return approveAdmin(accounts, email, name || "Dale Kolnitys", input.passwordHash, now);
  }
  const existing = accounts.find((account) => account.email === email);
  if (existing?.status === "approved") return { accounts, outcome: "approved" as const, account: existing };
  if (existing?.status === "pending" || existing?.role === "admin") return { accounts, outcome: "pending" as const };
  const requested = requestJudge(accounts, { name, email, passwordHash: input.passwordHash, passwordChosen: false }, now);
  if (requested.error) return { accounts, error: requested.error };
  return { accounts: requested.accounts, outcome: "pending" as const };
}

function approveAdmin(
  accounts: Account[],
  email: string,
  name: string,
  passwordHash: string,
  now: string,
) {
  const existing = accounts.find((account) => account.email === email);
  const account: Account = {
    name: existing?.name || name,
    email,
    passwordHash: existing?.passwordHash || passwordHash,
    role: "admin",
    status: "approved",
    createdAt: existing?.createdAt || now,
    reviewedAt: now,
  };
  const next = existing
    ? accounts.map((item) => (item.email === email ? account : item))
    : [...accounts, account];
  return { accounts: next, outcome: "approved" as const, account };
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
