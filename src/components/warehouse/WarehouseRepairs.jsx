"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { formatDate, formatKM } from "@/lib/calculations.js";
import { exportTransactionsToExcel } from "@/lib/exportExcel.js";
import {
  Download,
  Trash2,
  ArrowDown,
  CheckCircle2,
  Loader2,
  RotateCcw,
  FilterX
} from "lucide-react";

export function WarehouseRepairs({
  warehouseCostData,
  onOpenVehicleModal,
  onDeleteCostRecord,
  activeUser
}) {
  const [selectedYear, setSelectedYear] = useState("all");
  const [colFilterReg, setColFilterReg] = useState("");
  const [colFilterGb, setColFilterGb] = useState("");
  const [colFilterBrand, setColFilterBrand] = useState("all");
  const [colFilterSegment, setColFilterSegment] = useState("all");
  const [colFilterOpis, setColFilterOpis] = useState("");
  const [colFilterSupplier, setColFilterSupplier] = useState("");

  const [sortMode, setSortMode] = useState("new-first");
  const [visibleCount, setVisibleCount] = useState(60);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const containerRef = useRef(null);
  const sentinelRef = useRef(null);

  const BATCH_SIZE = 60;

  // Raspoložive godine
  const availableYears = useMemo(() => {
    return Array.from(new Set(warehouseCostData.map((c) => c.year))).filter(Boolean).sort((a, b) => b - a);
  }, [warehouseCostData]);

  // Unikatne marke
  const distinctBrands = useMemo(() => {
    return Array.from(new Set(warehouseCostData.map((c) => (c.markaVoz || "").trim())))
      .filter((b) => b && b !== "-")
      .sort();
  }, [warehouseCostData]);

  // Unikatni segmenti
  const distinctSegments = useMemo(() => {
    return Array.from(new Set(warehouseCostData.map((c) => (c.segment || "").trim())))
      .filter(Boolean)
      .sort();
  }, [warehouseCostData]);

  // Filtrirani i sortirani podaci
  const filteredData = useMemo(() => {
    const regTerm = colFilterReg.trim().toLowerCase();
    const gbTerm = colFilterGb.trim().toLowerCase();
    const opisTerm = colFilterOpis.trim().toLowerCase();
    const supTerm = colFilterSupplier.trim().toLowerCase();

    const filtered = warehouseCostData.filter((item) => {
      const matchYear = selectedYear === "all" || item.year === parseInt(selectedYear);

      const matchReg = !regTerm || (item.reg && item.reg.toLowerCase().includes(regTerm));
      const matchGb = !gbTerm || (item.garazniBroj && item.garazniBroj.toLowerCase().includes(gbTerm));

      const matchBrand =
        colFilterBrand === "all" || (item.markaVoz || "").trim().toLowerCase() === colFilterBrand.toLowerCase();

      const matchSegment =
        colFilterSegment === "all" || (item.segment || "").trim().toLowerCase() === colFilterSegment.toLowerCase();

      const matchOpis =
        !opisTerm ||
        (item.opisPopravke && item.opisPopravke.toLowerCase().includes(opisTerm)) ||
        (item.opisRadova && item.opisRadova.toLowerCase().includes(opisTerm)) ||
        (item.opis && item.opis.toLowerCase().includes(opisTerm));

      const matchSup =
        !supTerm ||
        (item.dobavljacOrig && item.dobavljacOrig.toLowerCase().includes(supTerm)) ||
        (item.dobavljac && item.dobavljac.toLowerCase().includes(supTerm));

      return matchYear && matchReg && matchGb && matchBrand && matchSegment && matchOpis && matchSup;
    });

    if (sortMode === "new-first") {
      filtered.sort((a, b) => {
        if (a.isNewCustom && !b.isNewCustom) return -1;
        if (!a.isNewCustom && b.isNewCustom) return 1;
        const timeB = a.datumObj ? a.datumObj.getTime() : 0;
        const timeA = b.datumObj ? b.datumObj.getTime() : 0;
        return timeA - timeB;
      });
    } else if (sortMode === "date-desc") {
      filtered.sort((a, b) => (b.datumObj?.getTime() || 0) - (a.datumObj?.getTime() || 0));
    } else if (sortMode === "date-asc") {
      filtered.sort((a, b) => (a.datumObj?.getTime() || 0) - (b.datumObj?.getTime() || 0));
    } else if (sortMode === "cost-desc") {
      filtered.sort((a, b) => (b.cost || 0) - (a.cost || 0));
    } else if (sortMode === "cost-asc") {
      filtered.sort((a, b) => (a.cost || 0) - (b.cost || 0));
    }

    return filtered;
  }, [
    warehouseCostData,
    selectedYear,
    colFilterReg,
    colFilterGb,
    colFilterBrand,
    colFilterSegment,
    colFilterOpis,
    colFilterSupplier,
    sortMode
  ]);

  // Resetovanje na početni broj kada se promjene filteri
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [
    selectedYear,
    colFilterReg,
    colFilterGb,
    colFilterBrand,
    colFilterSegment,
    colFilterOpis,
    colFilterSupplier,
    sortMode
  ]);

  // Vidljivi elementi na osnovu inkrementalnog skrola
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

  // IntersectionObserver za automatsko učitavanje pri skrolu do dna tabele
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

  // Skrol listener za kontejner
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
    colFilterReg !== "" ||
    colFilterGb !== "" ||
    colFilterBrand !== "all" ||
    colFilterSegment !== "all" ||
    colFilterOpis !== "" ||
    colFilterSupplier !== "";

  const resetAllFilters = () => {
    setSelectedYear("all");
    setColFilterReg("");
    setColFilterGb("");
    setColFilterBrand("all");
    setColFilterSegment("all");
    setColFilterOpis("");
    setColFilterSupplier("");
    setVisibleCount(BATCH_SIZE);
  };

  const canDelete =
    activeUser &&
    ["superadmin", "editor", "warehouse_specialist", "admin"].includes(activeUser.role);

  return (
    <div className="space-y-4">
      {/* Header Kartica - Odvojena tamna kartica */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-orange-950 text-white p-5 rounded-2xl shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <span>📋 Pregled Opravki Skladišne Mehanizacije</span>
              <span className="text-xs bg-amber-500/30 text-amber-200 border border-amber-400 px-3 py-0.5 rounded-full font-mono font-bold">
                {visibleItems.length.toLocaleString("bs-BA")} / {filteredData.length.toLocaleString("bs-BA")} opravki
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Filteri su integrisani direktno u zaglavlje svake kolone tabele ispod
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/20">
              <span className="text-[10px] font-bold text-amber-200 uppercase">Sort:</span>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
                className="text-xs bg-transparent text-white font-bold outline-none cursor-pointer"
              >
                <option value="new-first" className="bg-slate-900 text-white">🆕 Najnoviji unosi</option>
                <option value="date-desc" className="bg-slate-900 text-white">📅 Datum (Najnovije prvo)</option>
                <option value="date-asc" className="bg-slate-900 text-white">📅 Datum (Najstarije prvo)</option>
                <option value="cost-desc" className="bg-slate-900 text-white">💰 Trošak (Najveći prvo)</option>
                <option value="cost-asc" className="bg-slate-900 text-white">💰 Trošak (Najmanji prvo)</option>
              </select>
            </div>

            {isAnyFilterActive && (
              <button
                onClick={resetAllFilters}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-1.5 rounded-xl shadow-xs transition-all text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FilterX className="w-3.5 h-3.5" /> Poništi filtere
              </button>
            )}

            {/* Excel Izvoz */}
            <button
              onClick={() => exportTransactionsToExcel(filteredData, "Skladisna_Mehanizacija_Opravke.xlsx")}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Izvezi Sve ({filteredData.length.toLocaleString("bs-BA")})
            </button>
          </div>
        </div>
      </div>

      {/* Tabela sa Inkrementalnim Skrolom i In-Table Filterima */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="overflow-x-auto overflow-y-auto min-h-[380px] max-h-[calc(100vh-310px)] scroll-smooth"
        >
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 z-20 shadow-xs">
                {/* 1. RED: Nazivi kolona */}
                <tr>
                  <th className="py-2.5 px-3 w-28">Datum</th>
                  <th className="py-2.5 px-3 w-32">Interna Oznaka / Reg</th>
                  <th className="py-2.5 px-3 w-24">Garažni Br.</th>
                  <th className="py-2.5 px-3 w-28">Marka</th>
                  <th className="py-2.5 px-3 w-36">Segment</th>
                  <th className="py-2.5 px-3 w-64">Opis Popravke</th>
                  <th className="py-2.5 px-3 w-40">Serviser / Dobavljač</th>
                  <th className="py-2.5 px-3 text-right w-28">Trošak (KM)</th>
                </tr>

                {/* 2. RED: In-Table Kolonski Filteri */}
                <tr className="bg-slate-200/90 dark:bg-slate-950 border-t border-slate-300 dark:border-slate-800 font-normal">
                  {/* Datum / Godina */}
                  <th className="p-1.5">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-1.5 py-1 text-[11px] font-bold outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-white cursor-pointer"
                    >
                      <option value="all">Sve god.</option>
                      {availableYears.map((y) => (
                        <option key={y} value={y.toString()}>
                          {y}.
                        </option>
                      ))}
                    </select>
                  </th>

                  {/* Registracija / Oznaka */}
                  <th className="p-1.5">
                    <input
                      type="text"
                      value={colFilterReg}
                      onChange={(e) => setColFilterReg(e.target.value)}
                      placeholder="🔍 Oznaka..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold uppercase outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-white"
                    />
                  </th>

                  {/* Garažni broj */}
                  <th className="p-1.5">
                    <input
                      type="text"
                      value={colFilterGb}
                      onChange={(e) => setColFilterGb(e.target.value)}
                      placeholder="🔍 GB..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-medium outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-white"
                    />
                  </th>

                  {/* Marka */}
                  <th className="p-1.5">
                    <select
                      value={colFilterBrand}
                      onChange={(e) => setColFilterBrand(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-1.5 py-1 text-[11px] font-bold outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-white cursor-pointer"
                    >
                      <option value="all">Sve marke</option>
                      {distinctBrands.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </th>

                  {/* Segment */}
                  <th className="p-1.5">
                    <select
                      value={colFilterSegment}
                      onChange={(e) => setColFilterSegment(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-1.5 py-1 text-[11px] font-bold outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-white cursor-pointer"
                    >
                      <option value="all">Svi segmenti</option>
                      {distinctSegments.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </th>

                  {/* Opis */}
                  <th className="p-1.5">
                    <input
                      type="text"
                      value={colFilterOpis}
                      onChange={(e) => setColFilterOpis(e.target.value)}
                      placeholder="🔍 Opis..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-medium outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-white"
                    />
                  </th>

                  {/* Serviser */}
                  <th className="p-1.5">
                    <input
                      type="text"
                      value={colFilterSupplier}
                      onChange={(e) => setColFilterSupplier(e.target.value)}
                      placeholder="🔍 Serviser..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-medium outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-white"
                    />
                  </th>

                  {/* Reset */}
                  <th className="p-1.5 text-center">
                    <button
                      onClick={resetAllFilters}
                      title="Poništi sve filtere kolona"
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 w-full"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {visibleItems.length > 0 ? (
                  visibleItems.map((item, idx) => (
                    <tr
                      key={item.id || `${item.reg}-${item.datum}-${idx}`}
                      className={`hover:bg-amber-50/60 dark:hover:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 transition-colors ${
                        item.isNewCustom ? "bg-emerald-50/40 dark:bg-emerald-950/20 font-medium" : ""
                      }`}
                    >
                      <td className="py-2 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                        {formatDate(item.datumObj || item.datum)}
                        {item.isNewCustom && (
                          <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-extrabold ml-1">
                            🆕 Novo
                          </span>
                        )}
                      </td>
                      <td
                        onClick={() => onOpenVehicleModal(item.reg)}
                        className="py-2 px-3 font-bold text-amber-700 dark:text-amber-400 cursor-pointer hover:underline"
                      >
                        {item.reg}
                      </td>
                      <td className="py-2 px-3 font-mono font-semibold text-slate-600 dark:text-slate-400">
                        {item.garazniBroj || "-"}
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                        {item.markaVoz || "-"}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">
                        {item.segment || "-"}
                      </td>
                      <td className="py-2 px-3 text-slate-900 dark:text-white font-semibold break-words max-w-[220px]">
                        {item.opisPopravke || item.opisRadova || item.opis || "-"}
                      </td>
                      <td
                        className="py-2 px-3 text-slate-600 dark:text-slate-400 text-xs truncate max-w-[150px]"
                        title={item.dobavljacOrig || item.dobavljac}
                      >
                        {item.dobavljacOrig || item.dobavljac || "-"}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{formatKM(item.cost || 0)}</span>
                          {item.isNewCustom && canDelete && item.id && onDeleteCostRecord && (
                            <button
                              onClick={() => onDeleteCostRecord(item.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 p-1 rounded font-bold text-xs transition-all cursor-pointer"
                              title="Obriši ovaj ručno uneseni trošak"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-8 text-center text-slate-400 font-medium italic"
                    >
                      Nema popravki skladišne mehanizacije koje odgovaraju odabranim filterima.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Sentinel element za automatski infinite scroll */}
            <div ref={sentinelRef} className="h-4 w-full" />
          </div>

          {/* Traka statusa inkrementalnog učitavanja */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-900 dark:text-white">
                Prikazano: {visibleItems.length.toLocaleString("bs-BA")} od {filteredData.length.toLocaleString("bs-BA")} opravki
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
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Učitavam starije opravke...</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="w-3.5 h-3.5" />
                      <span>Učitaj još {BATCH_SIZE} opravki</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-extrabold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sve opravke su uspješno učitane</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
