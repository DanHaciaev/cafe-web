"use client";

import { useEffect, useState } from "react";
import { PRINT_AGENT_URL } from "@/lib/agentUrl";

type Driver = "MAIB" | "VB" | "MICB" | "FCB";

type Terminal = {
  id: string;
  driver: Driver | "";
  comPort: string;
  terminalPort: string;
  label: string;
  listening?: boolean;
  terminalConnected?: boolean;
};

const DRIVER_LABELS: Record<Driver, string> = {
  MAIB: "MAIB (Arcus2, COM-порт)",
  VB: "Victoriabank (по сети, порт)",
  MICB: "Moldindconbank (по сети, порт)",
  FCB: "Fincombank (по сети, порт)",
};

function emptyTerminal(): Terminal {
  return { id: "", driver: "", comPort: "", terminalPort: "", label: "" };
}

export default function TerminalsConfig() {
  const [agentStatus, setAgentStatus] = useState<"checking" | "online" | "offline">("checking");
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch(`${PRINT_AGENT_URL}/pos/config`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("agent responded with error");
      const data = await res.json();
      setTerminals(data.terminals ?? []);
      setAgentStatus("online");
    } catch {
      setAgentStatus("offline");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateTerminal(index: number, patch: Partial<Terminal>) {
    setTerminals((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function addTerminal() {
    setTerminals((prev) => [...prev, emptyTerminal()]);
  }

  function removeTerminal(index: number) {
    setTerminals((prev) => prev.filter((_, i) => i !== index));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${PRINT_AGENT_URL}/pos/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terminals }),
      });
      if (!res.ok) throw new Error("save failed");
      const data = await res.json();
      setTerminals(data.terminals ?? []);
      setMessage("Сохранено.");
    } catch {
      setMessage("Не удалось сохранить — проверьте, что агент запущен на этом компьютере.");
    } finally {
      setSaving(false);
    }
  }

  if (agentStatus === "checking") {
    return <p className="text-sm text-slate-400">Проверяю локальный агент на этом компьютере...</p>;
  }

  if (agentStatus === "offline") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Локальный агент печати не найден на <span className="font-mono">127.0.0.1:47991</span>.
        Настройка терминалов возможна только на кассовом компьютере, где установлен
        print-agent — откройте эту страницу прямо на нём. См.{" "}
        <span className="font-mono">print-agent/README.md</span>.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Настройки хранятся локально на этом компьютере (в конфиге агента печати), а не в
        общей базе — на каждой кассе может быть свой набор терминалов.
      </p>

      <div className="flex flex-col gap-3">
        {terminals.map((t, i) => (
          <div key={i} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Банк / драйвер
              <select
                value={t.driver}
                onChange={(e) => updateTerminal(i, { driver: e.target.value as Driver })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              >
                <option value="">Выберите...</option>
                {(Object.keys(DRIVER_LABELS) as Driver[]).map((d) => (
                  <option key={d} value={d}>
                    {DRIVER_LABELS[d]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Название (для кассира)
              <input
                value={t.label}
                onChange={(e) => updateTerminal(i, { label: e.target.value })}
                placeholder="например: MAIB терминал"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </label>
            {t.driver === "MAIB" ? (
              <label className="flex flex-col gap-1 text-sm text-slate-600">
                COM-порт
                <input
                  value={t.comPort}
                  onChange={(e) => updateTerminal(i, { comPort: e.target.value })}
                  placeholder="COM8"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </label>
            ) : (
              <label className="flex flex-col gap-1 text-sm text-slate-600">
                Порт (терминал подключается на этот ПК)
                <input
                  value={t.terminalPort}
                  onChange={(e) => updateTerminal(i, { terminalPort: e.target.value })}
                  placeholder="например 9999"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </label>
            )}
            <div className="flex items-end justify-between gap-2">
              {typeof t.terminalConnected === "boolean" && (
                <span
                  className={
                    "text-xs " + (t.terminalConnected ? "text-emerald-600" : "text-slate-400")
                  }
                >
                  {t.terminalConnected ? "Терминал подключён" : "Терминал не подключён"}
                </span>
              )}
              <button
                type="button"
                onClick={() => removeTerminal(i)}
                className="text-xs font-medium text-red-500 hover:text-red-600"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
        {terminals.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-400">
            Терминалы не настроены — оплата будет доступна только наличными.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addTerminal}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          + Добавить терминал
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
        >
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
        {message && <span className="text-sm text-slate-500">{message}</span>}
      </div>
    </div>
  );
}
