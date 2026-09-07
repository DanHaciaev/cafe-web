import { getActiveProducts, getCategories, getProductDetail } from "@/db/queries";
import type { ProductDetail } from "@/db/queries";
import PosApp from "@/components/pos/PosApp";

export const dynamic = "force-dynamic";

export default async function Home() {
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
    />
  );
}
