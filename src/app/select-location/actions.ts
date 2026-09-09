"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyLocationPin, issueLocationCookieValue, LOCATION_COOKIE_NAME } from "@/lib/locationAuth";

export async function selectLocation(formData: FormData) {
  const locationId = Number(formData.get("locationId"));
  const pin = String(formData.get("pin") || "");

  if (!locationId || !(await verifyLocationPin(locationId, pin))) {
    redirect(`/select-location?error=1&location=${locationId}`);
  }

  const store = await cookies();
  store.set(LOCATION_COOKIE_NAME, await issueLocationCookieValue(locationId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/");
}

export async function switchLocation() {
  const store = await cookies();
  store.delete(LOCATION_COOKIE_NAME);
  redirect("/select-location");
}
