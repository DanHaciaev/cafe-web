import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin, ArrowLeft } from "lucide-react";
import { getLocations } from "@/db/queries";
import { selectLocation } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ location?: string; error?: string }>;
};

export default async function SelectLocationPage({ searchParams }: Props) {
  const { location, error } = await searchParams;
  const locationsList = await getLocations();

  // Nothing configured — this screen shouldn't be reachable, send back to
  // the cassa (it only redirects here when locations actually exist).
  if (locationsList.length === 0) redirect("/");

  const selected = location ? locationsList.find((l) => l.id === Number(location)) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1e1b4b] p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-white">
            <MapPin size={26} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              {selected ? selected.name : "Выберите точку"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">Cafe Drive POS</p>
          </div>
        </div>

        {selected ? (
          <form action={selectLocation} className="flex flex-col gap-3">
            <input type="hidden" name="locationId" value={selected.id} />
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              PIN
              <input
                type="password"
                name="pin"
                inputMode="numeric"
                autoFocus
                required
                className="rounded-xl border border-slate-200 px-4 py-3 text-center text-lg tracking-widest outline-none focus:border-indigo-400"
              />
            </label>
            {error && <p className="text-sm text-red-500">Неверный PIN.</p>}
            <button
              type="submit"
              className="mt-2 rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-400"
            >
              Войти
            </button>
            <Link
              href="/select-location"
              className="mt-1 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-600"
            >
              <ArrowLeft size={14} />
              Выбрать другую точку
            </Link>
          </form>
        ) : (
          <div className="flex flex-col gap-2">
            {locationsList.map((loc) => (
              <Link
                key={loc.id}
                href={`/select-location?location=${loc.id}`}
                className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50"
              >
                {loc.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
