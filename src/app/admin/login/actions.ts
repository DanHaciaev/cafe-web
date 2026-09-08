"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  checkPassword,
  expectedSessionToken,
  hasAdminPassword,
  setAdminPassword,
  COOKIE_NAME,
} from "@/lib/adminAuth";

async function setSessionCookie() {
  const token = await expectedSessionToken();
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function setup(formData: FormData) {
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");
  const next = String(formData.get("next") || "/admin");

  if (await hasAdminPassword()) {
    // Someone else already completed setup while this page was open.
    redirect("/admin/login");
  }
  if (password.length < 6) {
    redirect(`/admin/login?setupError=short&next=${encodeURIComponent(next)}`);
  }
  if (password !== confirm) {
    redirect(`/admin/login?setupError=mismatch&next=${encodeURIComponent(next)}`);
  }

  await setAdminPassword(password);
  await setSessionCookie();
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function login(formData: FormData) {
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/admin");

  if (!(await hasAdminPassword())) {
    redirect("/admin/login");
  }

  const ok = await checkPassword(password);
  if (!ok) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }

  await setSessionCookie();
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
  redirect("/admin/login");
}
