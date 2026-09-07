"use client";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  hidden: Record<string, string>;
  checked: boolean;
  trueValue: string;
  falseValue: string;
  fieldName: string;
  label: string;
};

export default function AutoSubmitCheckbox({
  action,
  hidden,
  checked,
  trueValue,
  falseValue,
  fieldName,
  label,
}: Props) {
  return (
    <form
      action={action}
      onChange={(e) => e.currentTarget.requestSubmit()}
      className="flex items-center gap-2"
    >
      {Object.entries(hidden).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <input type="hidden" name={fieldName} value={checked ? falseValue : trueValue} />
      <input type="checkbox" checked={checked} onChange={() => {}} />
      <span className="text-sm text-slate-700">{label}</span>
    </form>
  );
}
