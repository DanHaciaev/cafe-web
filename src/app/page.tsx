import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getActiveProducts, getCategories, getProductDetail, getLocation } from "@/db/queries";
import type { ProductDetail } from "@/db/queries";
import { hasAnyLocations, verifyLocationCookieValue, LOCATION_COOKIE_NAME } from "@/lib/locationAuth";
import PosApp from "@/components/pos/PosApp";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Locations are opt-in — only gate the cassa behind a location login once
  // an admin has actually configured at least one.
  let activeLocation: { id: number; name: string } | null = null;
  if (await hasAnyLocations()) {
    const store = await cookies();
    const locationId = await verifyLocationCookieValue(store.get(LOCATION_COOKIE_NAME)?.value);
    if (!locationId) redirect("/select-location");
    const location = await getLocation(locationId);
    if (!location) redirect("/select-location");
    activeLocation = { id: location.id, name: location.name };
  }

  const [categoriesData, productsData] = await Promise.all([
    getCategories(),
    getActiveProducts(),
  ]);

  const details: Record<number, ProductDetail> = {};
  await Promise.all(
    productsData.map(async (p) => {
      const detail = await getProductDetail(p.id);
      if (detail) details[p.id] = detail;
    })
  );

  return (
    <PosApp
      categories={categoriesData}
      products={productsData}
      productDetails={details}
      activeLocation={activeLocation}
    />
  );
}
