import { notFound } from "next/navigation";
import {
  getActiveProducts,
  getAllIngredients,
  getAllModifierGroups,
  getCategories,
  getProductDetail,
} from "@/db/queries";
import { updateProduct, toggleProductModifierGroup, setProductIngredient } from "../../actions";
import AutoSubmitCheckbox from "@/components/admin/AutoSubmitCheckbox";
import IngredientAssignmentSelect from "@/components/admin/IngredientAssignmentSelect";

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);

  const [products, categoriesList, allModifierGroups, allIngredients, detail] = await Promise.all([
    getActiveProducts(),
    getCategories(),
    getAllModifierGroups(),
    getAllIngredients(),
    getProductDetail(productId),
  ]);

  const product = products.find((p) => p.id === productId);
  if (!product || !detail) notFound();

  const linkedGroupIds = new Set(detail.modifierGroups.map((g) => g.id));

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-slate-900">{product.name}</h1>

      <form action={updateProduct} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <input type="hidden" name="id" value={product.id} />
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Название
          <input
            name="name"
            defaultValue={product.name}
            required
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Категория
          <select
            name="categoryId"
            defaultValue={product.categoryId}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          >
            {categoriesList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Цена
          <input
            name="basePrice"
            type="number"
            step="0.1"
            min="0"
            defaultValue={product.basePrice}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>
        <label className="flex items-center gap-2 self-end text-sm text-slate-600">
          <input type="checkbox" name="isActive" defaultChecked={product.isActive} />
          Активен в меню
        </label>
        <button
          type="submit"
          className="sm:col-span-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
        >
          Сохранить
        </button>
      </form>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Модификаторы (сироп, сахар, размер, молоко...)
        </h2>
        <div className="flex flex-col gap-2">
          {allModifierGroups.map((group) => (
            <AutoSubmitCheckbox
              key={group.id}
              action={toggleProductModifierGroup}
              hidden={{ productId: String(product.id), groupId: String(group.id) }}
              fieldName="enabled"
              trueValue="true"
              falseValue="false"
              checked={linkedGroupIds.has(group.id)}
              label={`${group.name} (${group.selectionType === "single" ? "один вариант" : "несколько"})`}
            />
          ))}
          {allModifierGroups.length === 0 && (
            <p className="text-sm text-slate-400">Групп модификаторов пока нет</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Ингредиенты</h2>
        <div className="flex flex-col gap-2">
          {allIngredients.map((ing) => {
            const linked = detail.ingredients.find((i) => i.id === ing.id);
            const mode = !linked
              ? "none"
              : linked.isDefault
              ? linked.removable
                ? "default_removable"
                : "default_fixed"
              : "extra";
            return (
              <div key={ing.id} className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-700">{ing.name}</span>
                <IngredientAssignmentSelect
                  action={setProductIngredient}
                  productId={product.id}
                  ingredientId={ing.id}
                  mode={mode}
                />
              </div>
            );
          })}
          {allIngredients.length === 0 && (
            <p className="text-sm text-slate-400">
              Ингредиентов пока нет — добавьте их на странице «Ингредиенты»
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
