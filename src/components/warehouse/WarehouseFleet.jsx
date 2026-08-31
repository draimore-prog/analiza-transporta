"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { exportMasterFleetToExcel } from "@/lib/exportExcel.js";
import { Download, RotateCcw, ArrowDown as ScrollDown, CheckCircle2, Loader2, Edit3 } from "lucide-react";

export function WarehouseFleet({
  warehouseMasterFleet,
  onOpenVehicleModal,
  onOpenEditVehicle,
  currentRole
}) {
  const [statusFilter, setStatusFilter] = useState("Aktivno");
  const [brandFilter, setBrandFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [visibleCount, setVisibleCount] = useState(60);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const containerRef = useRef(null);
  const sentinelRef = useRef(null);

  const BATCH_SIZE = 60;

  // Unikatne marke
  const distinctBrands = useMemo(() => {
    return Array.from(new Set(warehouseMasterFleet.map((v) => (v.markaVoz || "").trim())))
      .filter((b) => b && b !== "-")
      .sort();
  }, [warehouseMasterFleet]);

  // Filter
  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return warehouseMasterFleet.filter((v) => {
      const vStatus = v.status || "Aktivno";
      const matchStatus =
        statusFilter === "all" ||
        vStatus.toLowerCase() === statusFilter.toLowerCase() ||
        (statusFilter === "Aktivno" && !vStatus.toLowerCase().includes("prodat") && !vStatus.toLowerCase().includes("rashod"));

      const matchBrand =
        brandFilter === "all" || (v.markaVoz || "").trim().toLowerCase() === brandFilter.toLowerCase();

      const matchSearch =
        !term ||
        (v.reg && v.reg.toLowerCase().includes(term)) ||
        (v.garazniBroj && v.garazniBroj.toLowerCase().includes(term)) ||
        (v.markaVoz && v.markaVoz.toLowerCase().includes(term)) ||
        (v.modelVoz && v.modelVoz.toLowerCase().includes(term)) ||
        (v.brojSasije && v.brojSasije.toLowerCase().includes(term));

      return matchStatus && matchBrand && matchSearch;
    });
  }, [warehouseMasterFleet, statusFilter, brandFilter, searchTerm]);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [statusFilter, brandFilter, searchTerm]);

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

  const canEditVehicle = currentRole?.permissions?.canRegisterVehicle || currentRole?.permissions?.canEditCosts || currentRole?.roleId === "superadmin" || currentRole?.roleId === "warehouse_specialist";

  return (
    <div className="space-y-6">
      {/* Header Kartica */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🚜</span> Šifrarnik Skladišne Mehanizacije
              <span className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-bold px-2.5 py-0.5 rounded-full">
                {visibleItems.length} / {filteredData.length} jedinica
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Matični podaci svih viljuškara (elektro, diesel, plin), paletara i prateće mehanizacije
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setStatusFilter("Aktivno");
                setBrandFilter("all");
                setSearchTerm("");
                setVisibleCount(BATCH_SIZE);
              }}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <button
              onClick={() => exportMasterFleetToExcel(filteredData, "Skladisna_Mehanizacija_Sifrarnik.xlsx")}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-extrabold rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Izvoz Šifrarnika (Excel)
            </button>
          </div>
        </div>

        {/* Filter Kontrole */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
              Status Mašina
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-xs font-bold text-slate-800 dark:text-white outline-none"
            >
              <option value="Aktivno">🟢 Aktivne Mašine (594)</option>
              <option value="Rashodovano">🔴 Samo Rashodovane</option>
              <option value="Prodato">🟣 Samo Prodate</option>
              <option value="all">Svi statusi (Aktivne + Prodate + Rashod)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
              Marka Viljuškara
            </label>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-xs font-bold text-slate-800 dark:text-white outline-none"
            >
              <option value="all">Sve marke viljuškara</option>
              {distinctBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
              Pretraga
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Pretraži po oznaci, serijskom broju..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-xs font-bold text-slate-800 dark:text-white outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="overflow-x-auto overflow-y-auto max-h-[620px] scroll-smooth"
        >
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="p-3 text-center">R.b.</th>
                <th className="p-3">Garažni Br.</th>
                <th className="p-3">Interna Oznaka / Reg</th>
                <th className="p-3">Marka</th>
                <th className="p-3">Model / Tip</th>
                <th className="p-3">Godište</th>
                <th className="p-3">Broj Šasije</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-900">
              {visibleItems.length > 0 ? (
                visibleItems.map((v, idx) => {
                  const st = v.status || "Aktivno";
                  let stClass = "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300";
                  if (st === "Prodato") {
                    stClass = "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-300";
                  } else if (st === "Rashodovano") {
                    stClass = "bg-red-100 text-red-900 border-red-300 dark:bg-red-950 dark:text-red-300";
                  }

                  return (
                    <tr
                      key={v.reg || idx}
                      className="hover:bg-amber-50/40 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700/50 transition-colors"
                    >
                      <td className="p-3 text-center font-mono text-slate-500 text-xs">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {v.garazniBroj || "-"}
                      </td>
                      <td
                        onClick={() => onOpenVehicleModal(v.reg)}
                        className="p-3 font-black text-amber-700 dark:text-amber-400 cursor-pointer hover:underline"
                      >
                        {v.reg}
                      </td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                        {v.markaVoz || "-"}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {v.modelVoz || "-"}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {v.godProizvodnje || "-"}
                      </td>
                      <td className="p-3 font-mono text-slate-500 text-[11px]">
                        {v.brojSasije || "-"}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${stClass}`}>
                          {st}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenVehicleModal(v.reg)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-bold px-2 py-1 rounded-lg text-xs transition-colors border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                          >
                            📋 Karton
                          </button>
                          {canEditVehicle && onOpenEditVehicle && (
                            <button
                              onClick={() => onOpenEditVehicle(v)}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-bold px-2 py-1 rounded-lg text-xs transition-colors border border-amber-200 dark:border-amber-800 cursor-pointer flex items-center gap-1"
                              title="Uredi matične podatke ove mašine"
                            >
                              <Edit3 className="w-3 h-3" /> Uredi
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-medium italic">
                    Nema pronađene skladišne mehanizacije za odabrane filtere.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Sentinel element za automatski infinite scroll */}
          <div ref={sentinelRef} className="h-4 w-full" />
        </div>

        {/* Traka statusa inkrementalnog učitavanja */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center text-xs gap-3">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-900 dark:text-white">
              Prikazano: {visibleItems.length.toLocaleString("bs-BA")} od {filteredData.length.toLocaleString("bs-BA")} mašina
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
                    <span>Učitavam starije mašine...</span>
                  </>
                ) : (
                  <>
                    <ScrollDown className="w-3.5 h-3.5" />
                    <span>Učitaj još {BATCH_SIZE} mašina</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-extrabold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Sva skladišna mehanizacija je uspješno učitana</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
