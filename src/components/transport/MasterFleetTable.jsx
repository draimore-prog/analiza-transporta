"use client";

import React, { useState, useMemo } from "react";
import { exportMasterFleetToExcel } from "@/lib/exportExcel.js";
import { Download, Plus, RotateCcw, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export function MasterFleetTable({
  masterFleet,
  onOpenVehicleModal,
  onOpenNewVehicleModal,
  currentRole
}) {
  const [statusFilter, setStatusFilter] = useState("Aktivno");
  const [typeFilter, setTypeFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortCol, setSortCol] = useState("reg");
  const [sortDir, setSortDir] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Unikatni tipovi i marke
  const distinctTypes = useMemo(() => {
    return Array.from(new Set(masterFleet.map((v) => v.tipMehan))).filter(Boolean).sort();
  }, [masterFleet]);

  const distinctBrands = useMemo(() => {
    return Array.from(new Set(masterFleet.map((v) => v.markaVoz))).filter(Boolean).sort();
  }, [masterFleet]);

  // Filtrirani i sortirani podaci
  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = masterFleet.filter((v) => {
      const vStatus = v.status || "Aktivno";
      const matchStatus =
        statusFilter === "all" ||
        vStatus.toLowerCase() === statusFilter.toLowerCase() ||
        (statusFilter === "Aktivno" && !vStatus.toLowerCase().includes("prodat") && !vStatus.toLowerCase().includes("rashod"));

      const matchType = typeFilter === "all" || v.tipMehan === typeFilter;
      const matchBrand = brandFilter === "all" || v.markaVoz === brandFilter;

      const matchSearch =
        !term ||
        (v.reg && v.reg.toLowerCase().includes(term)) ||
        (v.garazniBroj && v.garazniBroj.toLowerCase().includes(term)) ||
        (v.markaVoz && v.markaVoz.toLowerCase().includes(term)) ||
        (v.modelVoz && v.modelVoz.toLowerCase().includes(term)) ||
        (v.brojSasije && v.brojSasije.toLowerCase().includes(term));

      return matchStatus && matchType && matchBrand && matchSearch;
    });

    if (sortCol) {
      filtered.sort((a, b) => {
        const valA = (a[sortCol] || "").toString().toLowerCase();
        const valB = (b[sortCol] || "").toString().toLowerCase();
        return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    }

    return filtered;
  }, [masterFleet, statusFilter, typeFilter, brandFilter, searchTerm, sortCol, sortDir]);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const resetFilters = () => {
    setStatusFilter("Aktivno");
    setTypeFilter("all");
    setBrandFilter("all");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIdx = (safePage - 1) * itemsPerPage;
  const pageItems = filteredData.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header Kartica */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <span>🏢 Matična baza podataka voznog parka</span>
              <span className="text-xs bg-indigo-500/30 text-indigo-200 border border-indigo-400 px-3 py-0.5 rounded-full font-mono font-bold">
                {masterFleet.length.toLocaleString("bs-BA")} vozila
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Konsolidovani matični podaci svih aktivnih (938), prodatih (256) i rashodovanih (42) jedinica
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {currentRole?.permissions?.canRegisterVehicle && (
              <button
                onClick={onOpenNewVehicleModal}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Dodaj Novo Vozilo
              </button>
            )}
            <button
              onClick={resetFilters}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl border border-white/30 shadow-xs transition-all text-xs flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Resetuj filtere
            </button>
            <button
              onClick={() => exportMasterFleetToExcel(filteredData)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all text-xs flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Izvezi Šifrarnik (Excel)
            </button>
          </div>
        </div>

        {/* Filter Kontrole Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Status Vozila
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-lg p-2 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Aktivno">🟢 Aktivna Vozila (938)</option>
              <option value="Prodato">🟣 Prodata Vozila (256)</option>
              <option value="Rashodovano">🔴 Rashodovana Vozila (42)</option>
              <option value="all">Svi statusi (1.236)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Tip Vozila
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-lg p-2 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Svi tipovi vozila</option>
              {distinctTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Marka / Proizvođač
            </label>
            <select
              value={brandFilter}
              onChange={(e) => {
                setBrandFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-lg p-2 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Sve marke</option>
              {distinctBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Brza Pretraga
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="🔍 Reg, garažni, šasija..."
              className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-lg p-2 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
              <tr>
                <th className="p-3 text-center">R.b.</th>
                <th
                  onClick={() => handleSort("garazniBroj")}
                  className="p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-1">
                    <span>Garažni Br.</span>
                    {sortCol === "garazniBroj" ? (
                      sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("reg")}
                  className="p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-1">
                    <span>Reg. Oznaka</span>
                    {sortCol === "reg" ? (
                      sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th className="p-3">Tip Mehanizacije</th>
                <th
                  onClick={() => handleSort("markaVoz")}
                  className="p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-1">
                    <span>Marka</span>
                    {sortCol === "markaVoz" ? (
                      sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th className="p-3">Model</th>
                <th className="p-3">Godište</th>
                <th className="p-3">Broj Šasije</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Karton</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {pageItems.length > 0 ? (
                pageItems.map((v, idx) => {
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
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700/50 transition-colors"
                    >
                      <td className="p-3 text-center font-mono text-slate-400 text-xs">
                        {startIdx + idx + 1}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {v.garazniBroj || "-"}
                      </td>
                      <td
                        onClick={() => onOpenVehicleModal(v.reg)}
                        className="p-3 font-black text-blue-700 dark:text-blue-400 cursor-pointer hover:underline"
                      >
                        {v.reg}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {v.tipMehan}
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
                        <button
                          onClick={() => onOpenVehicleModal(v.reg)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-bold px-2.5 py-1 rounded-lg text-xs transition-colors border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                        >
                          📋 Karton
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 font-medium italic">
                    Nema pronađenih vozila za odabrane filtere.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginacija */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">
            Prikazano {pageItems.length > 0 ? startIdx + 1 : 0} - {Math.min(startIdx + itemsPerPage, filteredData.length)} od {filteredData.length} vozila (Stranica {safePage} od {totalPages})
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={safePage <= 1}
              className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-bold hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prethodna
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={safePage >= totalPages}
              className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-bold hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              Sljedeća <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
