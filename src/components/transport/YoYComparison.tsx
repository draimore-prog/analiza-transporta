"use client";

import React, { useMemo } from "react";
import { CostItem } from "@/types/cost";
import { formatKM } from "@/lib/calculations";
import { RefreshCw, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface YoYComparisonProps {
  costData: CostItem[];
  onSelectYear: (year: number) => void;
}

export function YoYComparison({ costData, onSelectYear }: YoYComparisonProps) {
  const years = [2021, 2022, 2023, 2024, 2025, 2026];

  // Monthly matrix: month (1-12) -> year -> cost
  const matrix = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const result: Record<number, Record<number, number>> = {};

    months.forEach((m) => {
      result[m] = {};
      years.forEach((y) => (result[m][y] = 0));
    });

    costData.forEach((c) => {
      const m = c.month || (c.datumObj ? c.datumObj.getMonth() + 1 : null);
      if (m && result[m] && result[m][c.year] !== undefined) {
        result[m][c.year] += c.cost || 0;
      }
    });

    return result;
  }, [costData]);

  // Yearly totals
  const totals = useMemo(() => {
    const res: Record<number, number> = {};
    years.forEach((y) => (res[y] = 0));
    costData.forEach((c) => {
      if (res[c.year] !== undefined) res[c.year] += c.cost || 0;
    });
    return res;
  }, [costData]);

  const monthNames = [
    "Januar", "Februar", "Mart", "April", "Maj", "Juni",
    "Juli", "August", "Septembar", "Oktobar", "Novembar", "Decembar"
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-600" /> Mjesečna & Godišnja Komparacija Troškova (2021 - 2026)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detaljan uporedni pregled po mjesecima i godišnjim trendovima
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Mjesec</th>
                {years.map((y) => (
                  <th key={y} className="p-3 text-right">
                    {y}. god
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <tr key={m} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{monthNames[m - 1]}</td>
                  {years.map((y) => {
                    const val = matrix[m]?.[y] || 0;
                    return (
                      <td key={y} className="p-3 text-right font-medium text-slate-700 dark:text-slate-300">
                        {val > 0 ? formatKM(val) : <span className="text-slate-300 dark:text-slate-600">-</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-900/80 font-black border-t-2 border-slate-300 dark:border-slate-700">
              <tr>
                <td className="p-3 text-slate-900 dark:text-white uppercase">UKUPNO</td>
                {years.map((y) => (
                  <td key={y} className="p-3 text-right text-blue-700 dark:text-blue-400">
                    {formatKM(totals[y] || 0)}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
