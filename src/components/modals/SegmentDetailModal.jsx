"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { formatDate, formatKM } from "@/lib/calculations.js";
import { exportTransactionsToExcel } from "@/lib/exportExcel.js";
import {
  X,
  Download,
  Printer,
  Layers,
  ArrowDown as ScrollDown,
  CheckCircle2,
  Loader2,
  RotateCcw,
  FilterX,
  Building2,
  Sparkles
} from "lucide-react";

export function SegmentDetailModal({
  isOpen,
  onClose,
  segmentName,
  costData,
  onOpenVehicleModal
}) {
  const [selectedYear, setSelectedYear] = useState("all");
  const [colFilterReg, setColFilterReg] = useState("");
  const [colFilterGb, setColFilterGb] = useState("");
  const [colFilterType, setColFilterType] = useState("all");
  const [colFilterSupplier, setColFilterSupplier] = useState("all");
  const [colFilterOpis, setColFilterOpis] = useState("");

  const [visibleCount, setVisibleCount] = useState(60);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const containerRef = useRef(null);
  const sentinelRef = useRef(null);

  const BATCH_SIZE = 60;

  // Filtrirane transakcije za ovaj segment
  const segmentTransactions = useMemo(() => {
    if (!segmentName) return [];
    const segNorm = segmentName.trim().toLowerCase();

    return costData.filter((c) => {
      const s = (c.segment || "").toLowerCase();
      return s.includes(segNorm) || segNorm.includes(s);
    });
  }, [costData, segmentName]);

  // Ukupan iznos
  const totalCost = useMemo(() => {
    return segmentTransactions.reduce((acc, c) => acc + (c.cost || 0), 0);
  }, [segmentTransactions]);

  const totalFleetCost = useMemo(() => {
    return costData.reduce((acc, c) => acc + (c.cost || 0), 0);
  }, [costData]);

  const segmentShare = totalFleetCost > 0 ? ((totalCost / totalFleetCost) * 100).toFixed(1) : "0";

  const distinctVehicles = useMemo(() => {
    const set = new Set(segmentTransactions.map((c) => c.reg).filter((r) => r && r !== "-"));
    return set.size;
  }, [segmentTransactions]);

  const avgPerIntervention =
    segmentTransactions.length > 0 ? totalCost / segmentTransactions.length : 0;

  // Godišnja dinamika
  const yearlyBreakdown = useMemo(() => {
    const map = {};
    [2021, 2022, 2023, 2024, 2025, 2026].forEach((y) => (map[y] = { cost: 0, count: 0 }));
    segmentTransactions.forEach((c) => {
      if (map[c.year]) {
        map[c.year].cost += c.cost || 0;
        map[c.year].count += 1;
      }
    });
    return map;
  }, [segmentTransactions]);

  // Unikatni dobavljači/serviseri za ovaj segment
  const distinctSuppliers = useMemo(() => {
    const map = {};
    segmentTransactions.forEach((c) => {
      const sup = (c.dobavljacOrig || c.dobavljac || "").trim();
      if (sup && sup !== "-") {
        map[sup] = (map[sup] || 0) + (c.cost || 0);
      }
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, cost]) => ({ name, cost }));
  }, [segmentTransactions]);

  // Unikatni tipovi
  const distinctTypes = useMemo(() => {
    return Array.from(new Set(segmentTransactions.map((c) => (c.tipMehan || "").trim()).filter(Boolean))).sort();
  }, [segmentTransactions]);

  // Raspoložive godine
  const availableYears = useMemo(() => {
    return Array.from(new Set(segmentTransactions.map((c) => c.year))).filter(Boolean).sort((a, b) => b - a);
  }, [segmentTransactions]);

  // Filtriranje tabele
  const filteredData = useMemo(() => {
    const regTerm = colFilterReg.trim().toLowerCase();
    const gbTerm = colFilterGb.trim().toLowerCase();
    const supTerm = colFilterSupplier.trim().toLowerCase();
    const opisTerm = colFilterOpis.trim().toLowerCase();

    return segmentTransactions.filter((c) => {
      const matchYear = selectedYear === "all" || c.year === parseInt(selectedYear);
      const matchType = colFilterType === "all" || (c.tipMehan || "").trim().toLowerCase() === colFilterType.toLowerCase();

      const matchReg = !regTerm || (c.reg && c.reg.toLowerCase().includes(regTerm));
      const matchGb = !gbTerm || (c.garazniBroj && c.garazniBroj.toLowerCase().includes(gbTerm));
      
      const cSup = (c.dobavljacOrig || c.dobavljac || "").toLowerCase();
      const matchSup = colFilterSupplier === "all" || cSup.includes(supTerm);

      const matchOpis =
        !opisTerm ||
        (c.opisPopravke && c.opisPopravke.toLowerCase().includes(opisTerm)) ||
        (c.opis && c.opis.toLowerCase().includes(opisTerm));

      return matchYear && matchType && matchReg && matchGb && matchSup && matchOpis;
    });
  }, [segmentTransactions, selectedYear, colFilterType, colFilterReg, colFilterGb, colFilterSupplier, colFilterOpis]);

  const filteredTotalCost = useMemo(() => {
    return filteredData.reduce((acc, c) => acc + (c.cost || 0), 0);
  }, [filteredData]);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [selectedYear, colFilterType, colFilterReg, colFilterGb, colFilterSupplier, colFilterOpis]);

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
    colFilterType !== "all" ||
    colFilterReg !== "" ||
    colFilterGb !== "" ||
    colFilterSupplier !== "all" ||
    colFilterOpis !== "";

  const resetAllFilters = () => {
    setSelectedYear("all");
    setColFilterType("all");
    setColFilterReg("");
    setColFilterGb("");
    setColFilterSupplier("all");
    setColFilterOpis("");
    setVisibleCount(BATCH_SIZE);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !segmentName) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 bg-slate-900/80 flex justify-center items-center z-[75] backdrop-blur-xs p-3 sm:p-5 animate-in fade-in zoom-in-95 duration-200 cursor-pointer">
      <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 cursor-default">
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md text-2xl">
              🏬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight truncate max-w-md">
                  Segment: {segmentName}
                </h2>
                <span className="bg-emerald-500/30 border border-emerald-400 text-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  Kategorija Održavanja
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Detaljan pregled ugrađenih dijelova, radova, popravki i dinamike troškova
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl w-9 h-9 flex items-center justify-center text-xl transition-colors cursor-pointer"
              title="Štampaj pregled segmenta"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl w-9 h-9 flex items-center justify-center text-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sadržaj */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50 dark:bg-slate-900/50 text-xs">
          {/* 4 KPI Kartice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-slate-400">Ukupan Trošak Segmenta</p>
              <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {formatKM(totalCost)}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {segmentShare}% ukupnih troškova flote
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-slate-400">Broj Intervencija</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {segmentTransactions.length.toLocaleString("bs-BA")}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Realizovanih popravki / zamjena
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-slate-400">Prosjek po Intervenciji</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {formatKM(avgPerIntervention)}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Prosječna cijena po nalogu
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-slate-400">Broj Vozila sa Popravkom</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {distinctVehicles.toLocaleString("bs-BA")}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Unikatnih jedinica u segmentu
              </p>
            </div>
          </div>

          {/* Godišnja Dinamika - Klikom se bira godina */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <h4 className="font-extrabold text-slate-900 dark:text-white mb-2.5 text-xs flex items-center justify-between">
              <span>📅 Godišnja dinamika za segment &ldquo;{segmentName}&rdquo; (Klikni za filter)</span>
              {selectedYear !== "all" && (
                <button
                  onClick={() => setSelectedYear("all")}
                  className="text-[10px] text-amber-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <FilterX className="w-3 h-3" /> Poništi ({selectedYear}.)
                </button>
              )}
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
                      ? "bg-emerald-600 text-white border-emerald-700 font-bold shadow-xs scale-102"
                      : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-400"
                  }`}
                >
                  <p className="text-[10px] font-bold opacity-80">{y}.</p>
                  <p className="text-xs font-black mt-0.5">{formatKM(yearlyBreakdown[y]?.cost || 0)}</p>
                  <p className="text-[9px] opacity-75">{yearlyBreakdown[y]?.count || 0} naloga</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interaktivni Klik-Tagovi Dobavljača */}
          {distinctSuppliers.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-extrabold uppercase text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-500" /> Glavni dobavljači u ovom segmentu:
                </span>
                {colFilterSupplier !== "all" && (
                  <button
                    onClick={() => setColFilterSupplier("all")}
                    className="text-[10px] text-amber-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <FilterX className="w-3 h-3" /> Prikaz svih dobavljača
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setColFilterSupplier("all")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    colFilterSupplier === "all"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  Svi partneri ({segmentTransactions.length})
                </button>
                {distinctSuppliers.map((sup) => (
                  <button
                    key={sup.name}
                    onClick={() => setColFilterSupplier(colFilterSupplier === sup.name ? "all" : sup.name)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      colFilterSupplier === sup.name
                        ? "bg-emerald-600 text-white shadow-xs scale-102"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>{sup.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">({formatKM(sup.cost)})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tabela sa Filterima */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <div className="p-3.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h4 className="font-extrabold text-slate-900 dark:text-white">
                  Spisak Računa i Dijelova ({filteredData.length.toLocaleString("bs-BA")} / {segmentTransactions.length.toLocaleString("bs-BA")})
                </h4>
                {isAnyFilterActive && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Filtrirano ({formatKM(filteredTotalCost)})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isAnyFilterActive && (
                  <button
                    onClick={resetAllFilters}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-black text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                  >
                    <FilterX className="w-3.5 h-3.5" /> Poništi sve filtere
                  </button>
                )}
                <button
                  onClick={() => exportTransactionsToExcel(filteredData, `Segment_${segmentName}.xlsx`)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Izvoz
                </button>
              </div>
            </div>

            {/* Inkrementalna Scroll Tabela sa Kolonskim Filterima */}
            <div
              ref={containerRef}
              onScroll={handleScroll}
              className="overflow-x-auto overflow-y-auto max-h-[420px] scroll-smooth"
            >
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 shadow-xs">
                  {/* 1. RED */}
                  <tr>
                    <th className="p-2 text-center w-12">R.b.</th>
                    <th className="p-2 w-24">Datum</th>
                    <th className="p-2 w-28">Registracija</th>
                    <th className="p-2 w-24">Garažni Br.</th>
                    <th className="p-2 w-32">Tip Mehanizacije</th>
                    <th className="p-2 w-36">Serviser / Dobavljač</th>
                    <th className="p-2 w-48">Opis Popravke / Dio</th>
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
                        value={colFilterSupplier === "all" ? "" : colFilterSupplier}
                        onChange={(e) => setColFilterSupplier(e.target.value || "all")}
                        placeholder="🔍 Serviser..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-[11px] font-medium outline-none"
                      />
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
                          className="p-2.5 font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer hover:underline"
                        >
                          {c.reg}
                        </td>
                        <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">
                          {c.garazniBroj || "-"}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">
                          {c.tipMehan || "-"}
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
                        Nema pronađenih servisa u ovom segmentu za odabrane filtere.
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
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
