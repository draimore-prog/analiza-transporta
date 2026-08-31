"use client";

import React, { useMemo } from "react";
import { calculateFleetByYear, calculateDynamic2026, formatKM } from "@/lib/calculations.js";
import { Truck, DollarSign, Calendar, TrendingDown } from "lucide-react";

export function TransportKpis({
  masterFleet,
  costData,
  onSelectYear,
  onOpenFleetTab
}) {
  const dynamic2026 = useMemo(() => calculateDynamic2026(masterFleet), [masterFleet]);
  const fleetByYear = useMemo(() => calculateFleetByYear(masterFleet), [masterFleet]);

  // Izračun troškova po godinama
  const yearlyStats = useMemo(() => {
    const years = [2021, 2022, 2023, 2024, 2025, 2026];
    const stats = {};
    years.forEach((y) => (stats[y] = { cost: 0, count: 0 }));

    costData.forEach((c) => {
      if (stats[c.year]) {
        stats[c.year].cost += c.cost || 0;
        stats[c.year].count += 1;
      }
    });

    return stats;
  }, [costData]);

  const totalAllTimeCost = useMemo(() => {
    return costData.reduce((acc, c) => acc + (c.cost || 0), 0);
  }, [costData]);

  const cost2026 = yearlyStats[2026]?.cost || 0;
  const avgCostPerUnit2026 = dynamic2026.total > 0 ? cost2026 / dynamic2026.total : 0;

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Kartice */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kartica 1: Ukupan Vozni Park 2026 */}
        <div
          onClick={onOpenFleetTab}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-blue-600 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-700 transition-all group"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Aktivni Vozni Park 2026
            </span>
            <span className="p-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
              <Truck className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {dynamic2026.total.toLocaleString("bs-BA")}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Teretna: <strong className="text-slate-800 dark:text-slate-200">{dynamic2026.teretna}</strong> | Skladišna: <strong className="text-slate-800 dark:text-slate-200">{dynamic2026.skladisna}</strong>
          </p>
        </div>

        {/* Kartica 2: Ukupni Troškovi Održavanja */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-emerald-500 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ukupni Troškovi Održavanja
            </span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {formatKM(totalAllTimeCost)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Konsolidovano (2021 - 2026)
          </p>
        </div>

        {/* Kartica 3: Trošak 2026 */}
        <div
          onClick={() => onSelectYear(2026)}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-indigo-500 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-600 transition-all group"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Trošak u 2026. Godini
            </span>
            <span className="p-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {formatKM(cost2026)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Broj unesenih računa: <strong className="text-slate-800 dark:text-slate-200">{yearlyStats[2026]?.count.toLocaleString("bs-BA")}</strong>
          </p>
        </div>

        {/* Kartica 4: Prosjek po Vozilu 2026 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-amber-500 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Prosjek po Vozilu (2026)
            </span>
            <span className="p-2 bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
            {formatKM(avgCostPerUnit2026)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Na bazi {dynamic2026.total} aktivnih jedinica
          </p>
        </div>
      </div>

      {/* Višegodišnja zbirna tabela */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              📅 Višegodišnji Pregled Troškova & Broja Vozila (2021 - 2026)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Klik na red filtrira tabelu servisa za odabranu godinu
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Godina</th>
                <th className="p-3 text-center">Broj Vozila u Floti</th>
                <th className="p-3 text-right">Ukupan Trošak Održavanja</th>
                <th className="p-3 text-right">Prosjek po Jedinici</th>
                <th className="p-3 text-center">Broj Servisnih Naloga</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {[2026, 2025, 2024, 2023, 2022, 2021].map((y) => {
                const fCount = fleetByYear[y] || 0;
                const cost = yearlyStats[y]?.cost || 0;
                const count = yearlyStats[y]?.count || 0;
                const avg = fCount > 0 ? cost / fCount : 0;

                return (
                  <tr
                    key={y}
                    onClick={() => onSelectYear(y)}
                    className="hover:bg-blue-50/50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group"
                  >
                    <td className="p-3 font-extrabold text-blue-700 dark:text-blue-400 group-hover:underline">
                      {y}. godina {y === 2026 && <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 px-2 py-0.5 rounded-full ml-1 font-bold">Tekuća</span>}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200">
                      {fCount.toLocaleString("bs-BA")}
                    </td>
                    <td className="p-3 text-right font-black text-slate-900 dark:text-white">
                      {formatKM(cost)}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-700 dark:text-slate-300">
                      {formatKM(avg)}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-600 dark:text-slate-400">
                      {count.toLocaleString("bs-BA")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
