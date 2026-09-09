import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { settings } from "@/db/schema";

const SESSION_SECRET_KEY = "session_secret";

// Cached per warm serverless instance so a page navigation doesn't need a DB
// round-trip just to check a session cookie — only a cold start (or the
// first request after a password/PIN change) pays for the read.
let cachedSecret: string | null = null;

export async function getSetting(key: string): Promise<string | null> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

// Shared by both admin-password and per-location-PIN sessions — one secret
// signs every cookie this app issues.
export async function getOrCreateSessionSecret(): Promise<string> {
  if (cachedSecret) return cachedSecret;
  let secret = await getSetting(SESSION_SECRET_KEY);
  if (!secret) {
    secret = randomBytes(32).toString("hex");
    await setSetting(SESSION_SECRET_KEY, secret);
  }
  cachedSecret = secret;
  return secret;
}

export function rotateSessionSecretSync(): string {
  cachedSecret = randomBytes(32).toString("hex");
  return cachedSecret;
}

export function hashSecret(value: string, salt: string): string {
  return scryptSync(value, salt, 64).toString("hex");
}

export function encodeSecretHash(value: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${hashSecret(value, salt)}`;
}

export function verifyAgainstHash(value: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = hashSecret(value, salt);
  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
