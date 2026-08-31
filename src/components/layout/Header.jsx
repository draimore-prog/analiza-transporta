"use client";

import React, { useState } from "react";
import { PlusCircle, Search, ExternalLink, Sparkles } from "lucide-react";

export function Header({
  portalMode,
  setPortalMode,
  currentRole,
  onOpenVehicleModal,
  onOpenNewCostModal,
  onOpenNewVehicleModal
}) {
  const [searchReg, setSearchReg] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchReg.trim()) {
      onOpenVehicleModal(searchReg.trim().toUpperCase());
      setSearchReg("");
    }
  };

  const handleOpenV1 = () => {
    window.location.href = "/v1.html";
  };

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 z-10 flex-shrink-0 shadow-xs">
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {portalMode === "transport"
            ? "KPI Total Struktura (938 aktivnih vozila u 2026.)"
            : "Skladišna Mehanizacija (594 aktivne jedinice u 2026.)"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
        {/* DUGME ZA KLASIČNI V1 PREGLED */}
        <button
          onClick={handleOpenV1}
          title="Otvara originalni, neizmijenjeni V1 HTML pregled sa kompletnom bazom"
          className="bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold px-3 py-1.5 rounded-lg transition-all text-xs flex items-center gap-1.5 shadow-xs border border-indigo-600 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>🏛️ V1 Originalni Pregled</span>
          <ExternalLink className="w-3 h-3 opacity-70" />
        </button>

        {/* Brza Pretraga Kartona */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-56">
          <input
            type="text"
            value={searchReg}
            onChange={(e) => setSearchReg(e.target.value)}
            placeholder="🔍 Otvori karton (npr. A12-K-345)..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg pl-8 pr-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white uppercase outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </form>

        {/* Portal Switcher */}
        {currentRole?.permissions?.canSwitchPortal && (
          <button
            onClick={() => setPortalMode(portalMode === "transport" ? "warehouse" : "transport")}
            className={`font-extrabold px-3 py-1.5 rounded-lg transition-all text-xs flex items-center gap-1.5 shadow-xs border cursor-pointer ${
              portalMode === "transport"
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-600"
                : "bg-blue-600 hover:bg-blue-500 text-white border-blue-700"
            }`}
          >
            <span>{portalMode === "transport" ? "🏗️" : "🚛"}</span>
            <span>{portalMode === "transport" ? "Skladišna Mehanizacija" : "Glavni Transport"}</span>
          </button>
        )}

        {/* Unos Troška Dugme */}
        {currentRole?.permissions?.canInputCost && (
          <button
            onClick={onOpenNewCostModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3 py-1.5 rounded-lg transition-colors text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Unos Troška</span>
          </button>
        )}
      </div>
    </header>
  );
}
