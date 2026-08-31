"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { formatDate, formatKM } from "@/lib/calculations.js";
import { exportTransactionsToExcel } from "@/lib/exportExcel.js";
import { Download, Trash2, ArrowDown, CheckCircle2, Loader2 } from "lucide-react";

export function WarehouseRepairs({
  warehouseCostData,
  onOpenVehicleModal,
  onDeleteCostRecord,
  activeUser
}) {
  const [selectedYear, setSelectedYear] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState("new-first");
  const [visibleCount, setVisibleCount] = useState(60);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const containerRef = useRef(null);
  const sentinelRef = useRef(null);

  const BATCH_SIZE = 60;

  // Raspoložive godine
  const availableYears = useMemo(() => {
    return Array.from(new Set(warehouseCostData.map((c) => c.year))).sort((a, b) => b - a);
  }, [warehouseCostData]);

  // Filtrirani i sortirani podaci
  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = warehouseCostData.filter((item) => {
      const matchYear = selectedYear === "all" || item.year === parseInt(selectedYear);
      const matchTerm =
        !term ||
        (item.reg && item.reg.toLowerCase().includes(term)) ||
        (item.garazniBroj && item.garazniBroj.toLowerCase().includes(term)) ||
        (item.opisPopravke && item.opisPopravke.toLowerCase().includes(term)) ||
        (item.opisRadova && item.opisRadova.toLowerCase().includes(term)) ||
        (item.dobavljacOrig && item.dobavljacOrig.toLowerCase().includes(term)) ||
        (item.segment && item.segment.toLowerCase().includes(term));

      return matchYear && matchTerm;
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
      filtered.sort((a, b) => b.cost - a.cost);
    } else if (sortMode === "cost-asc") {
      filtered.sort((a, b) => a.cost - b.cost);
    }

    return filtered;
  }, [warehouseCostData, selectedYear, searchTerm, sortMode]);

  // Resetovanje na početni broj kada se promjene filteri
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [selectedYear, searchTerm, sortMode]);

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

  const canDelete = activeUser && ["superadmin", "editor", "warehouse_specialist"].includes(activeUser.role);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* Header Kontrole */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <span>📋 Inkrementalni Pregled Opravki Skladišne Mehanizacije</span>
              <span className="text-xs bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
                {visibleItems.length.toLocaleString("bs-BA")} / {filteredData.length.toLocaleString("bs-BA")}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Skrolajte prema dolje za automatsko učitavanje starijih opravki viljuškara (Infinite Scroll)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Godina */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                Godina
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500 bg-white dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200"
              >
                <option value="all">Sve godine (2021-2026)</option>
                {availableYears.map((y) => (
                  <option key={y} value={y.toString()}>
                    {y}. godina
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                Sortiranje / Unosi
              </label>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
                className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500 bg-white dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200"
              >
                <option value="new-first">🆕 Najnoviji unosi na vrhu</option>
                <option value="date-desc">📅 Datum (Najnovije prvo)</option>
                <option value="date-asc">📅 Datum (Najstarije prvo)</option>
                <option value="cost-desc">💰 Trošak (Najveći prvo)</option>
                <option value="cost-asc">💰 Trošak (Najmanji prvo)</option>
              </select>
            </div>

            {/* Pretraga */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                Pretraga
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Pretraži reg, opis ili servisera..."
                className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 w-full sm:w-56 focus:ring-2 focus:ring-amber-500 font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Excel Izvoz */}
            <div className="flex items-end">
              <button
                onClick={() => exportTransactionsToExcel(filteredData, "Skladisna_Mehanizacija_Opravke.xlsx")}
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold px-3 py-1.5 rounded-lg text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer mt-3 sm:mt-0"
              >
                <Download className="w-3.5 h-3.5" /> Izvezi Sve ({filteredData.length.toLocaleString("bs-BA")})
              </button>
            </div>
          </div>
        </div>

        {/* Tabela sa Inkrementalnim Skrolom */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="overflow-x-auto overflow-y-auto max-h-[620px] border border-slate-200 dark:border-slate-800 rounded-xl shadow-inner scroll-smooth"
        >
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 z-10 shadow-xs">
              <tr>
                <th className="py-2.5 px-3">Datum</th>
                <th className="py-2.5 px-3">Registracija / Oznaka</th>
                <th className="py-2.5 px-3">Garažni Broj</th>
                <th className="py-2.5 px-3">Tip Mehanizacije</th>
                <th className="py-2.5 px-3">Marka</th>
                <th className="py-2.5 px-3">Segment</th>
                <th className="py-2.5 px-3">Opis Popravke</th>
                <th className="py-2.5 px-3">Serviser / Dobavljač</th>
                <th className="py-2.5 px-3 text-right">Trošak (KM)</th>
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
                      {item.tipMehan || "Skladišna mehanizacija"}
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
                    colSpan={9}
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
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl gap-3">
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
