"use client";

import React, { useMemo, useRef, useEffect } from "react";
import ChartJS from "@/lib/chartSetup.js";
import { formatKM } from "@/lib/calculations.js";
import { Boxes, DollarSign, Calendar, Wrench, Layers, Building2 } from "lucide-react";

export function WarehouseKpis({
  warehouseMasterFleet,
  warehouseCostData,
  onSelectYear,
  onOpenFleetTab,
  onOpenVehicleModal
}) {
  const segCanvasRef = useRef(null);
  const supCanvasRef = useRef(null);
  const chartInstances = useRef({});

  // Aktivne mašine
  const activeCount = useMemo(() => {
    return warehouseMasterFleet.filter((v) => {
      const st = (v.status || "Aktivno").toLowerCase();
      return !st.includes("prodat") && !st.includes("rashod") && !st.includes("neaktivno");
    }).length;
  }, [warehouseMasterFleet]);

  // Ukupan trošak
  const totalCost = useMemo(() => {
    return warehouseCostData.reduce((acc, c) => acc + (c.cost || 0), 0);
  }, [warehouseCostData]);

  // Trošak 2026
  const cost2026 = useMemo(() => {
    return warehouseCostData
      .filter((c) => c.year === 2026)
      .reduce((acc, c) => acc + (c.cost || 0), 0);
  }, [warehouseCostData]);

  // Ukupno opravki
  const totalRepairs = warehouseCostData.length;

  // Top 5 viljuškara po trošku
  const topVehicles = useMemo(() => {
    const costMap = new Map();
    warehouseCostData.forEach((c) => {
      const reg = (c.reg || "").trim().toUpperCase();
      if (reg && reg !== "-") {
        costMap.set(reg, (costMap.get(reg) || 0) + (c.cost || 0));
      }
    });

    const sorted = Array.from(costMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return sorted.map(([reg, cost]) => {
      const vInfo = warehouseMasterFleet.find((v) => v.reg.toUpperCase() === reg);
      return {
        reg,
        cost,
        marka: vInfo?.markaVoz || "Viljuškar",
        model: vInfo?.modelVoz || "",
        gb: vInfo?.garazniBroj || "-"
      };
    });
  }, [warehouseCostData, warehouseMasterFleet]);

  // Crtanje skladišnih grafikona
  useEffect(() => {
    // 1. Segmenti skladišta
    if (segCanvasRef.current) {
      if (chartInstances.current.seg) chartInstances.current.seg.destroy();
      const segMap = new Map();
      warehouseCostData.forEach((c) => {
        const seg = c.segment || "Ostalo";
        segMap.set(seg, (segMap.get(seg) || 0) + (c.cost || 0));
      });
      const sortedSegs = Array.from(segMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
      const colors = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#64748b"];

      chartInstances.current.seg = new ChartJS(segCanvasRef.current.getContext("2d"), {
        type: "doughnut",
        data: {
          labels: sortedSegs.map((s) => s[0]),
          datasets: [{
            data: sortedSegs.map((s) => s[1]),
            backgroundColor: colors.slice(0, sortedSegs.length),
            borderWidth: 2,
            borderColor: document.documentElement.classList.contains("dark") ? "#1e293b" : "#ffffff"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "right", labels: { font: { weight: "bold", size: 10 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${formatKM(ctx.raw)}`
              }
            }
          }
        }
      });
    }

    // 2. Serviseri mehanizacije
    if (supCanvasRef.current) {
      if (chartInstances.current.sup) chartInstances.current.sup.destroy();
      const supMap = new Map();
      warehouseCostData.forEach((c) => {
        const sup = (c.dobavljacOrig || c.dobavljac || "Vlastita Radionica").trim();
        supMap.set(sup, (supMap.get(sup) || 0) + (c.cost || 0));
      });
      const sortedSups = Array.from(supMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);

      chartInstances.current.sup = new ChartJS(supCanvasRef.current.getContext("2d"), {
        type: "bar",
        data: {
          labels: sortedSups.map((s) => s[0]),
          datasets: [{
            label: "Trošak (KM)",
            data: sortedSups.map((s) => s[1]),
            backgroundColor: "#f59e0b",
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` Iznos: ${formatKM(ctx.raw)}`
              }
            }
          }
        }
      });
    }

    return () => {
      Object.values(chartInstances.current).forEach((inst) => inst?.destroy());
    };
  }, [warehouseCostData]);

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Kartice */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kartica 1: Aktivne mašine */}
        <div
          onClick={onOpenFleetTab}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-amber-500 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md hover:border-amber-600 transition-all group"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Aktivna Mehanizacija
            </span>
            <span className="p-2 bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
              <Boxes className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {activeCount.toLocaleString("bs-BA")}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Viljuškari, paletari i radne mašine
          </p>
        </div>

        {/* Kartica 2: Ukupan trošak */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-emerald-500 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ukupan Utrošak Servisa
            </span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {formatKM(totalCost)}
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
            Skladišna mehanizacija 2026
          </p>
        </div>

        {/* Kartica 4: Broj opravki */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-blue-500 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Evidentiranih Opravki
            </span>
            <span className="p-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <Wrench className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {totalRepairs.toLocaleString("bs-BA")}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Zamjene baterija, točkova, servisi
          </p>
        </div>
      </div>

      {/* DVA GRAFIKONA ZA SKLADIŠNU MEHANIZACIJU */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-500" /> Raspodjela Troškova po Segmentima
          </h4>
          <div className="h-[260px] w-full relative flex items-center justify-center">
            <canvas ref={segCanvasRef} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-amber-600" /> Glavni Partneri i Serviseri
          </h4>
          <div className="h-[260px] w-full relative">
            <canvas ref={supCanvasRef} />
          </div>
        </div>
      </div>

      {/* Top 5 viljuškara */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <span>🚜 Top 5 Mašina sa Najvećim Troškovima Održavanja</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Klik na mašinu otvara karton i kompletnu historiju popravki
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {topVehicles.map((v, idx) => (
            <div
              key={v.reg}
              onClick={() => onOpenVehicleModal(v.reg)}
              className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center cursor-pointer hover:border-amber-400 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-black text-xs flex items-center justify-center">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-black text-xs text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                    {v.reg}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {v.marka} {v.model} (GB: {v.gb})
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-xs text-amber-700 dark:text-amber-400">
                  {formatKM(v.cost)}
                </span>
                <p className="text-[9px] text-slate-400 group-hover:text-amber-500">Karton →</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
