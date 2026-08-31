"use client";

import React, { useState } from "react";
import { Search, PlusCircle, Truck, Boxes, Plus } from "lucide-react";
import { AppRole } from "@/types/roles";

interface HeaderProps {
  portalMode: "transport" | "warehouse";
  setPortalMode: (mode: "transport" | "warehouse") => void;
  currentRole: AppRole;
  onOpenVehicleModal: (reg: string) => void;
  onOpenNewCostModal: () => void;
  onOpenNewVehicleModal: () => void;
}

export function Header({
  portalMode,
  setPortalMode,
  currentRole,
  onOpenVehicleModal,
  onOpenNewCostModal,
  onOpenNewVehicleModal
}: HeaderProps) {
  const [searchInput, setSearchInput] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onOpenVehicleModal(searchInput.trim().toUpperCase());
      setSearchInput("");
    }
  };

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 lg:px-8 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-3 sticky top-0 z-30 shadow-xs">
      {/* Quick Search */}
      <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="🔍 Pretraži reg. oznaku ili garažni broj..."
          className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
      </form>

      {/* Actions & Portal Switcher */}
      <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
        {/* Portal Switcher */}
        {currentRole?.permissions?.canSwitchPortal && (
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              onClick={() => setPortalMode("transport")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                portalMode === "transport"
                  ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Truck className="w-3.5 h-3.5" /> Transport
            </button>
            <button
              onClick={() => setPortalMode("warehouse")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                portalMode === "warehouse"
                  ? "bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Boxes className="w-3.5 h-3.5" /> Skladišna
            </button>
          </div>
        )}

        {/* New Vehicle Button */}
        {currentRole?.permissions?.canRegisterVehicle && (
          <button
            onClick={onOpenNewVehicleModal}
            className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Nabavka Vozila
          </button>
        )}

        {/* New Cost Entry Button */}
        {currentRole?.permissions?.canInputCost && (
          <button
            onClick={onOpenNewCostModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Unos Troška
          </button>
        )}
      </div>
    </header>
  );
}
