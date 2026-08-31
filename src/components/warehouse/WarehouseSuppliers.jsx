"use client";

import React, { useMemo } from "react";
import { formatKM } from "@/lib/calculations.js";
import { Building2 } from "lucide-react";

export function WarehouseSuppliers({
  warehouseCostData,
  onSelectSupplier
}) {
  const supplierStats = useMemo(() => {
    const statsMap = new Map();

    warehouseCostData.forEach((c) => {
      const sup = (c.dobavljacOrig || c.dobavljac || "Vlastita Radionica").trim();
      const current = statsMap.get(sup) || { cost: 0, count: 0 };
      current.cost += c.cost || 0;
      current.count += 1;
      statsMap.set(sup, current);
    });

    return Array.from(statsMap.entries()).sort((a, b) => b[1].cost - a[1].cost);
  }, [warehouseCostData]);

  const totalSupplierCost = useMemo(() => {
    return supplierStats.reduce((acc, [, s]) => acc + s.cost, 0);
  }, [supplierStats]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" /> Partneri i Serviseri Skladišne Mehanizacije
          </h3>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 dark:bg-blue-900/50 px-2.5 py-0.5 rounded-full">
            Klik za analizu servisa
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Poređenje ovlaštenih servisa (Linde, Jungheinrich, Still...), internih radionica i vanjskih dobavljača
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {supplierStats.map(([supName, stats], idx) => {
            const perc = totalSupplierCost > 0 ? ((stats.cost / totalSupplierCost) * 100).toFixed(1) : "0";

            return (
              <div
                key={supName}
                onClick={() => onSelectSupplier(supName)}
                className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors truncate max-w-[200px]" title={supName}>
                      {supName}
                    </h4>
                  </div>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
                    {perc}%
                  </span>
                </div>

                <div className="flex justify-between items-end mt-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Ukupan Iznos</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {formatKM(stats.cost)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Računa / Naloga</span>
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
    </div>
  );
}
