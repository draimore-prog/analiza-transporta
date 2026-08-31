"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { formatDate, formatKM } from "@/lib/calculations.js";
import { exportTransactionsToExcel } from "@/lib/exportExcel.js";
import { X, Download, Wrench, Search, ArrowDown as ScrollDown, CheckCircle2, Loader2 } from "lucide-react";

export function IntExtRecapModal({
  isOpen,
  onClose,
  targetType = "Interno", // 'Interno' or 'Eksterno'
  costData,
  onOpenVehicleModal
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedSegment, setSelectedSegment] = useState("all");

  const [visibleCount, setVisibleCount] = useState(60);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const containerRef = useRef(null);
  const sentinelRef = useRef(null);

  const BATCH_SIZE = 60;

  // Filtrirane transakcije za odabrani tip (Interno vs Eksterno)
  const isTargetInternal = targetType === "Interno";

  const allTypeTransactions = useMemo(() => {
    return costData.filter((c) => {
      const isInt =
        (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("bingo") ||
        (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("vlastit") ||
        (c.dobavljacOrig || c.dobavljac || "").toLowerCase().includes("intern");
      return isTargetInternal ? isInt : !isInt;
    });
  }, [costData, isTargetInternal]);

  // Ukupni trošak i statistike
  const totalTypeCost = useMemo(() => {
    return allTypeTransactions.reduce((acc, c) => acc + (c.cost || 0), 0);
  }, [allTypeTransactions]);

  const totalAllCost = useMemo(() => {
    return costData.reduce((acc, c) => acc + (c.cost || 0), 0);
  }, [costData]);

  const percOfTotal = totalAllCost > 0 ? ((totalTypeCost / totalAllCost) * 100).toFixed(1) : "0";

  const distinctVehicles = useMemo(() => {
    const set = new Set(allTypeTransactions.map((c) => c.reg).filter((r) => r && r !== "-"));
    return set.size;
  }, [allTypeTransactions]);

  const avgCostPerIntervention =
    allTypeTransactions.length > 0 ? totalTypeCost / allTypeTransactions.length : 0;

  // Godišnji zbir
  const yearlyBreakdown = useMemo(() => {
    const map = {};
    [2021, 2022, 2023, 2024, 2025, 2026].forEach((y) => (map[y] = { cost: 0, count: 0 }));
    allTypeTransactions.forEach((c) => {
      if (map[c.year]) {
        map[c.year].cost += c.cost || 0;
        map[c.year].count += 1;
      }
    });
    return map;
  }, [allTypeTransactions]);

  // Unikatni segmenti
  const distinctSegments = useMemo(() => {
    return Array.from(new Set(allTypeTransactions.map((c) => c.segment).filter(Boolean))).sort();
  }, [allTypeTransactions]);

  // Filtriranje tabele unutar modala
  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return allTypeTransactions.filter((c) => {
      const matchYear = selectedYear === "all" || c.year === parseInt(selectedYear);
      const matchSegment = selectedSegment === "all" || c.segment === selectedSegment;
      const matchTerm =
        !term ||
        (c.reg && c.reg.toLowerCase().includes(term)) ||
        (c.garazniBroj && c.garazniBroj.toLowerCase().includes(term)) ||
        (c.dobavljacOrig && c.dobavljacOrig.toLowerCase().includes(term)) ||
        (c.opisPopravke && c.opisPopravke.toLowerCase().includes(term));

      return matchYear && matchSegment && matchTerm;
    });
  }, [allTypeTransactions, selectedYear, selectedSegment, searchTerm]);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [selectedYear, selectedSegment, searchTerm]);

  const visibleItems = useMemo(() => {
    return filteredData.slice(0, visibleCount);
  }, [filteredData, visibleCount]);

  const hasMore = visibleCount < filteredData.length;

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filteredData.length));
      setIsLoadingMore(false);
    }, 150);
  }, [hasMore, isLoadingMore, filteredData.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      {
        root: containerRef.current,
        rootMargin: "300px",
        threshold: 0.1
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || !hasMore || isLoadingMore) return;

    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 400;
    if (nearBottom) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  if (!isOpen) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 bg-slate-900/80 flex justify-center items-center z-[75] backdrop-blur-xs p-3 sm:p-5 animate-in fade-in zoom-in-95 duration-200 cursor-pointer">
      <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 cursor-default">
        {/* Header */}
        <div
          className={`flex justify-between items-center p-5 text-white ${
            isTargetInternal
              ? "bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950"
              : "bg-gradient-to-r from-slate-900 via-amber-950 to-orange-950"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md text-2xl">
              {isTargetInternal ? "🏢" : "🚜"}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                <span>Rekapitulacija {isTargetInternal ? "Internih" : "Eksternih"} Servisa</span>
                <span className="text-xs bg-white/20 border border-white/30 px-2.5 py-0.5 rounded-full font-mono">
                  {allTypeTransactions.length.toLocaleString("bs-BA")} naloga
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Detaljna analiza troškova, intervencija, tipova vozila i segmentacije održavanja
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl w-9 h-9 flex items-center justify-center text-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-slate-50 dark:bg-slate-900/50 text-xs">
          {/* Top 4 KPI Kartice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-slate-400">Ukupan Iznos ({targetType})</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {formatKM(totalTypeCost)}
              </h3>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                {percOfTotal}% ukupnog održavanja
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-slate-400">Broj Intervencija</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {allTypeTransactions.length.toLocaleString("bs-BA")}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Evidentiranih radnih naloga
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-slate-400">Prosjek po Intervenciji</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {formatKM(avgCostPerIntervention)}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Cijena pojedinačnog naloga
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-slate-400">Obuhvaćena Vozila</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {distinctVehicles.toLocaleString("bs-BA")}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Unikatnih registracija
              </p>
            </div>
          </div>

          {/* Višegodišnji pregled (2021-2026) */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <h4 className="font-extrabold text-slate-900 dark:text-white mb-3 text-xs flex items-center justify-between">
              <span>📅 Godišnja dinamika ({targetType})</span>
              <span className="text-[10px] text-slate-400 font-mono">2021 - 2026</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[2021, 2022, 2023, 2024, 2025, 2026].map((y) => (
                <div
                  key={y}
                  onClick={() => {
                    setSelectedYear(selectedYear === y.toString() ? "all" : y.toString());
                  }}
                  className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                    selectedYear === y.toString()
                      ? "bg-blue-600 text-white border-blue-700 font-bold shadow-xs scale-102"
                      : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-400"
                  }`}
                >
                  <p className="text-[10px] font-bold opacity-80">{y}.</p>
                  <p className="text-xs font-black mt-0.5">{formatKM(yearlyBreakdown[y]?.cost || 0)}</p>
                  <p className="text-[9px] opacity-75">{yearlyBreakdown[y]?.count || 0} naloga</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabela transakcija sa filterima */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <div className="p-3.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <h4 className="font-extrabold text-slate-900 dark:text-white">
                  Spisak Servisnih Naloga ({filteredData.length.toLocaleString("bs-BA")})
                </h4>
              </div>

              {/* Kontrole Filteri */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="🔍 Pretraži reg, opis, radionicu..."
                    className="w-48 sm:w-56 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg pl-7 pr-2.5 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                </div>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1 text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="all">Sve godine</option>
                  <option value="2026">2026.</option>
                  <option value="2025">2025.</option>
                  <option value="2024">2024.</option>
                  <option value="2023">2023.</option>
                  <option value="2022">2022.</option>
                  <option value="2021">2021.</option>
                </select>

                <select
                  value={selectedSegment}
                  onChange={(e) => setSelectedSegment(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1 text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="all">Svi segmenti</option>
                  {distinctSegments.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => exportTransactionsToExcel(filteredData, `Rekapitulacija_${targetType}.xlsx`)}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Izvoz
                </button>
              </div>
            </div>

            {/* Inkrementalna Scroll Tabela */}
            <div
              ref={containerRef}
              onScroll={handleScroll}
              className="overflow-x-auto overflow-y-auto max-h-[420px] scroll-smooth"
            >
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 shadow-xs">
                  <tr>
                    <th className="p-2.5 text-center">R.b.</th>
                    <th className="p-2.5">Datum</th>
                    <th className="p-2.5">Reg. Oznaka</th>
                    <th className="p-2.5">Garažni Br.</th>
                    <th className="p-2.5">Segment</th>
                    <th className="p-2.5">Radionica / Serviser</th>
                    <th className="p-2.5">Opis Radova / Dijelovi</th>
                    <th className="p-2.5 text-right">Iznos (KM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-900">
                  {visibleItems.length > 0 ? (
                    visibleItems.map((c, idx) => (
                      <tr
                        key={c.id || idx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="p-2.5 text-center font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 font-medium whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {formatDate(c.datumObj || c.datum)}
                        </td>
                        <td
                          onClick={() => onOpenVehicleModal(c.reg)}
                          className="p-2.5 font-bold text-blue-700 dark:text-blue-400 cursor-pointer hover:underline"
                        >
                          {c.reg}
                        </td>
                        <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">
                          {c.garazniBroj || "-"}
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                          {c.segment || "-"}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                          {c.dobavljacOrig || c.dobavljac || "-"}
                        </td>
                        <td className="p-2.5 text-slate-900 dark:text-white break-words max-w-[250px]">
                          {c.opisPopravke || c.opis || "-"}
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {formatKM(c.cost || 0)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                        Nema pronađenih servisa za odabrane filtere.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Sentinel element */}
              <div ref={sentinelRef} className="h-4 w-full" />
            </div>

            {/* Status Inkrementalnog Učitavanja */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center text-xs gap-3">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-900 dark:text-white">
                  Prikazano: {visibleItems.length.toLocaleString("bs-BA")} od {filteredData.length.toLocaleString("bs-BA")} naloga
                </span>
                <span className="text-[11px] text-slate-400">
                  ({((visibleItems.length / (filteredData.length || 1)) * 100).toFixed(0)}%)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {hasMore ? (
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Učitavam starije naloge...</span>
                      </>
                    ) : (
                      <>
                        <ScrollDown className="w-3.5 h-3.5" />
                        <span>Učitaj još {BATCH_SIZE} naloga</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-extrabold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Svi nalozi su uspješno učitani</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
