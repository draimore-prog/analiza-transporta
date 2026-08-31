"use client";

import React, { useState, useMemo } from "react";
import { formatDate, formatKM } from "@/lib/calculations.js";
import { exportTransactionsToExcel } from "@/lib/exportExcel.js";
import { X, Download, Building2, Search, ChevronLeft, ChevronRight } from "lucide-react";

export function SupplierDetailModal({
  isOpen,
  onClose,
  supplierName,
  costData,
  onOpenVehicleModal
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedSegment, setSelectedSegment] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Sve transakcije za ovog dobavljača
  const supplierTransactions = useMemo(() => {
    if (!supplierName) return [];
    const supNorm = supplierName.trim().toLowerCase();
    return costData.filter((c) => {
      const s = (c.dobavljacOrig || c.dobavljac || "").trim().toLowerCase();
      return s === supNorm || s.includes(supNorm);
    });
  }, [costData, supplierName]);

  const totalCost = useMemo(() => {
    return supplierTransactions.reduce((acc, c) => acc + (c.cost || 0), 0);
  }, [supplierTransactions]);

  const distinctVehicles = useMemo(() => {
    return new Set(supplierTransactions.map((c) => c.reg).filter((r) => r && r !== "-")).size;
  }, [supplierTransactions]);

  const avgPerIntervention =
    supplierTransactions.length > 0 ? totalCost / supplierTransactions.length : 0;

  // Unikatni segmenti
  const distinctSegments = useMemo(() => {
    return Array.from(new Set(supplierTransactions.map((c) => c.segment).filter(Boolean))).sort();
  }, [supplierTransactions]);

  // Godišnji zbir
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

  // Filtrirane transakcije
  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return supplierTransactions.filter((c) => {
      const matchYear = selectedYear === "all" || c.year === parseInt(selectedYear);
      const matchSegment = selectedSegment === "all" || c.segment === selectedSegment;
      const matchTerm =
        !term ||
        (c.reg && c.reg.toLowerCase().includes(term)) ||
        (c.garazniBroj && c.garazniBroj.toLowerCase().includes(term)) ||
        (c.opisPopravke && c.opisPopravke.toLowerCase().includes(term));

      return matchYear && matchSegment && matchTerm;
    });
  }, [supplierTransactions, selectedYear, selectedSegment, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIdx = (safePage - 1) * itemsPerPage;
  const pageItems = filteredData.slice(startIdx, startIdx + itemsPerPage);

  if (!isOpen || !supplierName) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 bg-slate-900/80 flex justify-center items-center z-[75] backdrop-blur-xs p-3 sm:p-5 animate-in fade-in zoom-in-95 duration-200 cursor-pointer">
      <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 cursor-default">
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md text-2xl">
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight truncate max-w-md">
                  Dobavljač / Serviser: {supplierName}
                </h2>
                <span className="bg-indigo-500/30 border border-indigo-400 text-indigo-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  Partner
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Detaljna lista faktura, popravki i intervencija po vozilima
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
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50 dark:bg-slate-900/50 text-xs flex-1">
          {/* Top 4 Summary Kartice */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Ukupan Trošak</span>
              <h3 className="text-lg font-black text-indigo-900 dark:text-indigo-300 mt-1">
                {formatKM(totalCost)}
              </h3>
            </div>
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Broj Faktura / Naloga</span>
              <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {supplierTransactions.length.toLocaleString("bs-BA")}
              </h3>
            </div>
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Servisiranih Vozila</span>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">
                {distinctVehicles.toLocaleString("bs-BA")} jedinica
              </h3>
            </div>
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Prosjek po Intervenciji</span>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">
                {formatKM(avgPerIntervention)}
              </h3>
            </div>
          </div>

          {/* Godišnji Prikaz (2021-2026) */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-2">
              Utrošak po Godinama kod ovog partnera:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {[2021, 2022, 2023, 2024, 2025, 2026].map((y) => (
                <div
                  key={y}
                  onClick={() => {
                    setSelectedYear(selectedYear === y.toString() ? "all" : y.toString());
                    setCurrentPage(1);
                  }}
                  className={`p-2.5 rounded-lg border text-center cursor-pointer transition-all ${
                    selectedYear === y.toString()
                      ? "bg-indigo-600 text-white border-indigo-700 font-bold"
                      : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                  }`}
                >
                  <span className="text-[10px] block opacity-80">{y}. god</span>
                  <strong className="text-xs block mt-0.5">{formatKM(yearlyBreakdown[y]?.cost || 0)}</strong>
                  <span className="text-[9px] opacity-70">{yearlyBreakdown[y]?.count || 0} servisa</span>
                </div>
              ))}
            </div>
          </div>

          {/* Filter Traka */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 font-bold text-xs outline-none"
              >
                <option value="all">Sve godine</option>
                {[2026, 2025, 2024, 2023, 2022, 2021].map((y) => (
                  <option key={y} value={y.toString()}>
                    {y}. godina
                  </option>
                ))}
              </select>

              <select
                value={selectedSegment}
                onChange={(e) => {
                  setSelectedSegment(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 font-bold text-xs outline-none"
              >
                <option value="all">Svi segmenti</option>
                {distinctSegments.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <div className="relative flex-1 sm:w-56">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="🔍 Pretraži reg, opis..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg pl-8 pr-3 py-1.5 font-medium text-xs outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <button
              onClick={() => exportTransactionsToExcel(filteredData, `Dobavljac_${supplierName}.xlsx`)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Izvezi Excel
            </button>
          </div>

          {/* Tabela */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <div className="overflow-x-auto max-h-[350px]">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0">
                  <tr>
                    <th className="p-2.5">Datum</th>
                    <th className="p-2.5">Registracija</th>
                    <th className="p-2.5">Garažni Br.</th>
                    <th className="p-2.5">Segment</th>
                    <th className="p-2.5">Tip Mehanizacije</th>
                    <th className="p-2.5">Opis Popravke / Radovi</th>
                    <th className="p-2.5 text-right">Trošak (KM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {pageItems.length > 0 ? (
                    pageItems.map((c, idx) => (
                      <tr
                        key={c.id || idx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
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
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                        Nema pronađenih računa/servisa za ovog partnera i odabrane filtere.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginacija */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">
                Prikazano {pageItems.length > 0 ? startIdx + 1 : 0} -{" "}
                {Math.min(startIdx + itemsPerPage, filteredData.length)} od {filteredData.length} servisa
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={safePage <= 1}
                  className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-bold hover:bg-slate-100 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prethodna
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={safePage >= totalPages}
                  className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-bold hover:bg-slate-100 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  Sljedeća <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
