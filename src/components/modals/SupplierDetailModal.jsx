"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { formatDate, formatKM } from "@/lib/calculations.js";
import { exportTransactionsToExcel } from "@/lib/exportExcel.js";
import {
  X,
  Download,
  Building2,
  ArrowDown as ScrollDown,
  CheckCircle2,
  Loader2,
  RotateCcw,
  FilterX,
  Layers,
  Sparkles
} from "lucide-react";

export function SupplierDetailModal({
  isOpen,
  onClose,
  supplierName,
  costData,
  onOpenVehicleModal
}) {
  const [selectedYear, setSelectedYear] = useState("all");
  const [colFilterReg, setColFilterReg] = useState("");
  const [colFilterGb, setColFilterGb] = useState("");
  const [colFilterSegment, setColFilterSegment] = useState("all");
  const [colFilterType, setColFilterType] = useState("all");
  const [colFilterOpis, setColFilterOpis] = useState("");

  const [visibleCount, setVisibleCount] = useState(60);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const containerRef = useRef(null);
  const sentinelRef = useRef(null);

  const BATCH_SIZE = 60;

  // Filtrirane transakcije za ovog dobavljača
  const supplierTransactions = useMemo(() => {
    if (!supplierName) return [];
    const supNorm = supplierName.trim().toLowerCase();

    return costData.filter((c) => {
      const dOrig = (c.dobavljacOrig || "").toLowerCase();
      const dClean = (c.dobavljac || "").toLowerCase();
      return dOrig.includes(supNorm) || dClean.includes(supNorm);
    });
  }, [costData, supplierName]);

  // Ukupan iznos
  const totalCost = useMemo(() => {
    return supplierTransactions.reduce((acc, c) => acc + (c.cost || 0), 0);
  }, [supplierTransactions]);

  const totalFleetCost = useMemo(() => {
    return costData.reduce((acc, c) => acc + (c.cost || 0), 0);
  }, [costData]);

  const supplierShare = totalFleetCost > 0 ? ((totalCost / totalFleetCost) * 100).toFixed(1) : "0";

  const distinctVehicles = useMemo(() => {
    const set = new Set(supplierTransactions.map((c) => c.reg).filter((r) => r && r !== "-"));
    return set.size;
  }, [supplierTransactions]);

  const avgPerIntervention =
    supplierTransactions.length > 0 ? totalCost / supplierTransactions.length : 0;

  // Godišnja dinamika za ovog dobavljača
  const yearlyBreakdown = useMemo(() => {
    const map = {};
    [2021, 2022, 2023, 2024, 2025, 2026].forEach((y) => (map[y] = { cost: 0, count: 0 }));
    supplierTransactions.forEach((c) => {
      if (map[c.year]) {
        map[c.year].cost += c.cost || 0;
        map[c.year].count += 1;
      }
    });
    return map;
  }, [supplierTransactions]);

  // Unikatni segmenti
  const distinctSegments = useMemo(() => {
    return Array.from(new Set(supplierTransactions.map((c) => (c.segment || "").trim()).filter(Boolean))).sort();
  }, [supplierTransactions]);

  // Unikatni tipovi
  const distinctTypes = useMemo(() => {
    return Array.from(new Set(supplierTransactions.map((c) => (c.tipMehan || "").trim()).filter(Boolean))).sort();
  }, [supplierTransactions]);

  // Raspoložive godine
  const availableYears = useMemo(() => {
    return Array.from(new Set(supplierTransactions.map((c) => c.year))).filter(Boolean).sort((a, b) => b - a);
  }, [supplierTransactions]);

  // Filtriranje
  const filteredData = useMemo(() => {
    const regTerm = colFilterReg.trim().toLowerCase();
    const gbTerm = colFilterGb.trim().toLowerCase();
    const opisTerm = colFilterOpis.trim().toLowerCase();

    return supplierTransactions.filter((c) => {
      const matchYear = selectedYear === "all" || c.year === parseInt(selectedYear);
      const matchSegment = colFilterSegment === "all" || (c.segment || "").trim().toLowerCase() === colFilterSegment.toLowerCase();
      const matchType = colFilterType === "all" || (c.tipMehan || "").trim().toLowerCase() === colFilterType.toLowerCase();

      const matchReg = !regTerm || (c.reg && c.reg.toLowerCase().includes(regTerm));
      const matchGb = !gbTerm || (c.garazniBroj && c.garazniBroj.toLowerCase().includes(gbTerm));
      const matchOpis =
        !opisTerm ||
        (c.opisPopravke && c.opisPopravke.toLowerCase().includes(opisTerm)) ||
        (c.opis && c.opis.toLowerCase().includes(opisTerm));

      return matchYear && matchSegment && matchType && matchReg && matchGb && matchOpis;
    });
  }, [supplierTransactions, selectedYear, colFilterSegment, colFilterType, colFilterReg, colFilterGb, colFilterOpis]);

  const filteredTotalCost = useMemo(() => {
    return filteredData.reduce((acc, c) => acc + (c.cost || 0), 0);
  }, [filteredData]);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [selectedYear, colFilterSegment, colFilterType, colFilterReg, colFilterGb, colFilterOpis]);

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

  const isAnyFilterActive =
    selectedYear !== "all" ||
    colFilterSegment !== "all" ||
    colFilterType !== "all" ||
    colFilterReg !== "" ||
    colFilterGb !== "" ||
    colFilterOpis !== "";

  const resetAllFilters = () => {
    setSelectedYear("all");
    setColFilterSegment("all");
    setColFilterType("all");
    setColFilterReg("");
    setColFilterGb("");
    setColFilterOpis("");
    setVisibleCount(BATCH_SIZE);
  };

  if (!isOpen || !supplierName) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 bg-slate-900/80 flex justify-center items-center z-[75] backdrop-blur-xs p-3 sm:p-5 animate-in fade-in zoom-in-95 duration-200 cursor-pointer">
      <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 cursor-default">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md text-xl">
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight truncate max-w-md">
                  Dobavljač / Serviser: {supplierName}
                </h2>
                <span className="bg-indigo-500/30 border border-indigo-400 text-indigo-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  Partner
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Pregled realizovanih popravki, faktura, historije i prosjeka troškova
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

        {/* Sadržaj - Fiksna baza bez outer scrollbara */}
        <div className="p-4 sm:p-5 flex flex-col flex-1 min-h-0 overflow-hidden space-y-3 bg-slate-50 dark:bg-slate-900/50 text-xs">
          {/* 4 KPI Kartice */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <p className="text-[9px] uppercase font-bold text-slate-400">Ukupan Promet / Trošak</p>
              <h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                {formatKM(totalCost)}
              </h3>
              <p className="text-[9px] text-slate-500">
                {supplierShare}% ukupnog budžeta
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <p className="text-[9px] uppercase font-bold text-slate-400">Broj Servisa / Faktura</p>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {supplierTransactions.length.toLocaleString("bs-BA")}
              </h3>
              <p className="text-[9px] text-slate-500">
                Realizovanih naloga
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <p className="text-[9px] uppercase font-bold text-slate-400">Prosjek po Servisu</p>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {formatKM(avgPerIntervention)}
              </h3>
              <p className="text-[9px] text-slate-500">
                Po nalogu
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <p className="text-[9px] uppercase font-bold text-slate-400">Servisiranih Vozila</p>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {distinctVehicles.toLocaleString("bs-BA")}
              </h3>
              <p className="text-[9px] text-slate-500">
                Voznih jedinica
              </p>
            </div>
          </div>

          {/* Godišnja Dinamika + Segment Bedževi (Kompaktno) */}
          <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs shrink-0 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 mr-1">Godina:</span>
                {[2021, 2022, 2023, 2024, 2025, 2026].map((y) => (
                  <button
                    key={y}
                    onClick={() => {
                      setSelectedYear(selectedYear === y.toString() ? "all" : y.toString());
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      selectedYear === y.toString()
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {y}. ({formatKM(yearlyBreakdown[y]?.cost || 0)})
                  </button>
                ))}
              </div>
              {selectedYear !== "all" && (
                <button
                  onClick={() => setSelectedYear("all")}
                  className="text-[10px] text-amber-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <FilterX className="w-3 h-3" /> Poništi godinu
                </button>
              )}
            </div>

            {/* Segmenti */}
            {distinctSegments.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/50">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1 mr-1">
                  <Layers className="w-3 h-3 text-indigo-500" /> Segment:
                </span>
                <button
                  onClick={() => setColFilterSegment("all")}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    colFilterSegment === "all"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  Svi ({supplierTransactions.length})
                </button>
                {distinctSegments.map((seg) => {
                  const count = supplierTransactions.filter((c) => (c.segment || "").trim() === seg).length;
                  return (
                    <button
                      key={seg}
                      onClick={() => setColFilterSegment(colFilterSegment === seg ? "all" : seg)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        colFilterSegment === seg
                          ? "bg-indigo-600 text-white shadow-xs scale-102"
                          : "bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      <span>{seg}</span>
                      <span className="opacity-75 font-mono">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tabela transakcija sa kolonskim filterima - JEDINI SKROLABILNI DIO */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs flex-1 min-h-0 flex flex-col">
            <div className="p-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">
                  Spisak Računa ({filteredData.length.toLocaleString("bs-BA")} / {supplierTransactions.length.toLocaleString("bs-BA")})
                </h4>
                {isAnyFilterActive && (
                  <span className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Filtrirano ({formatKM(filteredTotalCost)})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isAnyFilterActive && (
                  <button
                    onClick={resetAllFilters}
                    className="px-2.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-black text-[11px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                  >
                    <FilterX className="w-3 h-3" /> Poništi
                  </button>
                )}
                <button
                  onClick={() => exportTransactionsToExcel(filteredData, `Dobavljac_${supplierName}.xlsx`)}
                  className="px-2.5 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3" /> Izvoz
                </button>
              </div>
            </div>

            {/* Inkrementalna Scroll Tabela */}
            <div
              ref={containerRef}
              onScroll={handleScroll}
              className="overflow-x-auto overflow-y-auto flex-1 min-h-0 scroll-smooth"
            >
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 shadow-xs">
                  {/* 1. RED */}
                  <tr>
                    <th className="p-2 text-center w-12">R.b.</th>
                    <th className="p-2 w-24">Datum</th>
                    <th className="p-2 w-28">Reg. Oznaka</th>
                    <th className="p-2 w-24">Garažni Br.</th>
                    <th className="p-2 w-32">Segment</th>
                    <th className="p-2 w-36">Tip Mehanizacije</th>
                    <th className="p-2 w-48">Opis Popravke / Radovi</th>
                    <th className="p-2 text-right w-24">Trošak (KM)</th>
                  </tr>

                  {/* 2. RED: In-Table Filteri */}
                  <tr className="bg-slate-200/90 dark:bg-slate-950 border-t border-slate-300 dark:border-slate-800 font-normal">
                    <th className="p-1 text-center">
                      <span className="text-[10px] text-slate-400 font-mono">#</span>
                    </th>
                    <th className="p-1">
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1 py-0.5 text-[11px] font-bold outline-none cursor-pointer"
                      >
                        <option value="all">Sve god.</option>
                        {availableYears.map((y) => (
                          <option key={y} value={y.toString()}>
                            {y}.
                          </option>
                        ))}
                      </select>
                    </th>
                    <th className="p-1">
                      <input
                        type="text"
                        value={colFilterReg}
                        onChange={(e) => setColFilterReg(e.target.value)}
                        placeholder="🔍 Reg..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-[11px] font-bold uppercase outline-none"
                      />
                    </th>
                    <th className="p-1">
                      <input
                        type="text"
                        value={colFilterGb}
                        onChange={(e) => setColFilterGb(e.target.value)}
                        placeholder="🔍 GB..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-[11px] font-medium outline-none"
                      />
                    </th>
                    <th className="p-1">
                      <select
                        value={colFilterSegment}
                        onChange={(e) => setColFilterSegment(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1 py-0.5 text-[11px] font-bold outline-none cursor-pointer"
                      >
                        <option value="all">Svi segmenti</option>
                        {distinctSegments.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </th>
                    <th className="p-1">
                      <select
                        value={colFilterType}
                        onChange={(e) => setColFilterType(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1 py-0.5 text-[11px] font-bold outline-none cursor-pointer"
                      >
                        <option value="all">Svi tipovi</option>
                        {distinctTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </th>
                    <th className="p-1">
                      <input
                        type="text"
                        value={colFilterOpis}
                        onChange={(e) => setColFilterOpis(e.target.value)}
                        placeholder="🔍 Opis..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-[11px] font-medium outline-none"
                      />
                    </th>
                    <th className="p-1 text-center">
                      <button
                        onClick={resetAllFilters}
                        title="Poništi filtere"
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 w-full"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                    </th>
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
                        <td className="p-2.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
                          {formatDate(c.datumObj || c.datum)}
                        </td>
                        <td
                          onClick={() => onOpenVehicleModal(c.reg)}
                          className="p-2.5 font-bold text-indigo-700 dark:text-indigo-400 cursor-pointer hover:underline"
                        >
                          {c.reg}
                        </td>
                        <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">
                          {c.garazniBroj || "-"}
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                          {c.segment || "-"}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">
                          {c.tipMehan || "-"}
                        </td>
                        <td className="p-2.5 text-slate-900 dark:text-white break-words max-w-[260px]">
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
                        Nema pronađenih računa/servisa za ovog partnera i odabrane filtere.
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredData.length > 0 && (
                  <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                    <tr>
                      <td colSpan={7} className="p-2.5 text-right font-black uppercase text-xs">
                        Zbir prikazanih stavki:
                      </td>
                      <td className="p-2.5 text-right font-black text-xs whitespace-nowrap">
                        {formatKM(filteredTotalCost)}
                      </td>
                    </tr>
                  </tfoot>
                )}
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
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
