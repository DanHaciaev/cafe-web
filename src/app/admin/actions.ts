"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import {
  categories,
  products,
  ingredients,
  productIngredients,
  productModifierGroups,
  modifierGroups,
  modifierOptions,
  locations,
} from "@/db/schema";
import { checkPassword, setAdminPassword } from "@/lib/adminAuth";
import { setLocationPin } from "@/lib/locationAuth";

// --- Admin password -------------------------------------------------------

export async function changePassword(formData: FormData) {
  const current = String(formData.get("current") || "");
  const next = String(formData.get("next") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!(await checkPassword(current))) {
    redirect("/admin/settings?error=current");
  }
  if (next.length < 6) {
    redirect("/admin/settings?error=short");
  }
  if (next !== confirm) {
    redirect("/admin/settings?error=mismatch");
  }

  await setAdminPassword(next);
  // Changing the password rotates the session secret, so the cookie this
  // request came in with is now stale too — send the admin back through
  // login rather than leaving them on a page they can no longer navigate
  // away from without hitting the proxy redirect.
  redirect("/admin/login");
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

// --- Categories -------------------------------------------------------

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await db.insert(categories).values({ name, slug: slugify(name) });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function updateCategory(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  if (!id || !name) return;
  await db
    .update(categories)
    .set({ name, slug: slugify(name), imageUrl: imageUrl || null })
    .where(eq(categories.id, id));
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function deleteCategory(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

// --- Ingredients --------------------------------------------------------

export async function createIngredient(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const extraPrice = Number(formData.get("extraPrice") || 0);
  if (!name) return;
  await db.insert(ingredients).values({ name, extraPrice });
  revalidatePath("/admin/ingredients");
}

export async function updateIngredient(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const extraPrice = Number(formData.get("extraPrice") || 0);
  if (!id || !name) return;
  await db.update(ingredients).set({ name, extraPrice }).where(eq(ingredients.id, id));
  revalidatePath("/admin/ingredients");
  revalidatePath("/admin/products");
}

export async function deleteIngredient(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(ingredients).where(eq(ingredients.id, id));
  revalidatePath("/admin/ingredients");
}

// --- Products -------------------------------------------------------

export async function createProduct(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const categoryId = Number(formData.get("categoryId"));
  const basePrice = Number(formData.get("basePrice") || 0);
  if (!name || !categoryId) return;
  await db.insert(products).values({ name, categoryId, basePrice });
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function updateProduct(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const categoryId = Number(formData.get("categoryId"));
  const basePrice = Number(formData.get("basePrice") || 0);
  const isActive = formData.get("isActive") === "on";
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  if (!id || !name || !categoryId) return;
  await db
    .update(products)
    .set({ name, categoryId, basePrice, isActive, imageUrl: imageUrl || null })
    .where(eq(products.id, id));
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/");
}

export async function deleteProduct(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin/products");
  revalidatePath("/");
}

// --- Product <-> modifier groups -----------------------------------------

export async function toggleProductModifierGroup(formData: FormData) {
  const productId = Number(formData.get("productId"));
  const groupId = Number(formData.get("groupId"));
  const enabled = formData.get("enabled") === "true";
  if (!productId || !groupId) return;

  if (enabled) {
    await db.insert(productModifierGroups).values({ productId, groupId });
  } else {
    const rows = await db
      .select()
      .from(productModifierGroups)
      .where(eq(productModifierGroups.productId, productId));
    const row = rows.find((r) => r.groupId === groupId);
    if (row) {
      await db.delete(productModifierGroups).where(eq(productModifierGroups.id, row.id));
    }
  }
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/");
}

export async function createModifierGroup(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const selectionType = String(formData.get("selectionType") || "single") as "single" | "multiple";
  const required = formData.get("required") === "on";
  if (!name) return;
  await db.insert(modifierGroups).values({ name, selectionType, required });
  revalidatePath("/admin/modifiers");
  revalidatePath("/admin/products");
}

export async function updateModifierGroup(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const selectionType = String(formData.get("selectionType") || "single") as "single" | "multiple";
  const required = formData.get("required") === "on";
  if (!id || !name) return;
  await db.update(modifierGroups).set({ name, selectionType, required }).where(eq(modifierGroups.id, id));
  revalidatePath("/admin/modifiers");
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function deleteModifierGroup(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(modifierGroups).where(eq(modifierGroups.id, id));
  revalidatePath("/admin/modifiers");
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function createModifierOption(formData: FormData) {
  const groupId = Number(formData.get("groupId"));
  const name = String(formData.get("name") || "").trim();
  const priceDelta = Number(formData.get("priceDelta") || 0);
  const isDefault = formData.get("isDefault") === "on";
  if (!groupId || !name) return;
  await db.insert(modifierOptions).values({ groupId, name, priceDelta, isDefault });
  revalidatePath("/admin/modifiers");
  revalidatePath("/");
}

export async function updateModifierOption(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const priceDelta = Number(formData.get("priceDelta") || 0);
  const isDefault = formData.get("isDefault") === "on";
  if (!id || !name) return;
  await db.update(modifierOptions).set({ name, priceDelta, isDefault }).where(eq(modifierOptions.id, id));
  revalidatePath("/admin/modifiers");
  revalidatePath("/");
}

export async function deleteModifierOption(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(modifierOptions).where(eq(modifierOptions.id, id));
  revalidatePath("/admin/modifiers");
  revalidatePath("/");
}

// --- Product <-> ingredients -----------------------------------------

export async function addProductIngredient(formData: FormData) {
  const productId = Number(formData.get("productId"));
  const ingredientId = Number(formData.get("ingredientId"));
  const mode = String(formData.get("mode") || "extra");
  if (!productId || !ingredientId) return;

  const isDefault = mode !== "extra";
  const removable = mode !== "default_fixed";
  await db.insert(productIngredients).values({ productId, ingredientId, isDefault, removable });
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/");
}

export async function setProductIngredient(formData: FormData) {
  const productId = Number(formData.get("productId"));
  const ingredientId = Number(formData.get("ingredientId"));
  const linked = formData.get("linked") === "true";
  const isDefault = formData.get("isDefault") === "true";
  const removable = formData.get("removable") === "true";
  if (!productId || !ingredientId) return;

  const rows = await db
    .select()
    .from(productIngredients)
    .where(eq(productIngredients.productId, productId));
  const existing = rows.find((r) => r.ingredientId === ingredientId);

  if (!linked) {
    if (existing) {
      await db.delete(productIngredients).where(eq(productIngredients.id, existing.id));
    }
  } else if (existing) {
    await db
      .update(productIngredients)
      .set({ isDefault, removable })
      .where(eq(productIngredients.id, existing.id));
  } else {
    await db.insert(productIngredients).values({ productId, ingredientId, isDefault, removable });
  }
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/");
}

// --- Locations -------------------------------------------------------

export async function createLocation(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const pin = String(formData.get("pin") || "").trim();
  if (!name || pin.length < 4) return;
  const [location] = await db.insert(locations).values({ name }).returning();
  await setLocationPin(location.id, pin);
  revalidatePath("/admin/locations");
}

export async function updateLocationName(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  if (!id || !name) return;
  await db.update(locations).set({ name }).where(eq(locations.id, id));
  revalidatePath("/admin/locations");
}

export async function changeLocationPin(formData: FormData) {
  const id = Number(formData.get("id"));
  const pin = String(formData.get("pin") || "").trim();
  if (!id || pin.length < 4) return;
  await setLocationPin(id, pin);
  revalidatePath("/admin/locations");
}

export async function deleteLocation(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(locations).where(eq(locations.id, id));
  revalidatePath("/admin/locations");
}
