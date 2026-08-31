"use client";

import { useState, useEffect } from "react";

export function ClockWidget() {
  const [timeStr, setTimeStr] = useState("--:--:--");
  const [dateStr, setDateStr] = useState("--.--.----");

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("bs-BA", { hour12: false }));
      const day = ("0" + now.getDate()).slice(-2);
      const month = ("0" + (now.getMonth() + 1)).slice(-2);
      const year = now.getFullYear();
      setDateStr(`${day}.${month}.${year}.`);
    }

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
      <div className="flex flex-col items-center justify-center text-center">
        <div 
          className="text-2xl font-black text-slate-700 dark:text-slate-200 tracking-tighter" 
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {timeStr}
        </div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">
          {dateStr}
        </div>
      </div>
    </div>
  );
}
