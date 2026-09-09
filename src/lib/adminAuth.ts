import {
  getSetting,
  setSetting,
  getOrCreateSessionSecret,
  rotateSessionSecretSync,
  encodeSecretHash,
  verifyAgainstHash,
  sha256Hex,
} from "./authCrypto";

const COOKIE_NAME = "admin_session";
const PASSWORD_HASH_KEY = "admin_password_hash";

export async function hasAdminPassword(): Promise<boolean> {
  return (await getSetting(PASSWORD_HASH_KEY)) !== null;
}

export async function setAdminPassword(password: string): Promise<void> {
  await setSetting(PASSWORD_HASH_KEY, encodeSecretHash(password));
  // Rotate the session secret whenever the password changes so every other
  // signed-in session/device (admin AND location logins) is logged out at
  // the same time.
  const secret = rotateSessionSecretSync();
  await setSetting("session_secret", secret);
}

export async function checkPassword(password: string): Promise<boolean> {
  const stored = await getSetting(PASSWORD_HASH_KEY);
  if (!stored) return false;
  return verifyAgainstHash(password, stored);
}

export async function expectedSessionToken(): Promise<string> {
  const secret = await getOrCreateSessionSecret();
  return sha256Hex(`admin:${secret}`);
}

export { COOKIE_NAME };
