"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { exportMasterFleetToExcel } from "@/lib/exportExcel.js";
import { Download, RotateCcw, ArrowDown as ScrollDown, CheckCircle2, Loader2, Edit3, FilterX } from "lucide-react";

export function WarehouseFleet({
  warehouseMasterFleet,
  onOpenVehicleModal,
  onOpenEditVehicle,
  currentRole
}) {
  const [colFilterGarazni, setColFilterGarazni] = useState("");
  const [colFilterReg, setColFilterReg] = useState("");
  const [colFilterBrand, setColFilterBrand] = useState("all");
  const [colFilterModel, setColFilterModel] = useState("");
  const [colFilterYear, setColFilterYear] = useState("");
  const [colFilterVin, setColFilterVin] = useState("");
  const [colFilterStatus, setColFilterStatus] = useState("Aktivno");

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

  // Filtrirani podaci na osnovu kolonskih filtera
  const filteredData = useMemo(() => {
    const gbTerm = colFilterGarazni.trim().toLowerCase();
    const regTerm = colFilterReg.trim().toLowerCase();
    const modelTerm = colFilterModel.trim().toLowerCase();
    const yearTerm = colFilterYear.trim().toLowerCase();
    const vinTerm = colFilterVin.trim().toLowerCase();

    return warehouseMasterFleet.filter((v) => {
      const vStatus = v.status || "Aktivno";
      const matchStatus =
        colFilterStatus === "all" ||
        vStatus.toLowerCase() === colFilterStatus.toLowerCase() ||
        (colFilterStatus === "Aktivno" && !vStatus.toLowerCase().includes("prodat") && !vStatus.toLowerCase().includes("rashod"));

      const matchBrand =
        colFilterBrand === "all" || (v.markaVoz || "").trim().toLowerCase() === colFilterBrand.toLowerCase();

      const matchGb = !gbTerm || (v.garazniBroj && v.garazniBroj.toLowerCase().includes(gbTerm));
      const matchReg = !regTerm || (v.reg && v.reg.toLowerCase().includes(regTerm));
      const matchModel = !modelTerm || (v.modelVoz && v.modelVoz.toLowerCase().includes(modelTerm));
      const matchYear = !yearTerm || (v.godProizvodnje && v.godProizvodnje.toString().toLowerCase().includes(yearTerm));
      const matchVin = !vinTerm || (v.brojSasije && v.brojSasije.toLowerCase().includes(vinTerm));

      return matchStatus && matchBrand && matchGb && matchReg && matchModel && matchYear && matchVin;
    });
  }, [
    warehouseMasterFleet,
    colFilterStatus,
    colFilterBrand,
    colFilterGarazni,
    colFilterReg,
    colFilterModel,
    colFilterYear,
    colFilterVin
  ]);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [
    colFilterStatus,
    colFilterBrand,
    colFilterGarazni,
    colFilterReg,
    colFilterModel,
    colFilterYear,
    colFilterVin
  ]);

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
    colFilterStatus !== "Aktivno" ||
    colFilterBrand !== "all" ||
    colFilterGarazni !== "" ||
    colFilterReg !== "" ||
    colFilterModel !== "" ||
    colFilterYear !== "" ||
    colFilterVin !== "";

  const resetAllFilters = () => {
    setColFilterStatus("Aktivno");
    setColFilterBrand("all");
    setColFilterGarazni("");
    setColFilterReg("");
    setColFilterModel("");
    setColFilterYear("");
    setColFilterVin("");
    setVisibleCount(BATCH_SIZE);
  };

  const canEditVehicle =
    currentRole?.permissions?.canRegisterVehicle ||
    currentRole?.permissions?.canEditCosts ||
    currentRole?.roleId === "superadmin" ||
    currentRole?.roleId === "warehouse_specialist";

  return (
    <div className="space-y-6">
      {/* Header Kartica */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🚜</span> Šifrarnik Skladišne Mehanizacije
              <span className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-bold px-2.5 py-0.5 rounded-full">
                {visibleItems.length} / {filteredData.length} jedinica
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Matični podaci svih viljuškara i paletara sa ugrađenim filterima u kolonama tabele
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isAnyFilterActive && (
              <button
                onClick={resetAllFilters}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <FilterX className="w-3.5 h-3.5" /> Poništi filtere
              </button>
            )}
            <button
              onClick={() => exportMasterFleetToExcel(filteredData, "Skladisna_Mehanizacija_Sifrarnik.xlsx")}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-extrabold rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Izvoz Šifrarnika (Excel)
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
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 shadow-xs">
              {/* 1. RED: Nazivi kolona */}
              <tr>
                <th className="p-2.5 text-center w-12">R.b.</th>
                <th className="p-2.5 w-28">Garažni Br.</th>
                <th className="p-2.5 w-32">Interna Oznaka / Reg</th>
                <th className="p-2.5 w-36">Marka</th>
                <th className="p-2.5 w-36">Model / Tip</th>
                <th className="p-2.5 w-24">Godište</th>
                <th className="p-2.5 w-44">Broj Šasije</th>
                <th className="p-2.5 text-center w-32">Status</th>
                <th className="p-2.5 text-center w-36">Akcije</th>
              </tr>

              {/* 2. RED: In-Table Filteri */}
              <tr className="bg-slate-200/90 dark:bg-slate-950 border-t border-slate-300 dark:border-slate-800 font-normal">
                <th className="p-1.5 text-center">
                  <span className="text-[10px] text-slate-400 font-mono">#</span>
                </th>

                {/* GB filter */}
                <th className="p-1.5">
                  <input
                    type="text"
                    value={colFilterGarazni}
                    onChange={(e) => setColFilterGarazni(e.target.value)}
                    placeholder="🔍 GB..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-medium outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-white"
                  />
                </th>

                {/* Reg filter */}
                <th className="p-1.5">
                  <input
                    type="text"
                    value={colFilterReg}
                    onChange={(e) => setColFilterReg(e.target.value)}
                    placeholder="🔍 Reg..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold uppercase outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-white"
                  />
                </th>

                {/* Marka select filter */}
                <th className="p-1.5">
                  <select
                    value={colFilterBrand}
                    onChange={(e) => setColFilterBrand(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-white cursor-pointer"
                  >
                    <option value="all">Sve marke</option>
                    {distinctBrands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </th>

                {/* Model filter */}
                <th className="p-1.5">
                  <input
                    type="text"
                    value={colFilterModel}
                    onChange={(e) => setColFilterModel(e.target.value)}
                    placeholder="🔍 Model..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-medium outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-white"
                  />
                </th>

                {/* Godište filter */}
                <th className="p-1.5">
                  <input
                    type="text"
                    value={colFilterYear}
                    onChange={(e) => setColFilterYear(e.target.value)}
                    placeholder="🔍 God..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-medium outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-white"
                  />
                </th>

                {/* Šasija filter */}
                <th className="p-1.5">
                  <input
                    type="text"
                    value={colFilterVin}
                    onChange={(e) => setColFilterVin(e.target.value)}
                    placeholder="🔍 Šasija..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-mono outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-white"
                  />
                </th>

                {/* Status select filter */}
                <th className="p-1.5">
                  <select
                    value={colFilterStatus}
                    onChange={(e) => setColFilterStatus(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-white cursor-pointer"
                  >
                    <option value="Aktivno">🟢 Aktivne</option>
                    <option value="Prodato">🟣 Prodate</option>
                    <option value="Rashodovano">🔴 Rashod</option>
                    <option value="all">Svi statusi</option>
                  </select>
                </th>

                {/* Reset button */}
                <th className="p-1.5 text-center">
                  <button
                    onClick={resetAllFilters}
                    title="Poništi sve filtere"
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 w-full"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-900">
              {visibleItems.length > 0 ? (
                visibleItems.map((v, idx) => {
                  const st = v.status || "Aktivno";
                  let stClass =
                    "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300";
                  if (st === "Prodato") {
                    stClass =
                      "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-300";
                  } else if (st === "Rashodovano") {
                    stClass =
                      "bg-red-100 text-red-900 border-red-300 dark:bg-red-950 dark:text-red-300";
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
                        <div className="flex items-center gap-2">
                          {v.imageUrl && (
                            <img
                              src={v.imageUrl}
                              alt={v.reg}
                              className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs"
                            />
                          )}
                          <span>{v.reg}</span>
                        </div>
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
                    Nema pronađene skladišne mehanizacije za odabrane kolonske filtere.
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
