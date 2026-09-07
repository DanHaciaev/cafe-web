"use client";

import { useEffect, useState } from "react";

function formatTime(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function Clock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    setTime(formatTime(new Date()));
    const timer = setInterval(() => setTime(formatTime(new Date())), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="font-mono text-sm font-semibold tabular-nums text-slate-600">
      {time ?? "--:--:--"}
    </span>
  );
}
