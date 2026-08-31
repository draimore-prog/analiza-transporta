"use client";

import React, { useState, useMemo } from "react";
import { CostItem } from "@/types/cost";
import { formatDate, formatKM } from "@/lib/calculations";
import { exportTransactionsToExcel } from "@/lib/exportExcel";
import { Download, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { UserAccount } from "@/types/auth";

interface WarehouseRepairsProps {
  warehouseCostData: CostItem[];
  onOpenVehicleModal: (reg: string) => void;
  onDeleteCostRecord?: (id: string) => void;
  activeUser: UserAccount | null;
}

export function WarehouseRepairs({
  warehouseCostData,
  onOpenVehicleModal,
  onDeleteCostRecord,
  activeUser
}: WarehouseRepairsProps) {
  const [selectedYear, setSelectedYear] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState("new-first");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // Available Years
  const availableYears = useMemo(() => {
    return Array.from(new Set(warehouseCostData.map((c) => c.year))).sort((a, b) => b - a);
  }, [warehouseCostData]);

  // Filter & Sort
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

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIdx = (safePage - 1) * itemsPerPage;
  const pageItems = filteredData.slice(startIdx, startIdx + itemsPerPage);

  const canDelete = activeUser && ["superadmin", "editor", "warehouse_specialist"].includes(activeUser.role);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* Header Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
              📋 Tabela servisa i opravki skladišne mehanizacije
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Prikazano ukupno {filteredData.length.toLocaleString("bs-BA")} servisa skladišne mehanizacije
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Year */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                Godina
              </label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500 bg-white dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200"
              >
                <option value="all">Sve godine</option>
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
                Sortiranje / Novi unosi
              </label>
              <select
                value={sortMode}
                onChange={(e) => {
                  setSortMode(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500 bg-white dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200"
              >
                <option value="new-first">🆕 Novi unosi na vrhu + Datum (Najnovije)</option>
                <option value="date-desc">📅 Datum (Najnovije prvo)</option>
                <option value="date-asc">📅 Datum (Najstarije prvo)</option>
                <option value="cost-desc">💰 Trošak (Najveći prvo)</option>
                <option value="cost-asc">💰 Trošak (Najmanji prvo)</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                Pretraga
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="🔍 Pretraži reg, opis ili servisera..."
                className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 w-full sm:w-56 focus:ring-2 focus:ring-amber-500 font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Excel Export */}
            <div className="flex items-end">
              <button
                onClick={() => exportTransactionsToExcel(filteredData, "Skladisna_Mehanizacija_Opravke.xlsx")}
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold px-3 py-1.5 rounded-lg text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer mt-3 sm:mt-0"
              >
                <Download className="w-3.5 h-3.5" /> Izvezi Excel
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto max-h-[550px] border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 z-10">
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
              {pageItems.length > 0 ? (
                pageItems.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    className={`hover:bg-amber-50/60 dark:hover:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 transition-colors ${
                      item.isNewCustom ? "bg-emerald-50/30 dark:bg-emerald-950/20 font-medium" : ""
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
                            onClick={() => onDeleteCostRecord(item.id!)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded font-bold text-xs transition-all cursor-pointer"
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
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between mt-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={safePage <= 1}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Prethodna
          </button>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
            Stranica {safePage} od {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={safePage >= totalPages}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
          >
            Sljedeća <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
