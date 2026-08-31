"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import ChartJS from "@/lib/chartSetup.js";
import { calculateFleetByYear, calculateDynamic2026, formatKM } from "@/lib/calculations.js";
import { Truck, DollarSign, Calendar, TrendingDown, Layers, Building2, BarChart2 } from "lucide-react";

export function TransportKpis({
  masterFleet,
  costData,
  onSelectYear,
  onOpenFleetTab,
  onOpenVehicleModal,
  onOpenIntExtRecap,
  onOpenSupplierDetail,
  onOpenSegmentDetail
}) {
  const dynamic2026 = useMemo(() => calculateDynamic2026(masterFleet), [masterFleet]);
  const fleetByYear = useMemo(() => calculateFleetByYear(masterFleet), [masterFleet]);

  // Stanje filtera unutar Tab 1
  const [selectedYearFilter, setSelectedYearFilter] = useState("all");
  const [trendMode, setTrendMode] = useState("yoy"); // 'yoy', 'monthly'

  // Canvas ref-ovi
  const trendCanvasRef = useRef(null);
  const intExtCanvasRef = useRef(null);
  const vehiclesCanvasRef = useRef(null);
  const segmentsCanvasRef = useRef(null);
  const suppliersCanvasRef = useRef(null);

  // Instanca chartova
  const chartInstances = useRef({});

  // Filtrirani podaci za Tab 1
  const filteredCostData = useMemo(() => {
    if (selectedYearFilter === "all") return costData;
    return costData.filter((c) => c.year === parseInt(selectedYearFilter));
  }, [costData, selectedYearFilter]);

  // Godišnje statistike
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

  const filteredTotalCost = useMemo(() => {
    return filteredCostData.reduce((acc, c) => acc + (c.cost || 0), 0);
  }, [filteredCostData]);

  const cost2026 = yearlyStats[2026]?.cost || 0;
  const avgCostPerUnit2026 = dynamic2026.total > 0 ? cost2026 / dynamic2026.total : 0;

  // Crtanje svih 5 grafikona sa bogatim tooltipsima i procentima
  useEffect(() => {
    // 1. Trend Grafikon
    if (trendCanvasRef.current) {
      if (chartInstances.current.trend) chartInstances.current.trend.destroy();
      const ctx = trendCanvasRef.current.getContext("2d");

      if (trendMode === "yoy" || selectedYearFilter === "all") {
        const years = [2021, 2022, 2023, 2024, 2025, 2026];
        const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

        const datasets = years.map((y, idx) => {
          const monthData = Array(12).fill(0);
          costData.forEach((c) => {
            if (c.year === y) {
              const m = c.month || (c.datumObj ? c.datumObj.getMonth() + 1 : null);
              if (m && m >= 1 && m <= 12) {
                monthData[m - 1] += c.cost || 0;
              }
            }
          });
          return {
            label: `${y}. godina`,
            data: monthData,
            borderColor: colors[idx % colors.length],
            backgroundColor: "transparent",
            tension: 0.3,
            borderWidth: 2.5
          };
        });

        chartInstances.current.trend = new ChartJS(ctx, {
          type: "line",
          data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"],
            datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "bottom", labels: { font: { size: 11, weight: "bold" } } },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const yTot = yearlyStats[parseInt(ctx.dataset.label)]?.cost || 1;
                    const p = ((ctx.raw / yTot) * 100).toFixed(1);
                    return ` ${ctx.dataset.label}: ${formatKM(ctx.raw)} (${p}% godišnjeg troška)`;
                  }
                }
              }
            }
          }
        });
      } else {
        const monthInterno = Array(12).fill(0);
        const monthEksterno = Array(12).fill(0);

        filteredCostData.forEach((c) => {
          const m = c.month || (c.datumObj ? c.datumObj.getMonth() + 1 : null);
          if (m && m >= 1 && m <= 12) {
            const isInt =
              (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("bingo") ||
              (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("vlastit");
            if (isInt) monthInterno[m - 1] += c.cost || 0;
            else monthEksterno[m - 1] += c.cost || 0;
          }
        });

        chartInstances.current.trend = new ChartJS(ctx, {
          type: "bar",
          data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"],
            datasets: [
              { label: "Interno Održavanje", data: monthInterno, backgroundColor: "#2563eb", borderRadius: 4 },
              { label: "Eksterno Održavanje", data: monthEksterno, backgroundColor: "#f59e0b", borderRadius: 4 }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { stacked: true }, y: { stacked: true } },
            plugins: {
              legend: { position: "bottom" },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const mIdx = ctx.dataIndex;
                    const monthTotal = monthInterno[mIdx] + monthEksterno[mIdx];
                    const p = monthTotal > 0 ? ((ctx.raw / monthTotal) * 100).toFixed(1) : "0";
                    return ` ${ctx.dataset.label}: ${formatKM(ctx.raw)} (${p}%)`;
                  }
                }
              }
            }
          }
        });
      }
    }

    // 2. Interno vs Eksterno Doughnut (sa procentima u tooltipu)
    if (intExtCanvasRef.current) {
      if (chartInstances.current.intExt) chartInstances.current.intExt.destroy();
      const ctx = intExtCanvasRef.current.getContext("2d");

      let intCost = 0,
        extCost = 0;
      filteredCostData.forEach((c) => {
        const isInt =
          (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("bingo") ||
          (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("vlastit");
        if (isInt) intCost += c.cost || 0;
        else extCost += c.cost || 0;
      });

      const total = intCost + extCost;
      const intPerc = total > 0 ? ((intCost / total) * 100).toFixed(1) : "0";
      const extPerc = total > 0 ? ((extCost / total) * 100).toFixed(1) : "0";

      chartInstances.current.intExt = new ChartJS(ctx, {
        type: "doughnut",
        data: {
          labels: [`Interno (${intPerc}%)`, `Eksterno (${extPerc}%)`],
          datasets: [
            {
              data: [intCost, extCost],
              backgroundColor: ["#2563eb", "#f59e0b"],
              borderWidth: 2,
              borderColor: document.documentElement.classList.contains("dark") ? "#1e293b" : "#ffffff"
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { font: { weight: "bold", size: 11 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = ctx.raw || 0;
                  const p = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
                  return ` ${ctx.label}: ${formatKM(val)} (${p}%)`;
                }
              }
            }
          },
          onClick: (evt, elements) => {
            if (elements.length > 0 && onOpenIntExtRecap) {
              const idx = elements[0].index;
              const type = idx === 0 ? "Interno" : "Eksterno";
              onOpenIntExtRecap(type);
            }
          }
        }
      });
    }

    // 3. Top 10 Vozila po Trošku (sa procentima u tooltipu)
    if (vehiclesCanvasRef.current) {
      if (chartInstances.current.vehicles) chartInstances.current.vehicles.destroy();
      const ctx = vehiclesCanvasRef.current.getContext("2d");

      const vehMap = new Map();
      filteredCostData.forEach((c) => {
        const reg = (c.reg || "").trim().toUpperCase();
        if (reg && reg !== "-") {
          vehMap.set(reg, (vehMap.get(reg) || 0) + (c.cost || 0));
        }
      });

      const sortedVehicles = Array.from(vehMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      chartInstances.current.vehicles = new ChartJS(ctx, {
        type: "bar",
        data: {
          labels: sortedVehicles.map((v) => v[0]),
          datasets: [
            {
              label: "Trošak (KM)",
              data: sortedVehicles.map((v) => v[1]),
              backgroundColor: "#ef4444",
              borderRadius: 4
            }
          ]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = ctx.raw || 0;
                  const p = filteredTotalCost > 0 ? ((val / filteredTotalCost) * 100).toFixed(2) : "0";
                  return ` Trošak: ${formatKM(val)} (${p}% ukupnog troška)`;
                }
              }
            }
          },
          onClick: (e, els, ch) => {
            if (els.length > 0 && onOpenVehicleModal) {
              const clickedReg = ch.data.labels[els[0].index];
              onOpenVehicleModal(clickedReg);
            }
          }
        }
      });
    }

    // 4. Segmenti Doughnut (sa procentima u tooltipu)
    if (segmentsCanvasRef.current) {
      if (chartInstances.current.segments) chartInstances.current.segments.destroy();
      const ctx = segmentsCanvasRef.current.getContext("2d");

      const segMap = new Map();
      filteredCostData.forEach((c) => {
        const seg = c.segment || "Ostalo";
        segMap.set(seg, (segMap.get(seg) || 0) + (c.cost || 0));
      });

      const sortedSegs = Array.from(segMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7);
      const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#64748b"];

      chartInstances.current.segments = new ChartJS(ctx, {
        type: "doughnut",
        data: {
          labels: sortedSegs.map((s) => s[0]),
          datasets: [
            {
              data: sortedSegs.map((s) => s[1]),
              backgroundColor: colors.slice(0, sortedSegs.length),
              borderWidth: 2,
              borderColor: document.documentElement.classList.contains("dark") ? "#1e293b" : "#ffffff"
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "right", labels: { font: { weight: "bold", size: 10 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = ctx.raw || 0;
                  const p = filteredTotalCost > 0 ? ((val / filteredTotalCost) * 100).toFixed(1) : "0";
                  return ` ${ctx.label}: ${formatKM(val)} (${p}%)`;
                }
              }
            }
          },
          onClick: (e, els, ch) => {
            if (els.length > 0 && onOpenSegmentDetail) {
              const segName = ch.data.labels[els[0].index];
              onOpenSegmentDetail(segName);
            }
          }
        }
      });
    }

    // 5. Top 7 Dobavljača / Servisera (sa procentima u tooltipu)
    if (suppliersCanvasRef.current) {
      if (chartInstances.current.suppliers) chartInstances.current.suppliers.destroy();
      const ctx = suppliersCanvasRef.current.getContext("2d");

      const supMap = new Map();
      filteredCostData.forEach((c) => {
        const sup = (c.dobavljacOrig || c.dobavljac || "Vlastita Radionica").trim();
        supMap.set(sup, (supMap.get(sup) || 0) + (c.cost || 0));
      });

      const sortedSups = Array.from(supMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7);

      chartInstances.current.suppliers = new ChartJS(ctx, {
        type: "bar",
        data: {
          labels: sortedSups.map((s) => s[0]),
          datasets: [
            {
              label: "Ukupan iznos popravki (KM)",
              data: sortedSups.map((s) => s[1]),
              backgroundColor: "#6366f1",
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = ctx.raw || 0;
                  const p = filteredTotalCost > 0 ? ((val / filteredTotalCost) * 100).toFixed(1) : "0";
                  return ` Iznos: ${formatKM(val)} (${p}% ukupnog troška)`;
                }
              }
            }
          },
          onClick: (e, els, ch) => {
            if (els.length > 0 && onOpenSupplierDetail) {
              const supName = ch.data.labels[els[0].index];
              if (supName.toLowerCase().includes("vlastit") || supName.toLowerCase().includes("bingo")) {
                if (onOpenIntExtRecap) onOpenIntExtRecap("Interno");
              } else {
                onOpenSupplierDetail(supName);
              }
            }
          }
        }
      });
    }

    return () => {
      Object.values(chartInstances.current).forEach((inst) => inst?.destroy());
    };
  }, [
    filteredCostData,
    trendMode,
    selectedYearFilter,
    yearlyStats,
    filteredTotalCost,
    onOpenVehicleModal,
    onOpenIntExtRecap,
    onOpenSupplierDetail,
    onOpenSegmentDetail
  ]);

  return (
    <div className="w-full space-y-6">
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
            Teretna: <strong className="text-slate-800 dark:text-slate-200">{dynamic2026.teretna}</strong> | Skladišna:{" "}
            <strong className="text-slate-800 dark:text-slate-200">{dynamic2026.skladisna}</strong>
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
            Broj unesenih računa:{" "}
            <strong className="text-slate-800 dark:text-slate-200">
              {yearlyStats[2026]?.count.toLocaleString("bs-BA")}
            </strong>
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

      {/* FILTER TRAKA ZA GRAFIKONE */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-600" />
          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
            Interaktivni Analitički Grafikoni
          </span>
          <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-bold px-2 py-0.5 rounded">
            Klikom na grafikone otvarate detaljne preglede
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 mr-2">Godina:</label>
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="text-xs border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 font-bold bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="all">Sve godine (2021-2026)</option>
              <option value="2026">2026. godina</option>
              <option value="2025">2025. godina</option>
              <option value="2024">2024. godina</option>
              <option value="2023">2023. godina</option>
              <option value="2022">2022. godina</option>
              <option value="2021">2021. godina</option>
            </select>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              onClick={() => setTrendMode("yoy")}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                trendMode === "yoy"
                  ? "bg-white dark:bg-slate-800 text-blue-600 shadow-xs font-black"
                  : "text-slate-500"
              }`}
            >
              YoY Trend
            </button>
            <button
              onClick={() => setTrendMode("monthly")}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                trendMode === "monthly"
                  ? "bg-white dark:bg-slate-800 text-blue-600 shadow-xs font-black"
                  : "text-slate-500"
              }`}
            >
              Interno / Eksterno
            </button>
          </div>
        </div>
      </div>

      {/* GLAVNI RED GRAFIKONA: Trend + Interno vs Eksterno */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend grafik (2 kolone) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
            <span>📈 Mjesečna Dinamika Troškova</span>
            <span className="text-[10px] text-slate-400 font-mono">Chart.js</span>
          </h4>
          <div className="h-[280px] w-full relative">
            <canvas ref={trendCanvasRef} />
          </div>
        </div>

        {/* Interno vs Eksterno (1 kolona) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
              ⚖️ Interno vs Eksterno Održavanje
            </h4>
            <span className="text-[10px] text-blue-600 font-bold bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
              Klik za detalje →
            </span>
          </div>
          <div className="h-[280px] w-full relative flex items-center justify-center cursor-pointer">
            <canvas ref={intExtCanvasRef} />
          </div>
        </div>
      </div>

      {/* DRUGI RED GRAFIKONA: Top 10 Vozila + Segmenti + Dobavljači */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 10 Vozila (Horizontal Bar) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-red-500" /> Top 10 Vozila po Trošku
            </h4>
            <span className="text-[10px] text-indigo-500 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded font-bold">
              Klik za karton →
            </span>
          </div>
          <div className="h-[280px] w-full relative cursor-pointer">
            <canvas ref={vehiclesCanvasRef} />
          </div>
        </div>

        {/* Segmenti Doughnut */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-500" /> Trošak po Segmentima
            </h4>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
              Klik za spisak →
            </span>
          </div>
          <div className="h-[280px] w-full relative flex items-center justify-center cursor-pointer">
            <canvas ref={segmentsCanvasRef} />
          </div>
        </div>

        {/* Top 7 Dobavljača / Servisera */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-500" /> Top Dobavljači & Serviseri
            </h4>
            <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
              Klik za analizu →
            </span>
          </div>
          <div className="h-[280px] w-full relative cursor-pointer">
            <canvas ref={suppliersCanvasRef} />
          </div>
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
                      {y}. godina{" "}
                      {y === 2026 && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 px-2 py-0.5 rounded-full ml-1 font-bold">
                          Tekuća
                        </span>
                      )}
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
