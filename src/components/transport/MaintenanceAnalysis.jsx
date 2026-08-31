"use client";

import React, { useMemo } from "react";
import { formatKM } from "@/lib/calculations.js";
import { TrendingUp, Layers } from "lucide-react";

export function MaintenanceAnalysis({
  costData,
  onSelectType,
  onSelectBrand
}) {
  // Troškovi po kategorijama
  const typeStats = useMemo(() => {
    const map = new Map();
    costData.forEach((c) => {
      const t = c.tipMehan || "Ostalo";
      const curr = map.get(t) || { cost: 0, count: 0 };
      curr.cost += c.cost || 0;
      curr.count += 1;
      map.set(t, curr);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].cost - a[1].cost);
  }, [costData]);

  // Troškovi po markama
  const brandStats = useMemo(() => {
    const map = new Map();
    costData.forEach((c) => {
      const b = (c.markaVoz || "-").trim();
      if (!b || b === "-") return;
      const curr = map.get(b) || { cost: 0, count: 0 };
      curr.cost += c.cost || 0;
      curr.count += 1;
      map.set(b, curr);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].cost - a[1].cost).slice(0, 8);
  }, [costData]);

  const totalCost = useMemo(() => {
    return costData.reduce((acc, c) => acc + (c.cost || 0), 0);
  }, [costData]);

  return (
    <div className="space-y-6">
      {/* Kartice kategorija */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" /> Raspodjela Troškova po Kategorijama Vozila
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Klik na kategoriju filtrira detaljne transakcije
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {typeStats.map(([typeName, stats], idx) => {
            const perc = totalCost > 0 ? ((stats.cost / totalCost) * 100).toFixed(1) : "0";

            return (
              <div
                key={typeName}
                onClick={() => onSelectType(typeName)}
                className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {typeName}
                    </h4>
                  </div>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
                    {perc}%
                  </span>
                </div>

                <div className="flex justify-between items-end mt-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Ukupan Utrošak</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {formatKM(stats.cost)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Broj Opravki</span>
                    <span className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                      {stats.count.toLocaleString("bs-BA")}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${perc}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Marke */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" /> Top Marke & Proizvođači po Utrošku Održavanja
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Vodeći proizvođači i kumulativni troškovi rezervnih dijelova i rada
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {brandStats.map(([brandName, stats], idx) => {
            const perc = totalCost > 0 ? ((stats.cost / totalCost) * 100).toFixed(1) : "0";

            return (
              <div
                key={brandName}
                onClick={() => onSelectBrand(brandName)}
                className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate">
                    {brandName}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                </div>
                <div className="text-base font-black text-indigo-600 dark:text-indigo-400">
                  {formatKM(stats.cost)}
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                  <span>{stats.count} servisa</span>
                  <span className="font-bold">{perc}% udjela</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
