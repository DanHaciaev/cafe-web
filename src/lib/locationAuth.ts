import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { locations } from "@/db/schema";
import { getOrCreateSessionSecret, encodeSecretHash, verifyAgainstHash, sha256Hex } from "./authCrypto";

export const LOCATION_COOKIE_NAME = "location_session";

export async function hasAnyLocations(): Promise<boolean> {
  const rows = await db.select({ id: locations.id }).from(locations).limit(1);
  return rows.length > 0;
}

export async function setLocationPin(locationId: number, pin: string): Promise<void> {
  await db
    .update(locations)
    .set({ pinHash: encodeSecretHash(pin) })
    .where(eq(locations.id, locationId));
}

export async function verifyLocationPin(locationId: number, pin: string): Promise<boolean> {
  const [location] = await db.select().from(locations).where(eq(locations.id, locationId));
  if (!location || !location.pinHash) return false;
  return verifyAgainstHash(pin, location.pinHash);
}

async function tokenFor(locationId: number): Promise<string> {
  const secret = await getOrCreateSessionSecret();
  return sha256Hex(`location:${locationId}:${secret}`);
}

export async function issueLocationCookieValue(locationId: number): Promise<string> {
  return `${locationId}.${await tokenFor(locationId)}`;
}

// Returns the authenticated locationId, or null if the cookie is missing,
// malformed, or was signed with a since-rotated secret (e.g. admin password
// changed, which rotates the shared secret and logs every location out too).
export async function verifyLocationCookieValue(value: string | undefined): Promise<number | null> {
  if (!value) return null;
  const [idPart, sig] = value.split(".");
  const locationId = Number(idPart);
  if (!locationId || !sig) return null;
  const expected = await tokenFor(locationId);
  return sig === expected ? locationId : null;
}
