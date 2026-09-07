import TerminalsConfig from "@/components/admin/TerminalsConfig";

export default function TerminalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Банковские терминалы</h1>
        <p className="mt-1 text-sm text-slate-500">
          Откройте эту страницу на самой кассе (компьютере с установленным print-agent) —
          настройки специфичны для конкретного компьютера, у разных касс могут быть разные
          терминалы.
        </p>
      </div>
      <TerminalsConfig />
    </div>
  );
}
