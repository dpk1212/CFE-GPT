import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const LOWER = "abcdefghijkmnopqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%&*";
const ALL = `${LOWER}${UPPER}${DIGITS}${SYMBOLS}`;

/** A password an admin can read once and hand to a judge. It is not written to logs. */
export function temporaryPassword() {
  const bytes = randomBytes(20);
  const chars = [
    LOWER[bytes[0] % LOWER.length],
    UPPER[bytes[1] % UPPER.length],
    DIGITS[bytes[2] % DIGITS.length],
    SYMBOLS[bytes[3] % SYMBOLS.length],
  ];
  for (let index = 4; index < bytes.length; index += 1) chars.push(ALL[bytes[index] % ALL.length]);
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = bytes[index] % (index + 1);
    const current = chars[index];
    chars[index] = chars[swap];
    chars[swap] = current;
  }
  return chars.join("");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, saltHex, hashHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), 32);
  const expected = Buffer.from(hashHex, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
