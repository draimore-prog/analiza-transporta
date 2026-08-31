"use client";

import React, { useMemo } from "react";
import { formatDate, formatKM } from "@/lib/calculations.js";
import { X, Printer, Wrench } from "lucide-react";

export function VehicleCardModal({
  isOpen,
  onClose,
  reg,
  masterFleet,
  costData
}) {
  if (!isOpen || !reg) return null;

  const vehicleInfo = useMemo(() => {
    return masterFleet.find((v) => v.reg.toUpperCase() === reg.toUpperCase()) || {
      reg: reg,
      garazniBroj: "-",
      tipMehan: "Teretno / Skladišno",
      markaVoz: "-",
      modelVoz: "-",
      godProizvodnje: "-",
      brojSasije: "-",
      status: "Aktivno"
    };
  }, [masterFleet, reg]);

  // Sva historija servisa za ovo vozilo
  const history = useMemo(() => {
    return costData
      .filter((c) => (c.reg || "").trim().toUpperCase() === reg.toUpperCase())
      .sort((a, b) => (b.datumObj?.getTime() || 0) - (a.datumObj?.getTime() || 0));
  }, [costData, reg]);

  // Ukupan trošak za čitav vijek trajanja
  const totalCost = useMemo(() => {
    return history.reduce((acc, c) => acc + (c.cost || 0), 0);
  }, [history]);

  // Pregled po godinama
  const yearlyStats = useMemo(() => {
    const map = new Map();
    history.forEach((c) => {
      map.set(c.year, (map.get(c.year) || 0) + (c.cost || 0));
    });
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [history]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 flex justify-center items-center z-[70] backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-white/10 rounded-2xl border border-white/20 text-2xl">
                🚛
              </span>
              <div>
                <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                  <span>{vehicleInfo.reg}</span>
                  <span className="text-xs bg-indigo-500/40 text-indigo-200 border border-indigo-400/50 px-2.5 py-0.5 rounded-full font-mono">
                    GB: {vehicleInfo.garazniBroj || "-"}
                  </span>
                  <span className="text-xs bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 px-2.5 py-0.5 rounded-full font-bold">
                    {vehicleInfo.status || "Aktivno"}
                  </span>
                </h3>
                <p className="text-xs text-indigo-200 mt-1">
                  {vehicleInfo.markaVoz} {vehicleInfo.modelVoz} • {vehicleInfo.tipMehan} • Godište: {vehicleInfo.godProizvodnje}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
              title="Štampaj karton"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sadržaj */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50 dark:bg-slate-900/50 text-xs">
          {/* Statistika */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Ukupno Uloženo u Održavanje</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {formatKM(totalCost)}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Broj Evidentiranih Servisa</span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5 block">
                {history.length.toLocaleString("bs-BA")} naloga
              </span>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Broj Šasije (VIN)</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 block truncate">
                {vehicleInfo.brojSasije || "-"}
              </span>
            </div>
          </div>

          {/* Trošak po godinama */}
          {yearlyStats.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Utrošak po Godinama:</span>
              <div className="flex flex-wrap gap-2">
                {yearlyStats.map(([y, cost]) => (
                  <div key={y} className="bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-600 dark:text-slate-400 mr-1.5">{y}:</span>
                    <strong className="text-slate-900 dark:text-white">{formatKM(cost)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabela historije servisa */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <div className="p-3.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-blue-600" /> Hronološki Pregled Svih Servisa & Računa
              </h4>
              <span className="text-[10px] font-bold text-slate-500">
                {history.length} stavki
              </span>
            </div>

            <div className="overflow-x-auto max-h-[350px]">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0">
                  <tr>
                    <th className="p-2.5">Datum</th>
                    <th className="p-2.5">Segment</th>
                    <th className="p-2.5">Opis Radova / Dijelovi</th>
                    <th className="p-2.5">Serviser</th>
                    <th className="p-2.5 text-right">Iznos (KM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {history.length > 0 ? (
                    history.map((c, idx) => (
                      <tr key={c.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-2.5 font-medium whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {formatDate(c.datumObj || c.datum)}
                        </td>
                        <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                          {c.segment || "-"}
                        </td>
                        <td className="p-2.5 text-slate-900 dark:text-white font-medium break-words max-w-[280px]">
                          {c.opisPopravke || c.opisRadova || c.opis || "-"}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400 truncate max-w-[140px]" title={c.dobavljacOrig || c.dobavljac}>
                          {c.dobavljacOrig || c.dobavljac || "-"}
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {formatKM(c.cost || 0)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                        Nema zabilježenih servisa za ovo vozilo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
