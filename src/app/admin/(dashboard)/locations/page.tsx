import { MapPin, Plus, Save, Trash2, KeyRound } from "lucide-react";
import { getLocations } from "@/db/queries";
import { createLocation, updateLocationName, changeLocationPin, deleteLocation } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const locationsList = await getLocations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Точки</h1>
        <p className="mt-1 text-sm text-slate-500">
          Физические точки/районы. На кассе кассир выбирает свою точку и вводит PIN — заказы
          привязываются к ней, а в «Аналитике» можно смотреть продажи по каждой точке отдельно.
          Если точек нет — касса работает как обычно, без экрана выбора.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {locationsList.map((loc) => (
          <div key={loc.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <form action={updateLocationName} className="mb-3 flex items-center gap-3">
              <input type="hidden" name="id" value={loc.id} />
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <MapPin size={17} />
              </div>
              <input
                name="name"
                defaultValue={loc.name}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium outline-none transition-colors focus:border-indigo-400"
              />
              <button
                type="submit"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-indigo-50 hover:text-indigo-500"
                aria-label="Сохранить название"
                title="Сохранить название"
              >
                <Save size={16} />
              </button>
            </form>

            <form action={changeLocationPin} className="flex items-center gap-2">
              <input type="hidden" name="id" value={loc.id} />
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                <KeyRound size={14} />
              </div>
              <input
                name="pin"
                type="text"
                inputMode="numeric"
                placeholder="Новый PIN (мин. 4 цифры)"
                minLength={4}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-400"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
              >
                Сменить PIN
              </button>
              <button
                type="submit"
                formAction={deleteLocation}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                aria-label="Удалить точку"
              >
                <Trash2 size={16} />
              </button>
            </form>
          </div>
        ))}
        {locationsList.length === 0 && (
          <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-400 sm:col-span-2">
            Точек пока нет — касса работает в обычном режиме, без выбора точки.
          </p>
        )}
      </div>

      <form
        action={createLocation}
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <input
          name="name"
          placeholder="Название точки (например «Центр»)"
          required
          className="flex-1 min-w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        <input
          name="pin"
          type="text"
          inputMode="numeric"
          placeholder="PIN (мин. 4 цифры)"
          required
          minLength={4}
          className="w-48 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
        >
          <Plus size={16} />
          Добавить точку
        </button>
      </form>
    </div>
  );
}
