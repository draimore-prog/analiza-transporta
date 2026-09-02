"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import ChartJS from "@/lib/chartSetup.js";
import { formatKM, cleanVehicleType } from "@/lib/calculations.js";
import { Building2, BarChart2, Calendar, Filter, Truck, RotateCcw } from "lucide-react";

const KPI_TOTAL_FLEET_BY_YEAR = {
  2021: { Total: 661 },
  2022: { Total: 623 },
  2023: { Total: 652 },
  2024: { Total: 747 },
  2025: { Total: 939 },
  2026: { Total: 938 }
};

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
  // Stanje filtera unutar Tab 1 (KPI Pregled)
  const [selectedYearFilter, setSelectedYearFilter] = useState("all");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("all");
  const [selectedTipFilter, setSelectedTipFilter] = useState("all");
  const [supplierMode, setSupplierMode] = useState("external"); // 'external' (default), 'internal', 'all'

  // Unikatni tipovi vozila za filter
  const distinctTypes = useMemo(() => {
    const set = new Set();
    costData.forEach((c) => {
      const cleanT = cleanVehicleType(c.tipMehan);
      if (cleanT && cleanT !== "Servis motornih vozila") {
        set.add(cleanT);
      }
    });
    const order = [
      "Teretna vozila",
      "Putnička vozila",
      "Skladišna mehanizacija",
      "Priključna vozila",
      "Radna mašina"
    ];
    const present = Array.from(set);
    const ordered = order.filter((o) => present.includes(o));
    const extra = present.filter((p) => !order.includes(p));
    return [...ordered, ...extra];
  }, [costData]);

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

  // Canvas ref-ovi
  const trendCanvasRef = useRef(null);
  const intExtCanvasRef = useRef(null);
  const vehiclesCanvasRef = useRef(null);
  const segmentsCanvasRef = useRef(null);
  const suppliersCanvasRef = useRef(null);

  // Instanca chartova
  const chartInstances = useRef({});

  // Filtrirani podaci za Tab 1 na osnovu izabrane godine, mjeseca i tipa vozila
  const filteredCostData = useMemo(() => {
    return costData.filter((c) => {
      if (selectedYearFilter !== "all" && c.year !== parseInt(selectedYearFilter)) {
        return false;
      }
      if (selectedMonthFilter !== "all") {
        const m = c.month || (c.datumObj ? c.datumObj.getMonth() + 1 : (c.datum ? new Date(c.datum).getMonth() + 1 : null));
        if (m !== parseInt(selectedMonthFilter)) {
          return false;
        }
      }
      if (selectedTipFilter !== "all") {
        const cleanT = cleanVehicleType(c.tipMehan);
        if (cleanT !== selectedTipFilter) {
          return false;
        }
      }
      return true;
    });
  }, [costData, selectedYearFilter, selectedMonthFilter, selectedTipFilter]);

  // Izračun 6 V1 Summary KPI Kartica
  const summaryKpis = useMemo(() => {
    const isAllYears = selectedYearFilter === "all";
    const targetY = isAllYears ? 2026 : parseInt(selectedYearFilter);

    let totalCost = 0;
    let internalCost = 0;
    let externalCost = 0;
    const segmentMap = {};

    filteredCostData.forEach((item) => {
      const c = item.cost || 0;
      totalCost += c;

      const isInt =
        (item.dobavljacOrig || item.dobavljac || "").toLowerCase().includes("bingo") ||
        (item.dobavljacOrig || item.dobavljac || "").toLowerCase().includes("vlastit") ||
        (item.dobavljacOrig || item.dobavljac || "").toLowerCase().includes("intern");

      if (isInt) internalCost += c;
      else externalCost += c;

      const seg = item.segment || "Ostalo";
      segmentMap[seg] = (segmentMap[seg] || 0) + c;
    });

    const totalCount = filteredCostData.length;
    const avgCostPerIntervention = totalCount > 0 ? totalCost / totalCount : 0;
    const internalPerc = totalCost > 0 ? ((internalCost / totalCost) * 100).toFixed(1) : "0";

    // Određivanje Top Segmenta
    let topSegmentName = "-";
    let topSegmentCost = 0;
    Object.entries(segmentMap).forEach(([seg, cost]) => {
      if (cost > topSegmentCost) {
        topSegmentCost = cost;
        topSegmentName = seg;
      }
    });

    // Izračun troška po vozilu / dan
    const isVehicleFiltered = selectedTipFilter !== "all";
    const activeVehiclesInSelection = new Set(filteredCostData.map((c) => c.reg).filter(Boolean)).size;
    const fleetSize = isVehicleFiltered
      ? (activeVehiclesInSelection || 1)
      : (KPI_TOTAL_FLEET_BY_YEAR[targetY]?.Total || 938);

    let daysCount = 365;
    if (selectedMonthFilter !== "all") {
      daysCount = 30.4;
    } else {
      const monthsSet = new Set(filteredCostData.map((c) => c.month).filter(Boolean));
      const monthsCount = monthsSet.size > 0 ? monthsSet.size : 7;
      daysCount = monthsCount * 30.4;
    }
    const dailyAvgPerVehicle = fleetSize > 0 && daysCount > 0 ? totalCost / (fleetSize * daysCount) : 0;

    // Tekstualni opis aktivnih filtera
    const monthNames = ["", "Januar", "Februar", "Mart", "April", "Maj", "Juni", "Juli", "August", "Septembar", "Oktobar", "Novembar", "Decembar"];
    const subtitleParts = [];
    if (selectedMonthFilter !== "all") {
      subtitleParts.push(monthNames[parseInt(selectedMonthFilter)]);
    }
    if (selectedYearFilter !== "all") {
      subtitleParts.push(`${selectedYearFilter}. godina`);
    } else {
      subtitleParts.push(selectedMonthFilter !== "all" ? "(Sve godine)" : "Konsolidovano (2021-2026)");
    }
    if (selectedTipFilter !== "all") {
      subtitleParts.push(`• ${selectedTipFilter}`);
    }
    const filterSubtitle = subtitleParts.join(" ");

    return {
      totalCost,
      dailyAvgPerVehicle,
      fleetSize,
      targetY,
      internalPerc,
      topSegmentName,
      topSegmentCost,
      totalCount,
      avgCostPerIntervention,
      filterSubtitle,
      isVehicleFiltered
    };
  }, [filteredCostData, selectedYearFilter, selectedMonthFilter, selectedTipFilter]);

  // Godišnje statistike za trend linije
  const yearlyStats = useMemo(() => {
    const years = [2021, 2022, 2023, 2024, 2025, 2026];
    const stats = {};
    years.forEach((y) => (stats[y] = { cost: 0, count: 0, internalCost: 0 }));

    costData.forEach((c) => {
      if (stats[c.year]) {
        stats[c.year].cost += c.cost || 0;
        stats[c.year].count += 1;

        const isInt =
          (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("bingo") ||
          (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("vlastit") ||
          (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("intern");

        if (isInt) {
          stats[c.year].internalCost += c.cost || 0;
        }
      }
    });

    return stats;
  }, [costData]);

  // Crtanje svih 5 grafikona
  useEffect(() => {
    // 1. Mjesečna Dinamika / Trend Grafikon
    if (trendCanvasRef.current) {
      if (chartInstances.current.trend) chartInstances.current.trend.destroy();
      const ctx = trendCanvasRef.current.getContext("2d");

      if (selectedYearFilter === "all" && selectedMonthFilter === "all") {
        const years = [2021, 2022, 2023, 2024, 2025, 2026];
        const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

        const datasets = years.map((y, idx) => {
          const monthData = Array(12).fill(0);
          costData.forEach((c) => {
            if (c.year === y) {
              if (selectedTipFilter !== "all" && cleanVehicleType(c.tipMehan) !== selectedTipFilter) {
                return;
              }
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
              datalabels: { display: false },
              legend: { position: "bottom", labels: { font: { size: 11, weight: "bold" } } },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const yTot = datasets[ctx.datasetIndex]?.data.reduce((a, b) => a + b, 0) || 1;
                    const p = ((ctx.raw / yTot) * 100).toFixed(1);
                    return ` ${ctx.dataset.label}: ${formatKM(ctx.raw)} (${p}% godišnjeg troška)`;
                  }
                }
              }
            }
          }
        });
      } else if (selectedYearFilter === "all" && selectedMonthFilter !== "all") {
        // Prikaz odabranog mjeseca kroz godine (2021-2026)
        const years = [2021, 2022, 2023, 2024, 2025, 2026];
        const monthInterno = Array(6).fill(0);
        const monthEksterno = Array(6).fill(0);

        years.forEach((y, idx) => {
          costData.forEach((c) => {
            if (c.year === y) {
              const m = c.month || (c.datumObj ? c.datumObj.getMonth() + 1 : (c.datum ? new Date(c.datum).getMonth() + 1 : null));
              if (m === parseInt(selectedMonthFilter)) {
                if (selectedTipFilter !== "all" && cleanVehicleType(c.tipMehan) !== selectedTipFilter) {
                  return;
                }
                const isInt =
                  (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("bingo") ||
                  (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("vlastit");
                if (isInt) monthInterno[idx] += c.cost || 0;
                else monthEksterno[idx] += c.cost || 0;
              }
            }
          });
        });

        const monthNames = ["", "Januar", "Februar", "Mart", "April", "Maj", "Juni", "Juli", "August", "Septembar", "Oktobar", "Novembar", "Decembar"];
        const mLabel = monthNames[parseInt(selectedMonthFilter)] || "Mjesec";

        chartInstances.current.trend = new ChartJS(ctx, {
          type: "bar",
          data: {
            labels: years.map((y) => `${mLabel} ${y}.`),
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
              datalabels: {
                display: true,
                color: "#ffffff",
                font: { weight: "bold", size: 9 },
                formatter: (value, ctx) => {
                  const mIdx = ctx.dataIndex;
                  const mTotal = monthInterno[mIdx] + monthEksterno[mIdx];
                  if (mTotal === 0 || value < mTotal * 0.1) return "";
                  return `${((value / mTotal) * 100).toFixed(0)}%`;
                }
              },
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
              datalabels: {
                display: true,
                color: "#ffffff",
                font: { weight: "bold", size: 9 },
                formatter: (value, ctx) => {
                  const mIdx = ctx.dataIndex;
                  const mTotal = monthInterno[mIdx] + monthEksterno[mIdx];
                  if (mTotal === 0 || value < mTotal * 0.1) return "";
                  return `${((value / mTotal) * 100).toFixed(0)}%`;
                }
              },
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

    // 2. Interno vs Eksterno Doughnut (sa procentima)
    if (intExtCanvasRef.current) {
      if (chartInstances.current.intExt) chartInstances.current.intExt.destroy();
      const ctx = intExtCanvasRef.current.getContext("2d");

      let intCost = 0,
        extCost = 0;
      filteredCostData.forEach((c) => {
        const isInt =
          (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("bingo") ||
          (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("vlastit") ||
          (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("intern");
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
            datalabels: {
              display: true,
              color: "#ffffff",
              font: { weight: "900", size: 13 },
              formatter: (value) => {
                if (total === 0 || value === 0) return "";
                return `${((value / total) * 100).toFixed(1)}%`;
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
              const type = idx === 0 ? "Interno" : "Eksterno";
              onOpenIntExtRecap(type);
            }
          }
        }
      });
    }

    // 3. Top 10 Vozila po Trošku (sa procentima)
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
            datalabels: {
              display: true,
              color: "#ffffff",
              anchor: "end",
              align: "start",
              offset: 4,
              font: { weight: "bold", size: 10 },
              formatter: (value) => {
                if (summaryKpis.totalCost === 0 || value === 0) return "";
                return `${((value / summaryKpis.totalCost) * 100).toFixed(1)}%`;
              }
            },
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = ctx.raw || 0;
                  const p = summaryKpis.totalCost > 0 ? ((val / summaryKpis.totalCost) * 100).toFixed(2) : "0";
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

    // 4. Segmenti Doughnut (sa procentima)
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
      const segSum = sortedSegs.reduce((acc, s) => acc + s[1], 0);

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
            datalabels: {
              display: true,
              color: "#ffffff",
              font: { weight: "bold", size: 10 },
              formatter: (value) => {
                if (segSum === 0 || value < segSum * 0.05) return "";
                return `${((value / segSum) * 100).toFixed(1)}%`;
              }
            },
            legend: { position: "right", labels: { font: { weight: "bold", size: 10 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = ctx.raw || 0;
                  const p = summaryKpis.totalCost > 0 ? ((val / summaryKpis.totalCost) * 100).toFixed(1) : "0";
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

    // 5. Top 7 Dobavljača / Servisera (KLIKOM NA INTERNO PREBACUJE U GODINE)
    if (suppliersCanvasRef.current) {
      if (chartInstances.current.suppliers) chartInstances.current.suppliers.destroy();
      const ctx = suppliersCanvasRef.current.getContext("2d");

      if (supplierMode === "internal") {
        // PRIKAZ INTERNIH TROŠKOVA PO GODINAMA (2021-2026)
        const years = [2021, 2022, 2023, 2024, 2025, 2026];
        const internalData = years.map((y) => {
          let sum = 0;
          costData.forEach((c) => {
            if (c.year === y) {
              if (selectedMonthFilter !== "all") {
                const m = c.month || (c.datumObj ? c.datumObj.getMonth() + 1 : (c.datum ? new Date(c.datum).getMonth() + 1 : null));
                if (m !== parseInt(selectedMonthFilter)) return;
              }
              if (selectedTipFilter !== "all" && cleanVehicleType(c.tipMehan) !== selectedTipFilter) {
                return;
              }
              const isInt =
                (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("bingo") ||
                (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("vlastit") ||
                (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("intern");
              if (isInt) sum += c.cost || 0;
            }
          });
          return sum;
        });
        const totalInt = internalData.reduce((a, b) => a + b, 0);

        chartInstances.current.suppliers = new ChartJS(ctx, {
          type: "bar",
          data: {
            labels: years.map((y) => `${y}.`),
            datasets: [
              {
                label: "Interno Održavanje (KM)",
                data: internalData,
                backgroundColor: "#2563eb",
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
                  if (totalInt === 0 || value === 0) return "";
                  return `${((value / totalInt) * 100).toFixed(1)}%`;
                }
              },
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const val = ctx.raw || 0;
                    const p = totalInt > 0 ? ((val / totalInt) * 100).toFixed(1) : "0";
                    return ` Interni trošak: ${formatKM(val)} (${p}% ukupnog internog)`;
                  }
                }
              }
            },
            onClick: (e, els, ch) => {
              if (els.length > 0 && onOpenIntExtRecap) {
                onOpenIntExtRecap("Interno");
              }
            }
          }
        });
      } else {
        // PRIKAZ TOP DOBALJAČA (EKSTERNO ILI SVI)
        const supMap = new Map();
        filteredCostData.forEach((c) => {
          const isInt =
            (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("bingo") ||
            (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("vlastit") ||
            (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("intern");

          let isMatch = false;
          if (supplierMode === "external" && !isInt) isMatch = true;
          else if (supplierMode === "all") isMatch = true;

          if (isMatch) {
            const sup = (c.dobavljacOrig || c.dobavljac || "Ostali Eksterni").trim();
            if (sup && sup !== "-") {
              supMap.set(sup, (supMap.get(sup) || 0) + (c.cost || 0));
            }
          }
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
              datalabels: {
                display: true,
                color: "#ffffff",
                anchor: "end",
                align: "start",
                offset: 4,
                font: { weight: "bold", size: 10 },
                formatter: (value) => {
                  if (summaryKpis.totalCost === 0 || value === 0) return "";
                  return `${((value / summaryKpis.totalCost) * 100).toFixed(1)}%`;
                }
              },
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const val = ctx.raw || 0;
                    const p = summaryKpis.totalCost > 0 ? ((val / summaryKpis.totalCost) * 100).toFixed(1) : "0";
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
    }

    return () => {
      Object.values(chartInstances.current).forEach((inst) => inst?.destroy());
    };
  }, [
    filteredCostData,
    costData,
    selectedYearFilter,
    selectedMonthFilter,
    selectedTipFilter,
    supplierMode,
    yearlyStats,
    summaryKpis.totalCost,
    onOpenVehicleModal,
    onOpenIntExtRecap,
    onOpenSupplierDetail,
    onOpenSegmentDetail
  ]);

  return (
    <div className="w-full space-y-6">
      {/* GLAVNA FILTER TRAKA: GODINA, MJESEC, TIP VOZILA */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-slate-900 dark:text-white">
                Filteri KPI Pregleda
              </span>
              {(selectedYearFilter !== "all" || selectedMonthFilter !== "all" || selectedTipFilter !== "all") && (
                <span className="text-[10px] bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  Aktivni filteri
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Prilagodi analitiku flote po godini, mjesecu i tipu vozila
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1. Filter Godina */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <label className="text-xs font-bold uppercase text-slate-400 mr-0.5">Godina:</label>
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="text-xs font-bold bg-transparent text-slate-800 dark:text-white outline-none cursor-pointer"
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

          {/* 2. Filter Mjesec */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <label className="text-xs font-bold uppercase text-slate-400 mr-0.5">Mjesec:</label>
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="text-xs font-bold bg-transparent text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              {monthsList.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Filter Tip vozila */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Truck className="w-3.5 h-3.5 text-emerald-500" />
            <label className="text-xs font-bold uppercase text-slate-400 mr-0.5">Tip vozila:</label>
            <select
              value={selectedTipFilter}
              onChange={(e) => setSelectedTipFilter(e.target.value)}
              className="text-xs font-bold bg-transparent text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="all">Svi tipovi vozila</option>
              {distinctTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Dugme za poništavanje filtera (Reset) */}
          {(selectedYearFilter !== "all" || selectedMonthFilter !== "all" || selectedTipFilter !== "all") && (
            <button
              onClick={() => {
                setSelectedYearFilter("all");
                setSelectedMonthFilter("all");
                setSelectedTipFilter("all");
              }}
              className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 transition-all cursor-pointer shadow-xs"
              title="Poništi sve filtere"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Poništi
            </button>
          )}
        </div>
      </div>

      {/* 6 ORIGINALNIH V1 SUMMARY KARTICA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Kartica 1: Ukupan Trošak */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border-l-4 border-blue-500 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            Ukupan Trošak
          </p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatKM(summaryKpis.totalCost)}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1 truncate" title={summaryKpis.filterSubtitle}>
            {summaryKpis.filterSubtitle}
          </p>
        </div>

        {/* Kartica 2: Trošak po Vozilu / Dan */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border-l-4 border-amber-500 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            Trošak po Vozilu / Dan
          </p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {summaryKpis.dailyAvgPerVehicle.toLocaleString("bs-BA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM/dan
          </h3>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-1 truncate">
            {summaryKpis.isVehicleFiltered ? `${summaryKpis.fleetSize} akt. ${selectedTipFilter}` : `Po vozilu (${summaryKpis.fleetSize} voz. u ${summaryKpis.targetY}.)`}
          </p>
        </div>

        {/* Kartica 3: Udio Internog Servisa */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border-l-4 border-yellow-500 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            Udio Internog Servisa
          </p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {summaryKpis.internalPerc}%
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            Vlastita radionica / servis
          </p>
        </div>

        {/* Kartica 4: Top Segment */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border-l-4 border-red-500 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            Top Segment
          </p>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2 truncate" title={summaryKpis.topSegmentName}>
            {summaryKpis.topSegmentName}
          </h3>
          <p className="text-[10px] text-red-600 dark:text-red-400 font-bold mt-1">
            {formatKM(summaryKpis.topSegmentCost)}
          </p>
        </div>

        {/* Kartica 5: Broj Intervencija */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border-l-4 border-purple-500 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            Broj Intervencija
          </p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {summaryKpis.totalCount.toLocaleString("bs-BA")}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            Ukupan broj naloga / računa
          </p>
        </div>

        {/* Kartica 6: Prosjek / Intervenciji */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border-l-4 border-emerald-500 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            Prosjek / Intervenciji
          </p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatKM(summaryKpis.avgCostPerIntervention)}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            Prosječan trošak po nalogu
          </p>
        </div>
      </div>

      {/* FILTER TRAKA ZA GRAFIKONE (PORED FILTERA GODINE I FILTER MJESEC I FILTER TIP VOZILA) */}
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

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Godina */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="text-xs font-bold uppercase text-slate-400 mr-0.5">Godina:</label>
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="text-xs font-bold bg-transparent text-slate-800 dark:text-white outline-none cursor-pointer"
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

          {/* Filter Mjesec */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="text-xs font-bold uppercase text-slate-400 mr-0.5">Mjesec:</label>
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="text-xs font-bold bg-transparent text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              {monthsList.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tip vozila */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="text-xs font-bold uppercase text-slate-400 mr-0.5">Tip vozila:</label>
            <select
              value={selectedTipFilter}
              onChange={(e) => setSelectedTipFilter(e.target.value)}
              className="text-xs font-bold bg-transparent text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="all">Svi tipovi vozila</option>
              {distinctTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
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

      {/* DRUGI RED GRAFIKONA: Top 10 Vozila + Segmenti + Top Dobavljači / Interni troškovi po godinama */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 10 Vozila (Horizontal Bar) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              🚗 Top 10 Vozila po Trošku
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
              ⚙️ Trošak po Segmentima
            </h4>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
              Klik za spisak →
            </span>
          </div>
          <div className="h-[280px] w-full relative flex items-center justify-center cursor-pointer">
            <canvas ref={segmentsCanvasRef} />
          </div>
        </div>

        {/* Top 7 Dobavljača / Interni Troškovi po Godinama */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
              {supplierMode === "internal" ? (
                <>
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>Interni Troškovi po Godinama</span>
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  <span>Top Dobavljači & Serviseri</span>
                </>
              )}
            </h4>

            {/* DUGME: EKSTERNO (default) / INTERNO (prebacuje u godine) / SVI */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
              <button
                onClick={() => setSupplierMode("external")}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  supplierMode === "external"
                    ? "bg-indigo-600 text-white shadow-xs font-black"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Eksterno
              </button>
              <button
                onClick={() => setSupplierMode("internal")}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  supplierMode === "internal"
                    ? "bg-blue-600 text-white shadow-xs font-black"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Interno (Godine)
              </button>
              <button
                onClick={() => setSupplierMode("all")}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  supplierMode === "all"
                    ? "bg-slate-700 text-white shadow-xs font-black"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Svi
              </button>
            </div>
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
                const fCount = KPI_TOTAL_FLEET_BY_YEAR[y]?.Total || 0;
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
