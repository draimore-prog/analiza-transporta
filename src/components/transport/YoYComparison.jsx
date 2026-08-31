"use client";

import React, { useMemo, useRef, useEffect } from "react";
import ChartJS from "@/lib/chartSetup.js";
import { formatKM } from "@/lib/calculations.js";
import { RefreshCw, BarChart2 } from "lucide-react";

export function YoYComparison({ costData, onSelectYear }) {
  const years = [2021, 2022, 2023, 2024, 2025, 2026];

  const chartUnitsRef = useRef(null);
  const chartTypeRef = useRef(null);
  const chartSegmentRef = useRef(null);
  const chartInterventionsRef = useRef(null);
  const chartInstances = useRef({});

  // Mjesečna matrica
  const matrix = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const result = {};

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

  // Godišnji zbirovi
  const totals = useMemo(() => {
    const res = {};
    const counts = {};
    years.forEach((y) => {
      res[y] = 0;
      counts[y] = 0;
    });
    costData.forEach((c) => {
      if (res[c.year] !== undefined) {
        res[c.year] += c.cost || 0;
        counts[c.year] += 1;
      }
    });
    return { costs: res, counts };
  }, [costData]);

  // Render 4 YoY bar charts
  useEffect(() => {
    const fleetCounts = [1046, 1083, 1113, 1079, 1079, 938];
    const costTotals = years.map((y) => totals.costs[y] || 0);
    const interventionTotals = years.map((y) => totals.counts[y] || 0);

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true },
        x: { grid: { display: false }, ticks: { font: { size: 10, weight: "bold" } } }
      }
    };

    // 1. Broj jedinica
    if (chartUnitsRef.current) {
      if (chartInstances.current.units) chartInstances.current.units.destroy();
      chartInstances.current.units = new ChartJS(chartUnitsRef.current.getContext("2d"), {
        type: "bar",
        data: {
          labels: ["2021", "2022", "2023", "2024", "2025", "2026"],
          datasets: [{
            label: "Broj jedinica",
            data: fleetCounts,
            backgroundColor: ["#94a3b8", "#94a3b8", "#94a3b8", "#94a3b8", "#94a3b8", "#2563eb"],
            borderRadius: 4
          }]
        },
        options: commonOptions
      });
    }

    // 2. Trošak (Ukupno)
    if (chartTypeRef.current) {
      if (chartInstances.current.type) chartInstances.current.type.destroy();
      chartInstances.current.type = new ChartJS(chartTypeRef.current.getContext("2d"), {
        type: "bar",
        data: {
          labels: ["2021", "2022", "2023", "2024", "2025", "2026"],
          datasets: [{
            label: "Ukupan trošak (KM)",
            data: costTotals,
            backgroundColor: ["#94a3b8", "#94a3b8", "#94a3b8", "#94a3b8", "#94a3b8", "#4f46e5"],
            borderRadius: 4
          }]
        },
        options: {
          ...commonOptions,
          plugins: {
            tooltip: {
              callbacks: {
                label: (ctx) => ` Trošak: ${formatKM(ctx.raw)}`
              }
            }
          }
        }
      });
    }

    // 3. Trošak po jedinici
    if (chartSegmentRef.current) {
      if (chartInstances.current.segment) chartInstances.current.segment.destroy();
      const avgUnitCost = years.map((y, idx) => (fleetCounts[idx] > 0 ? (totals.costs[y] || 0) / fleetCounts[idx] : 0));
      chartInstances.current.segment = new ChartJS(chartSegmentRef.current.getContext("2d"), {
        type: "bar",
        data: {
          labels: ["2021", "2022", "2023", "2024", "2025", "2026"],
          datasets: [{
            label: "Prosjek po jedinici (KM)",
            data: avgUnitCost,
            backgroundColor: ["#94a3b8", "#94a3b8", "#94a3b8", "#94a3b8", "#94a3b8", "#f59e0b"],
            borderRadius: 4
          }]
        },
        options: {
          ...commonOptions,
          plugins: {
            tooltip: {
              callbacks: {
                label: (ctx) => ` Prosjek: ${formatKM(ctx.raw)}`
              }
            }
          }
        }
      });
    }

    // 4. Broj intervencija
    if (chartInterventionsRef.current) {
      if (chartInstances.current.interventions) chartInstances.current.interventions.destroy();
      chartInstances.current.interventions = new ChartJS(chartInterventionsRef.current.getContext("2d"), {
        type: "bar",
        data: {
          labels: ["2021", "2022", "2023", "2024", "2025", "2026"],
          datasets: [{
            label: "Broj intervencija",
            data: interventionTotals,
            backgroundColor: ["#94a3b8", "#94a3b8", "#94a3b8", "#94a3b8", "#94a3b8", "#10b981"],
            borderRadius: 4
          }]
        },
        options: commonOptions
      });
    }

    return () => {
      Object.values(chartInstances.current).forEach((inst) => inst?.destroy());
    };
  }, [totals]);

  const monthNames = [
    "Januar", "Februar", "Mart", "April", "Maj", "Juni",
    "Juli", "August", "Septembar", "Oktobar", "Novembar", "Decembar"
  ];

  return (
    <div className="space-y-6">
      {/* 4 YoY Trend Grafikona */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <span className="text-[11px] font-extrabold uppercase text-slate-500 mb-2">🚛 Broj Jedinica u Floti</span>
          <div className="h-[140px] w-full relative">
            <canvas ref={chartUnitsRef} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <span className="text-[11px] font-extrabold uppercase text-slate-500 mb-2">💰 Ukupan Trošak Održavanja</span>
          <div className="h-[140px] w-full relative">
            <canvas ref={chartTypeRef} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <span className="text-[11px] font-extrabold uppercase text-slate-500 mb-2">📊 Prosjek po Vozilu</span>
          <div className="h-[140px] w-full relative">
            <canvas ref={chartSegmentRef} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <span className="text-[11px] font-extrabold uppercase text-slate-500 mb-2">🔧 Broj Servisnih Naloga</span>
          <div className="h-[140px] w-full relative">
            <canvas ref={chartInterventionsRef} />
          </div>
        </div>
      </div>

      {/* Mjesečna i godišnja matrica */}
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
                    {formatKM(totals.costs[y] || 0)}
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
