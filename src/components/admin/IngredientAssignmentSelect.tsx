"use client";

type Mode = "none" | "default_removable" | "default_fixed" | "extra";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  productId: number;
  ingredientId: number;
  mode: Mode;
};

const OPTIONS: { value: Mode; label: string }[] = [
  { value: "none", label: "Не используется" },
  { value: "default_removable", label: "По умолчанию (можно убрать)" },
  { value: "default_fixed", label: "По умолчанию (нельзя убрать)" },
  { value: "extra", label: "Доступно как дополнение" },
];

function modeToFields(mode: Mode) {
  switch (mode) {
    case "none":
      return { linked: "false", isDefault: "false", removable: "false" };
    case "default_removable":
      return { linked: "true", isDefault: "true", removable: "true" };
    case "default_fixed":
      return { linked: "true", isDefault: "true", removable: "false" };
    case "extra":
      return { linked: "true", isDefault: "false", removable: "true" };
  }
}

export default function IngredientAssignmentSelect({ action, productId, ingredientId, mode }: Props) {
  return (
    <form action={action} onChange={(e) => e.currentTarget.requestSubmit()}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="ingredientId" value={ingredientId} />
      <select
        name="mode"
        defaultValue={mode}
        className="rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-indigo-400"
        onChange={(e) => {
          const form = e.currentTarget.form!;
          const fields = modeToFields(e.currentTarget.value as Mode);
          for (const [key, value] of Object.entries(fields)) {
            let input = form.querySelector<HTMLInputElement>(`input[name="${key}"]`);
            if (!input) {
              input = document.createElement("input");
              input.type = "hidden";
              input.name = key;
              form.appendChild(input);
            }
            input.value = value;
          }
        }}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}
