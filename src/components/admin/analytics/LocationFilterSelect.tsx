"use client";

type Props = {
  range: string;
  locationId: number | undefined;
  locations: { id: number; name: string }[];
};

// GET form that auto-submits on change, so picking a location updates the
// URL (and re-renders the server page) without a separate "Apply" button.
export default function LocationFilterSelect({ range, locationId, locations }: Props) {
  return (
    <form method="get" className="flex items-center">
      <input type="hidden" name="range" value={range} />
      <select
        name="location"
        defaultValue={locationId ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400"
      >
        <option value="">Все точки</option>
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name}
          </option>
        ))}
      </select>
    </form>
  );
}
