"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { exportMasterFleetToExcel } from "@/lib/exportExcel.js";
import { cleanVehicleType } from "@/lib/calculations.js";
import {
  Download,
  Plus,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowDown as ScrollDown,
  CheckCircle2,
  Loader2,
  Edit3,
  FilterX
} from "lucide-react";

export function MasterFleetTable({
  masterFleet,
  onOpenVehicleModal,
  onOpenNewVehicleModal,
  onOpenEditVehicle,
  currentRole
}) {
  // Pojedinačni filteri po kolonama unutar tabele
  const [colFilterGarazni, setColFilterGarazni] = useState("");
  const [colFilterReg, setColFilterReg] = useState("");
  const [colFilterType, setColFilterType] = useState("all");
  const [colFilterBrand, setColFilterBrand] = useState("all");
  const [colFilterModel, setColFilterModel] = useState("");
  const [colFilterYear, setColFilterYear] = useState("");
  const [colFilterVin, setColFilterVin] = useState("");
  const [colFilterStatus, setColFilterStatus] = useState("Aktivno");

  const [sortCol, setSortCol] = useState("garazniBroj");
  const [sortDir, setSortDir] = useState("asc");

  const [visibleCount, setVisibleCount] = useState(60);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const containerRef = useRef(null);
  const sentinelRef = useRef(null);

  const BATCH_SIZE = 60;

  // Unikatni tipovi i marke za dropdown filtere u zaglavlju kolona
  const distinctTypes = useMemo(() => {
    const set = new Set();
    masterFleet.forEach((v) => {
      const cleanT = cleanVehicleType(v.tipMehan);
      if (cleanT && cleanT !== "Servis motornih vozila") {
        set.add(cleanT);
      }
    });
    return Array.from(set).sort();
  }, [masterFleet]);

  const distinctBrands = useMemo(() => {
    return Array.from(new Set(masterFleet.map((v) => (v.markaVoz || "").trim())))
      .filter((b) => b && b !== "-")
      .sort();
  }, [masterFleet]);

  // Filtrirani i sortirani podaci na osnovu kolonskih filtera
  const filteredData = useMemo(() => {
    const gbTerm = colFilterGarazni.trim().toLowerCase();
    const regTerm = colFilterReg.trim().toLowerCase();
    const modelTerm = colFilterModel.trim().toLowerCase();
    const yearTerm = colFilterYear.trim().toLowerCase();
    const vinTerm = colFilterVin.trim().toLowerCase();

    const filtered = masterFleet.filter((v) => {
      // 1. Status filter
      const vStatus = v.status || "Aktivno";
      const matchStatus =
        colFilterStatus === "all" ||
        vStatus.toLowerCase() === colFilterStatus.toLowerCase() ||
        (colFilterStatus === "Aktivno" && !vStatus.toLowerCase().includes("prodat") && !vStatus.toLowerCase().includes("rashod"));

      // 2. Tip vozila filter
      const cleanT = cleanVehicleType(v.tipMehan);
      const matchType = colFilterType === "all" || cleanT === colFilterType;

      // 3. Marka filter
      const matchBrand =
        colFilterBrand === "all" || (v.markaVoz || "").trim().toLowerCase() === colFilterBrand.toLowerCase();

      // 4. Garažni broj filter
      const matchGb = !gbTerm || (v.garazniBroj && v.garazniBroj.toLowerCase().includes(gbTerm));

      // 5. Registracija filter
      const matchReg = !regTerm || (v.reg && v.reg.toLowerCase().includes(regTerm));

      // 6. Model filter
      const matchModel = !modelTerm || (v.modelVoz && v.modelVoz.toLowerCase().includes(modelTerm));

      // 7. Godište filter
      const matchYear = !yearTerm || (v.godProizvodnje && v.godProizvodnje.toString().toLowerCase().includes(yearTerm));

      // 8. Šasija (VIN) filter
      const matchVin = !vinTerm || (v.brojSasije && v.brojSasije.toLowerCase().includes(vinTerm));

      return (
        matchStatus &&
        matchType &&
        matchBrand &&
        matchGb &&
        matchReg &&
        matchModel &&
        matchYear &&
        matchVin
      );
    });

    if (sortCol) {
      filtered.sort((a, b) => {
        const valA = (a[sortCol] || "").toString().toLowerCase();
        const valB = (b[sortCol] || "").toString().toLowerCase();
        return sortDir === "asc"
          ? valA.localeCompare(valB, "bs", { numeric: true })
          : valB.localeCompare(valA, "bs", { numeric: true });
      });
    }

    return filtered;
  }, [
    masterFleet,
    colFilterStatus,
    colFilterType,
    colFilterBrand,
    colFilterGarazni,
    colFilterReg,
    colFilterModel,
    colFilterYear,
    colFilterVin,
    sortCol,
    sortDir
  ]);

  // Resetovanje na početni broj kada se promijene filteri
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [
    colFilterStatus,
    colFilterType,
    colFilterBrand,
    colFilterGarazni,
    colFilterReg,
    colFilterModel,
    colFilterYear,
    colFilterVin,
    sortCol,
    sortDir
  ]);

  // Vidljivi elementi
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

  // IntersectionObserver za automatski infinite scroll
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

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const isAnyFilterActive =
    colFilterStatus !== "Aktivno" ||
    colFilterType !== "all" ||
    colFilterBrand !== "all" ||
    colFilterGarazni !== "" ||
    colFilterReg !== "" ||
    colFilterModel !== "" ||
    colFilterYear !== "" ||
    colFilterVin !== "";

  const resetAllFilters = () => {
    setColFilterStatus("Aktivno");
    setColFilterType("all");
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
    currentRole?.roleId === "superadmin";

  return (
    <div className="space-y-6">
      {/* Header Kartica */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <span>🏢 Matična baza podataka voznog parka</span>
              <span className="text-xs bg-indigo-500/30 text-indigo-200 border border-indigo-400 px-3 py-0.5 rounded-full font-mono font-bold">
                {visibleItems.length.toLocaleString("bs-BA")} / {filteredData.length.toLocaleString("bs-BA")} vozila
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Filteri su integrisani direktno u zaglavlje svake kolone tabele ispod
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {canEditVehicle && (
              <button
                onClick={onOpenNewVehicleModal}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2 rounded-xl shadow-xs transition-all text-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Dodaj Novo Vozilo
              </button>
            )}
            {isAnyFilterActive && (
              <button
                onClick={resetAllFilters}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-2 rounded-xl shadow-xs transition-all text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FilterX className="w-3.5 h-3.5" /> Poništi filtere
              </button>
            )}
            <button
              onClick={() => exportMasterFleetToExcel(filteredData)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl shadow-xs transition-all text-xs flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Izvezi Šifrarnik ({filteredData.length.toLocaleString("bs-BA")})
            </button>
          </div>
        </div>
      </div>

      {/* Tabela sa Ugrađenim Filterima po Kolonama */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="overflow-x-auto overflow-y-auto min-h-[380px] max-h-[calc(100vh-310px)] scroll-smooth"
        >
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 shadow-xs">
              {/* 1. RED: Nazivi kolona sa sortiranjem */}
              <tr>
                <th className="p-2.5 text-center w-12">R.b.</th>
                <th
                  onClick={() => handleSort("garazniBroj")}
                  className="p-2.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors w-28"
                >
                  <div className="flex items-center gap-1">
                    <span>Garažni Br.</span>
                    {sortCol === "garazniBroj" ? (
                      sortDir === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("reg")}
                  className="p-2.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors w-32"
                >
                  <div className="flex items-center gap-1">
                    <span>Reg. Oznaka</span>
                    {sortCol === "reg" ? (
                      sortDir === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th className="p-2.5 w-44">Tip Mehanizacije</th>
                <th
                  onClick={() => handleSort("markaVoz")}
                  className="p-2.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors w-36"
                >
                  <div className="flex items-center gap-1">
                    <span>Marka</span>
                    {sortCol === "markaVoz" ? (
                      sortDir === "asc" ? (
                        <ArrowUp className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th className="p-2.5 w-36">Model</th>
                <th className="p-2.5 w-24">Godište</th>
                <th className="p-2.5 w-44">Broj Šasije (VIN)</th>
                <th className="p-2.5 text-center w-32">Status</th>
                <th className="p-2.5 text-center w-36">Akcije</th>
              </tr>

              {/* 2. RED: In-Table Interaktivni Filteri za svaku kolonu */}
              <tr className="bg-slate-200/90 dark:bg-slate-950 border-t border-slate-300 dark:border-slate-800 font-normal">
                {/* R.b. filter placeholder */}
                <th className="p-1.5 text-center">
                  <span className="text-[10px] text-slate-400 font-mono">#</span>
                </th>

                {/* Garažni broj input filter */}
                <th className="p-1.5">
                  <input
                    type="text"
                    value={colFilterGarazni}
                    onChange={(e) => setColFilterGarazni(e.target.value)}
                    placeholder="🔍 GB..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-medium outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
                  />
                </th>

                {/* Registracija input filter */}
                <th className="p-1.5">
                  <input
                    type="text"
                    value={colFilterReg}
                    onChange={(e) => setColFilterReg(e.target.value)}
                    placeholder="🔍 Reg..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold uppercase outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
                  />
                </th>

                {/* Tip mehanizacije select dropdown filter */}
                <th className="p-1.5">
                  <select
                    value={colFilterType}
                    onChange={(e) => setColFilterType(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white cursor-pointer"
                  >
                    <option value="all">Svi tipovi</option>
                    {distinctTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </th>

                {/* Marka select dropdown filter */}
                <th className="p-1.5">
                  <select
                    value={colFilterBrand}
                    onChange={(e) => setColFilterBrand(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white cursor-pointer"
                  >
                    <option value="all">Sve marke</option>
                    {distinctBrands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </th>

                {/* Model input filter */}
                <th className="p-1.5">
                  <input
                    type="text"
                    value={colFilterModel}
                    onChange={(e) => setColFilterModel(e.target.value)}
                    placeholder="🔍 Model..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-medium outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
                  />
                </th>

                {/* Godište input filter */}
                <th className="p-1.5">
                  <input
                    type="text"
                    value={colFilterYear}
                    onChange={(e) => setColFilterYear(e.target.value)}
                    placeholder="🔍 God..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-medium outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
                  />
                </th>

                {/* Šasija (VIN) input filter */}
                <th className="p-1.5">
                  <input
                    type="text"
                    value={colFilterVin}
                    onChange={(e) => setColFilterVin(e.target.value)}
                    placeholder="🔍 Šasija..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-mono outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
                  />
                </th>

                {/* Status select dropdown filter */}
                <th className="p-1.5">
                  <select
                    value={colFilterStatus}
                    onChange={(e) => setColFilterStatus(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white cursor-pointer"
                  >
                    <option value="Aktivno">🟢 Aktivna</option>
                    <option value="Prodato">🟣 Prodata</option>
                    <option value="Rashodovano">🔴 Rashod</option>
                    <option value="all">Svi statusi</option>
                  </select>
                </th>

                {/* Reset akcija */}
                <th className="p-1.5 text-center">
                  <button
                    onClick={resetAllFilters}
                    title="Poništi sve kolonske filtere"
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

                  const displayType = cleanVehicleType(v.tipMehan);

                  return (
                    <tr
                      key={v.reg || idx}
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700/50 transition-colors"
                    >
                      <td className="p-3 text-center font-mono text-slate-400 text-xs">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {v.garazniBroj || "-"}
                      </td>
                      <td
                        onClick={() => onOpenVehicleModal(v.reg)}
                        className="p-3 font-black text-blue-700 dark:text-blue-400 cursor-pointer hover:underline"
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
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {displayType}
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
                      <td className="p-3 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
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
                              title="Uredi matične podatke ovog vozila"
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
                  <td colSpan={10} className="p-8 text-center text-slate-400 font-medium italic">
                    Nema pronađenih vozila za odabrane kolonske filtere.
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
              Prikazano: {visibleItems.length.toLocaleString("bs-BA")} od {filteredData.length.toLocaleString("bs-BA")} vozila
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
                    <span>Učitavam starija vozila...</span>
                  </>
                ) : (
                  <>
                    <ScrollDown className="w-3.5 h-3.5" />
                    <span>Učitaj još {BATCH_SIZE} vozila</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-extrabold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Sva vozila su uspješno učitana</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
