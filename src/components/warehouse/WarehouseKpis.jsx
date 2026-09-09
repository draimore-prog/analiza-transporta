"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import ChartJS from "@/lib/chartSetup.js";
import { formatKM } from "@/lib/calculations.js";
import {
  Boxes,
  DollarSign,
  Calendar,
  Wrench,
  Layers,
  Building2,
  TrendingUp,
  BarChart2,
  Filter,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles
} from "lucide-react";

export function WarehouseKpis({
  warehouseMasterFleet = [],
  warehouseCostData = [],
  onSelectYear,
  onOpenFleetTab,
  onOpenVehicleModal,
  onOpenIntExtRecap,
  onOpenSupplierDetail,
  onOpenSegmentDetail
}) {
  // Stanja filtera unutar Skladišnog KPI pregleda
  const [selectedYearFilter, setSelectedYearFilter] = useState("all");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("all");
  const [supplierMode, setSupplierMode] = useState("all"); // 'all', 'external', 'internal'

  // Canvas ref-ovi za 5 interaktivnih grafikona
  const trendCanvasRef = useRef(null);
  const intExtCanvasRef = useRef(null);
  const vehiclesCanvasRef = useRef(null);
  const segCanvasRef = useRef(null);
  const supCanvasRef = useRef(null);

  // Instanca chartova
  const chartInstances = useRef({});

  // Raspoložive godine
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(warehouseCostData.map((c) => c.year))).filter(Boolean).sort((a, b) => b - a);
    return years.length > 0 ? years : [2026, 2025, 2024, 2023, 2022, 2021];
  }, [warehouseCostData]);

  const monthsList = [
    { value: "all", label: "Svi mjeseci (1-12)" },
    { value: "1", label: "1. Januar" },
    { value: "2", label: "2. Februar" },
    { value: "3", label: "3. Mart" },
    { value: "4", label: "4. April" },
    { value: "5", label: "5. Maj" },
    { value: "6", label: "6. Juni" },
    { value: "7", label: "7. Juli" },
    { value: "8", label: "8. August" },
    { value: "9", label: "9. Septembar" },
    { value: "10", label: "10. Oktobar" },
    { value: "11", label: "11. Novembar" },
    { value: "12", label: "12. Decembar" }
  ];

  // Filtrirani podaci na osnovu selektovane godine, mjeseca i načina održavanja
  const filteredCostData = useMemo(() => {
    return warehouseCostData.filter((c) => {
      if (selectedYearFilter !== "all" && c.year !== parseInt(selectedYearFilter)) {
        return false;
      }
      if (selectedMonthFilter !== "all") {
        const m = c.month || (c.datumObj ? c.datumObj.getMonth() + 1 : (c.datum ? new Date(c.datum).getMonth() + 1 : null));
        if (m !== parseInt(selectedMonthFilter)) {
          return false;
        }
      }
      const isInt =
        (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("bingo") ||
        (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("vlastit") ||
        (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("intern");

      if (supplierMode === "external" && isInt) return false;
      if (supplierMode === "internal" && !isInt) return false;

      return true;
    });
  }, [warehouseCostData, selectedYearFilter, selectedMonthFilter, supplierMode]);

  // Aktivne mašine
  const activeCount = useMemo(() => {
    return warehouseMasterFleet.filter((v) => {
      const st = (v.status || "Aktivno").toLowerCase();
      return !st.includes("prodat") && !st.includes("rashod") && !st.includes("neaktivno");
    }).length;
  }, [warehouseMasterFleet]);

  // Izračun 6 KPI metrika
  const kpiStats = useMemo(() => {
    let totalCost = 0;
    let internalCost = 0;
    let externalCost = 0;
    const segMap = {};

    filteredCostData.forEach((c) => {
      const cost = c.cost || 0;
      totalCost += cost;

      const isInt =
        (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("bingo") ||
        (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("vlastit") ||
        (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("intern");

      if (isInt) internalCost += cost;
      else externalCost += cost;

      const seg = c.segment || "Ostalo";
      segMap[seg] = (segMap[seg] || 0) + cost;
    });

    const totalCount = filteredCostData.length;
    const avgPerIntervention = totalCount > 0 ? totalCost / totalCount : 0;
    const internalPerc = totalCost > 0 ? ((internalCost / totalCost) * 100).toFixed(1) : "0";
    const externalPerc = totalCost > 0 ? ((externalCost / totalCost) * 100).toFixed(1) : "0";

    // Top segment
    let topSeg = "-";
    let topSegCost = 0;
    Object.entries(segMap).forEach(([seg, cost]) => {
      if (cost > topSegCost) {
        topSegCost = cost;
        topSeg = seg;
      }
    });

    // Dnevni prosjek po mašini
    const activeUnits = activeCount || 1;
    const days = selectedMonthFilter !== "all" ? 30.4 : 365;
    const dailyAvgPerMachine = (totalCost / (activeUnits * days));

    return {
      totalCost,
      totalCount,
      internalCost,
      externalCost,
      internalPerc,
      externalPerc,
      avgPerIntervention,
      topSeg,
      topSegCost,
      dailyAvgPerMachine
    };
  }, [filteredCostData, activeCount, selectedMonthFilter]);

  // Top mašine po trošku u selekciji
  const topVehicles = useMemo(() => {
    const costMap = new Map();
    filteredCostData.forEach((c) => {
      const reg = (c.reg || "").trim().toUpperCase();
      if (reg && reg !== "-") {
        costMap.set(reg, (costMap.get(reg) || 0) + (c.cost || 0));
      }
    });

    const sorted = Array.from(costMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return sorted.map(([reg, cost]) => {
      const vInfo = warehouseMasterFleet.find((v) => (v.reg || "").toUpperCase() === reg);
      return {
        reg,
        cost,
        marka: vInfo?.markaVoz || "Viljuškar",
        model: vInfo?.modelVoz || "",
        gb: vInfo?.garazniBroj || "-",
        radniSati: vInfo?.radniSati ?? 0
      };
    });
  }, [filteredCostData, warehouseMasterFleet]);

  // Reset filtera
  const resetFilters = () => {
    setSelectedYearFilter("all");
    setSelectedMonthFilter("all");
    setSupplierMode("all");
  };

  const isFilterActive = selectedYearFilter !== "all" || selectedMonthFilter !== "all" || supplierMode !== "all";

  // Crtanje i ažuriranje 5 grafikona
  useEffect(() => {
    // ----------------------------------------------------
    // 1. Mjesečni / Godišnji Trend Dinamike Troškova
    // ----------------------------------------------------
    if (trendCanvasRef.current) {
      if (chartInstances.current.trend) chartInstances.current.trend.destroy();
      const ctx = trendCanvasRef.current.getContext("2d");

      if (selectedYearFilter === "all") {
        // Prikaz svih godina (2021-2026) sa internim i eksternim troškom
        const years = [2021, 2022, 2023, 2024, 2025, 2026];
        const intCosts = Array(years.length).fill(0);
        const extCosts = Array(years.length).fill(0);

        warehouseCostData.forEach((c) => {
          const yIdx = years.indexOf(c.year);
          if (yIdx !== -1) {
            if (selectedMonthFilter !== "all") {
              const m = c.month || (c.datumObj ? c.datumObj.getMonth() + 1 : null);
              if (m !== parseInt(selectedMonthFilter)) return;
            }
            const isInt =
              (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("bingo") ||
              (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("vlastit") ||
              (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("intern");

            if (isInt) intCosts[yIdx] += c.cost || 0;
            else extCosts[yIdx] += c.cost || 0;
          }
        });

        chartInstances.current.trend = new ChartJS(ctx, {
          type: "bar",
          data: {
            labels: years.map((y) => `${y}.`),
            datasets: [
              {
                label: "Vlastita Radionica (Interno)",
                data: intCosts,
                backgroundColor: "#2563eb",
                borderRadius: 6
              },
              {
                label: "Vanjski Servisi (Eksterno)",
                data: extCosts,
                backgroundColor: "#f59e0b",
                borderRadius: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { stacked: true, grid: { display: false } },
              y: { stacked: true, ticks: { callback: (v) => formatKM(v) } }
            },
            plugins: {
              datalabels: {
                display: true,
                color: "#ffffff",
                font: { weight: "bold", size: 10 },
                formatter: (val) => (val > 10000 ? `${(val / 1000).toFixed(0)}k` : "")
              },
              legend: { position: "top", labels: { font: { weight: "bold", size: 11 } } },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${ctx.dataset.label}: ${formatKM(ctx.raw)}`
                }
              }
            },
            onClick: (e, els, ch) => {
              if (els.length > 0) {
                const clickedYear = years[els[0].index];
                setSelectedYearFilter(String(clickedYear));
              }
            }
          }
        });
      } else {
        // Prikaz odabrane godine kroz 12 mjeseci
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
        const intMonths = Array(12).fill(0);
        const extMonths = Array(12).fill(0);

        warehouseCostData.forEach((c) => {
          if (c.year === parseInt(selectedYearFilter)) {
            const m = c.month || (c.datumObj ? c.datumObj.getMonth() + 1 : null);
            if (m && m >= 1 && m <= 12) {
              const isInt =
                (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("bingo") ||
                (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("vlastit") ||
                (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("intern");

              if (isInt) intMonths[m - 1] += c.cost || 0;
              else extMonths[m - 1] += c.cost || 0;
            }
          }
        });

        chartInstances.current.trend = new ChartJS(ctx, {
          type: "bar",
          data: {
            labels: monthNames,
            datasets: [
              {
                label: "Vlastita Radionica (Interno)",
                data: intMonths,
                backgroundColor: "#2563eb",
                borderRadius: 5
              },
              {
                label: "Vanjski Servisi (Eksterno)",
                data: extMonths,
                backgroundColor: "#f59e0b",
                borderRadius: 5
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { stacked: true, grid: { display: false } },
              y: { stacked: true, ticks: { callback: (v) => formatKM(v) } }
            },
            plugins: {
              datalabels: { display: false },
              legend: { position: "top", labels: { font: { weight: "bold", size: 11 } } },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${ctx.dataset.label}: ${formatKM(ctx.raw)}`
                }
              }
            },
            onClick: (e, els) => {
              if (els.length > 0 && onSelectYear) {
                onSelectYear(selectedYearFilter);
              }
            }
          }
        });
      }
    }

    // ----------------------------------------------------
    // 2. Interno vs Eksterno Održavanje (Doughnut)
    // ----------------------------------------------------
    if (intExtCanvasRef.current) {
      if (chartInstances.current.intExt) chartInstances.current.intExt.destroy();
      const ctx = intExtCanvasRef.current.getContext("2d");
      const total = kpiStats.totalCost;

      chartInstances.current.intExt = new ChartJS(ctx, {
        type: "doughnut",
        data: {
          labels: [`Interno (${kpiStats.internalPerc}%)`, `Eksterno (${kpiStats.externalPerc}%)`],
          datasets: [
            {
              data: [kpiStats.internalCost, kpiStats.externalCost],
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
            datalabels: {
              display: true,
              color: "#ffffff",
              font: { weight: "900", size: 12 },
              formatter: (val) => {
                if (total === 0 || val === 0) return "";
                return `${((val / total) * 100).toFixed(1)}%`;
              }
            },
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
              onOpenIntExtRecap(idx === 0 ? "Interno" : "Eksterno");
            }
          }
        }
      });
    }

    // ----------------------------------------------------
    // 3. Top 10 Mašina / Viljuškara po Trošku (Horizontal Bar)
    // ----------------------------------------------------
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

      const labels = sortedVehicles.map(([reg]) => {
        const v = warehouseMasterFleet.find((x) => (x.reg || "").toUpperCase() === reg);
        return v?.garazniBroj ? `${reg} (GB: ${v.garazniBroj})` : reg;
      });

      chartInstances.current.vehicles = new ChartJS(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Trošak mehanizacije (KM)",
              data: sortedVehicles.map((v) => v[1]),
              backgroundColor: "#f59e0b",
              borderRadius: 4
            }
          ]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            datalabels: {
              display: true,
              color: "#ffffff",
              anchor: "end",
              align: "start",
              offset: 4,
              font: { weight: "bold", size: 10 },
              formatter: (value) => {
                if (kpiStats.totalCost === 0 || value === 0) return "";
                return `${((value / kpiStats.totalCost) * 100).toFixed(1)}%`;
              }
            },
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = ctx.raw || 0;
                  const p = kpiStats.totalCost > 0 ? ((val / kpiStats.totalCost) * 100).toFixed(2) : "0";
                  return ` Trošak: ${formatKM(val)} (${p}% skladišta)`;
                }
              }
            }
          },
          onClick: (e, els) => {
            if (els.length > 0 && onOpenVehicleModal) {
              const reg = sortedVehicles[els[0].index][0];
              onOpenVehicleModal(reg);
            }
          }
        }
      });
    }

    // ----------------------------------------------------
    // 4. Raspodjela po Segmentima (Doughnut)
    // ----------------------------------------------------
    if (segCanvasRef.current) {
      if (chartInstances.current.seg) chartInstances.current.seg.destroy();
      const ctx = segCanvasRef.current.getContext("2d");

      const segMap = new Map();
      filteredCostData.forEach((c) => {
        const seg = c.segment || "Ostalo";
        segMap.set(seg, (segMap.get(seg) || 0) + (c.cost || 0));
      });

      const sortedSegs = Array.from(segMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7);

      const colors = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];
      const segSum = sortedSegs.reduce((acc, s) => acc + s[1], 0);

      chartInstances.current.seg = new ChartJS(ctx, {
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
            datalabels: {
              display: true,
              color: "#ffffff",
              font: { weight: "bold", size: 10 },
              formatter: (value) => {
                if (segSum === 0 || value < segSum * 0.04) return "";
                return `${((value / segSum) * 100).toFixed(1)}%`;
              }
            },
            legend: { position: "right", labels: { font: { weight: "bold", size: 10 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = ctx.raw || 0;
                  const p = segSum > 0 ? ((val / segSum) * 100).toFixed(1) : "0";
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

    // ----------------------------------------------------
    // 5. Glavni Partneri i Serviseri (Bar)
    // ----------------------------------------------------
    if (supCanvasRef.current) {
      if (chartInstances.current.sup) chartInstances.current.sup.destroy();
      const ctx = supCanvasRef.current.getContext("2d");

      const supMap = new Map();
      filteredCostData.forEach((c) => {
        const sup = (c.dobavljacOrig || c.dobavljac || "Vlastita Radionica").trim();
        if (sup && sup !== "-") {
          supMap.set(sup, (supMap.get(sup) || 0) + (c.cost || 0));
        }
      });

      const sortedSups = Array.from(supMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

      chartInstances.current.sup = new ChartJS(ctx, {
        type: "bar",
        data: {
          labels: sortedSups.map((s) => s[0]),
          datasets: [
            {
              label: "Iznos opravki (KM)",
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
            datalabels: {
              display: true,
              color: "#ffffff",
              anchor: "end",
              align: "start",
              offset: 4,
              font: { weight: "bold", size: 10 },
              formatter: (value) => {
                if (kpiStats.totalCost === 0 || value === 0) return "";
                return `${((value / kpiStats.totalCost) * 100).toFixed(1)}%`;
              }
            },
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = ctx.raw || 0;
                  const p = kpiStats.totalCost > 0 ? ((val / kpiStats.totalCost) * 100).toFixed(1) : "0";
                  return ` Iznos: ${formatKM(val)} (${p}% ukupnog)`;
                }
              }
            }
          },
          onClick: (e, els, ch) => {
            if (els.length > 0) {
              const supName = ch.data.labels[els[0].index];
              if (
                supName.toLowerCase().includes("vlastit") ||
                supName.toLowerCase().includes("bingo") ||
                supName.toLowerCase().includes("intern")
              ) {
                if (onOpenIntExtRecap) onOpenIntExtRecap("Interno");
              } else {
                if (onOpenSupplierDetail) onOpenSupplierDetail(supName);
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
    warehouseCostData,
    selectedYearFilter,
    selectedMonthFilter,
    supplierMode,
    kpiStats,
    warehouseMasterFleet,
    onOpenIntExtRecap,
    onOpenVehicleModal,
    onOpenSegmentDetail,
    onOpenSupplierDetail,
    onSelectYear
  ]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* FILTER TRAKA ZA SKLADIŠNU MEHANIZACIJU */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5 text-amber-500" /> Filter analitike:
          </span>

          {/* Godina */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="all">Sve godine (2021 - 2026)</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}. godina
                </option>
              ))}
            </select>
          </div>

          {/* Mjesec */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              {monthsList.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Režim održavanja (Interno / Eksterno / Svi) */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setSupplierMode("all")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                supplierMode === "all"
                  ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Svi servisi
            </button>
            <button
              onClick={() => setSupplierMode("external")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                supplierMode === "external"
                  ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Vanjski partneri
            </button>
            <button
              onClick={() => setSupplierMode("internal")}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                supplierMode === "internal"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Vlastita radionica
            </button>
          </div>

          {isFilterActive && (
            <button
              onClick={resetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        <div className="text-right">
          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
            Prikazano: <strong className="text-slate-700 dark:text-slate-300">{filteredCostData.length}</strong> naloga /{" "}
            <strong className="text-amber-600 dark:text-amber-400">{formatKM(kpiStats.totalCost)}</strong>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6 KLJUČNIH KPI KARTICA ZA SKLADIŠNU MEHANIZACIJU */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Kartica 1: Ukupan Utrošak */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border-l-4 border-amber-500 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Ukupan Utrošak
            </span>
            <span className="p-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {formatKM(kpiStats.totalCost)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">
            {selectedYearFilter === "all" ? "Konsolidovano (2021-2026)" : `${selectedYearFilter}. godina`}
          </p>
        </div>

        {/* Kartica 2: Aktivne Mašine */}
        <div
          onClick={onOpenFleetTab}
          className="bg-white dark:bg-slate-800 p-4 rounded-2xl border-l-4 border-emerald-500 border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:border-emerald-600 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Aktivne Mašine
            </span>
            <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
              <Boxes className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {activeCount.toLocaleString("bs-BA")}
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold group-hover:underline">
            Pregled flote (Tab 2) →
          </p>
        </div>

        {/* Kartica 3: Broj Opravki */}
        <div
          onClick={() => onSelectYear && onSelectYear(selectedYearFilter !== "all" ? selectedYearFilter : "all")}
          className="bg-white dark:bg-slate-800 p-4 rounded-2xl border-l-4 border-indigo-500 border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:border-indigo-600 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Broj Opravki
            </span>
            <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
              <Wrench className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
            {kpiStats.totalCount.toLocaleString("bs-BA")}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium group-hover:text-indigo-500">
            Otvori tabelu servisa →
          </p>
        </div>

        {/* Kartica 4: Interno Održavanje */}
        <div
          onClick={() => onOpenIntExtRecap && onOpenIntExtRecap("Interno")}
          className="bg-white dark:bg-slate-800 p-4 rounded-2xl border-l-4 border-blue-600 border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:border-blue-700 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Vlastita Radionica
            </span>
            <span className="text-[10px] font-mono font-black text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 px-1.5 py-0.5 rounded">
              {kpiStats.internalPerc}%
            </span>
          </div>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400">
            {formatKM(kpiStats.internalCost)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium group-hover:text-blue-500">
            Karton radionice →
          </p>
        </div>

        {/* Kartica 5: Vanjski Partneri */}
        <div
          onClick={() => onOpenIntExtRecap && onOpenIntExtRecap("Eksterno")}
          className="bg-white dark:bg-slate-800 p-4 rounded-2xl border-l-4 border-amber-600 border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:border-amber-700 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Vanjski Servisi
            </span>
            <span className="text-[10px] font-mono font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded">
              {kpiStats.externalPerc}%
            </span>
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400">
            {formatKM(kpiStats.externalCost)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium group-hover:text-amber-500">
            Karton partnera →
          </p>
        </div>

        {/* Kartica 6: Prosjek po Opravci */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border-l-4 border-purple-500 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Prosjek po Opravci
            </span>
            <span className="p-1.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {formatKM(kpiStats.avgCostPerIntervention)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">
            Top segment: <strong className="text-slate-700 dark:text-slate-300">{kpiStats.topSeg}</strong>
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5 KLIKABILNIH GRAFIKONA ZA SKLADIŠNU MEHANIZACIJU */}
      {/* ========================================================================= */}

      {/* Red 1: Mjesečni Trend + Interno vs Eksterno */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafikon 1: Trend Dinamike Troškova (2 kolone) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-500" /> Dinamika i Trend Troškova Održavanja
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedYearFilter === "all"
                  ? "Poređenje troškova kroz godine 2021-2026 (Kliknite na stubac za analizu te godine)"
                  : `Mjesečna distribucija troškova u ${selectedYearFilter}. godini`}
              </p>
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full">
              Klikabilan grafikon 👆
            </span>
          </div>
          <div className="h-[280px] w-full relative">
            <canvas ref={trendCanvasRef} />
          </div>
        </div>

        {/* Grafikon 2: Interno vs Eksterno Održavanje (Doughnut) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" /> Vlastita Radionica vs Eksterni
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Udio troškova internog i vanjskog servisa
              </p>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
              Klik za detalje
            </span>
          </div>
          <div className="h-[280px] w-full relative flex items-center justify-center">
            <canvas ref={intExtCanvasRef} />
          </div>
        </div>
      </div>

      {/* Red 2: Top 10 Mašina + Segmenti + Partneri */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafikon 3: Top 10 Mašina / Viljuškara (Horizontal Bar) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-amber-500" /> Top 10 Mašina po Trošku
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Klik na viljuškar otvara karton vozila
              </p>
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
              Karton 🚜
            </span>
          </div>
          <div className="h-[300px] w-full relative">
            <canvas ref={vehiclesCanvasRef} />
          </div>
        </div>

        {/* Grafikon 4: Segmenti Troškova (Doughnut) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-500" /> Raspodjela po Segmentima
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Baterije, Točkovi, Hidraulika, Mehanika...
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
              Podizvještaj 🏬
            </span>
          </div>
          <div className="h-[300px] w-full relative flex items-center justify-center">
            <canvas ref={segCanvasRef} />
          </div>
        </div>

        {/* Grafikon 5: Glavni Partneri i Serviseri (Bar) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-500" /> Vodeći Partneri i Serviseri
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Linde, Jungheinrich, Still, Vlastita radionica...
              </p>
            </div>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
              Karton 🏢
            </span>
          </div>
          <div className="h-[300px] w-full relative">
            <canvas ref={supCanvasRef} />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KARTICE TOP VILJUŠKARA SA NAJVEĆIM TROŠKOVIMA NA DNU */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🚜 Vodeća Skladišna Mehanizacija po Troškovima Intervencija</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Klik na bilo koju mašinu otvara detaljan karton, historiju popravki, radne sate i zamijenjene dijelove
            </p>
          </div>
          <button
            onClick={onOpenFleetTab}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1 cursor-pointer"
          >
            Sve mašine u floti ({warehouseMasterFleet.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {topVehicles.map((v, idx) => (
            <div
              key={v.reg}
              onClick={() => onOpenVehicleModal(v.reg)}
              className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between cursor-pointer hover:border-amber-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black text-[11px] flex items-center justify-center">
                  #{idx + 1}
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  GB: {v.gb}
                </span>
              </div>

              <div>
                <p className="font-black text-xs text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors truncate">
                  {v.reg}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {v.marka} {v.model}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Utrošak</span>
                  <span className="font-black text-xs text-amber-600 dark:text-amber-400">
                    {formatKM(v.cost)}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-slate-400 group-hover:text-amber-500 flex items-center gap-0.5">
                  Karton →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
