import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { settings } from "@/db/schema";

const COOKIE_NAME = "admin_session";
const PASSWORD_HASH_KEY = "admin_password_hash";
const SESSION_SECRET_KEY = "session_secret";

// Cached per warm serverless instance so a page navigation doesn't need a DB
// round-trip just to check the session cookie — only a cold start (or the
// first request after a password change) pays for the read.
let cachedSecret: string | null = null;

async function getSetting(key: string): Promise<string | null> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  return row?.value ?? null;
}

async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

async function getOrCreateSessionSecret(): Promise<string> {
  if (cachedSecret) return cachedSecret;
  let secret = await getSetting(SESSION_SECRET_KEY);
  if (!secret) {
    secret = randomBytes(32).toString("hex");
    await setSetting(SESSION_SECRET_KEY, secret);
  }
  cachedSecret = secret;
  return secret;
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

function encodePasswordHash(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${hashPassword(password, salt)}`;
}

function verifyAgainstHash(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = hashPassword(password, salt);
  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function hasAdminPassword(): Promise<boolean> {
  return (await getSetting(PASSWORD_HASH_KEY)) !== null;
}

export async function setAdminPassword(password: string): Promise<void> {
  await setSetting(PASSWORD_HASH_KEY, encodePasswordHash(password));
  // Rotate the session secret whenever the password changes so every other
  // signed-in session/device is logged out at the same time.
  cachedSecret = randomBytes(32).toString("hex");
  await setSetting(SESSION_SECRET_KEY, cachedSecret);
}

export async function checkPassword(password: string): Promise<boolean> {
  const stored = await getSetting(PASSWORD_HASH_KEY);
  if (!stored) return false;
  return verifyAgainstHash(password, stored);
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function expectedSessionToken(): Promise<string> {
  const secret = await getOrCreateSessionSecret();
  return sha256Hex(`admin:${secret}`);
}

export { COOKIE_NAME };
