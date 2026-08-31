"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { PlusCircle, Search, ExternalLink, Sparkles, X, ChevronRight } from "lucide-react";

export function Header({
  portalMode,
  setPortalMode,
  currentRole,
  masterFleet = [],
  onOpenVehicleModal,
  onOpenNewCostModal,
  onOpenNewVehicleModal
}) {
  const [searchReg, setSearchReg] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Filtriranje vozila za search dropdown
  const matchingVehicles = useMemo(() => {
    const term = searchReg.trim().toLowerCase();
    if (!term) {
      // Ako nema unosa a dropdown je otvoren, prikaži prvih 8 aktivnih vozila
      return masterFleet.filter((v) => (v.status || "Aktivno") === "Aktivno").slice(0, 8);
    }

    return masterFleet
      .filter((v) => {
        const reg = (v.reg || "").toLowerCase();
        const gb = (v.garazniBroj || "").toLowerCase();
        const marka = (v.markaVoz || "").toLowerCase();
        const model = (v.modelVoz || "").toLowerCase();
        const sasija = (v.brojSasije || "").toLowerCase();
        const tip = (v.tipMehan || "").toLowerCase();

        return (
          reg.includes(term) ||
          gb.includes(term) ||
          marka.includes(term) ||
          model.includes(term) ||
          sasija.includes(term) ||
          tip.includes(term)
        );
      })
      .slice(0, 10);
  }, [masterFleet, searchReg]);

  // Reset indeksa selekcije kad se promijene rezultati
  useEffect(() => {
    setSelectedIndex(0);
  }, [matchingVehicles]);

  // Zatvaranje dropdowna na klik izvan komponente
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectVehicle = (vehicle) => {
    if (!vehicle || !vehicle.reg) return;
    onOpenVehicleModal(vehicle.reg);
    setSearchReg("");
    setIsDropdownOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isDropdownOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsDropdownOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < matchingVehicles.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : matchingVehicles.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (matchingVehicles[selectedIndex]) {
        handleSelectVehicle(matchingVehicles[selectedIndex]);
      } else if (searchReg.trim()) {
        onOpenVehicleModal(searchReg.trim().toUpperCase());
        setSearchReg("");
        setIsDropdownOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  const getVehicleIcon = (tip) => {
    const t = (tip || "").toLowerCase();
    if (t.includes("teretn")) return "🚛";
    if (t.includes("putničk") || t.includes("putnick")) return "🚗";
    if (t.includes("priključn") || t.includes("prikljucn")) return "🚚";
    if (t.includes("radn")) return "🏗️";
    if (t.includes("skladi") || t.includes("viljuš")) return "🚜";
    return "🚗";
  };

  const handleOpenV1 = () => {
    window.location.href = "/v1.html";
  };

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 z-30 flex-shrink-0 shadow-xs">
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

        {/* BRZA PRETRAGA KARTONA SA DROPDOWN PREGLEDOM */}
        <div ref={containerRef} className="relative w-full sm:w-72">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchReg}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                setSearchReg(e.target.value);
                setIsDropdownOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="🔍 Otvori karton vozila (Reg, GB)..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-8 pr-7 py-1.5 text-xs font-bold text-slate-800 dark:text-white uppercase outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            {searchReg && (
              <button
                type="button"
                onClick={() => {
                  setSearchReg("");
                  inputRef.current?.focus();
                }}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* INTERAKTIVNI DROPDOWN MENI ZA IZBOR VOZILA */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[360px] overflow-y-auto">
              <div className="p-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <span>{searchReg ? `Pronađeno: ${matchingVehicles.length}` : "Preporučena / Aktivna vozila"}</span>
                <span>ESC za izlaz</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {matchingVehicles.length > 0 ? (
                  matchingVehicles.map((v, index) => {
                    const isSelected = index === selectedIndex;
                    const st = v.status || "Aktivno";
                    let stBadge = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
                    if (st === "Prodato") stBadge = "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300";
                    else if (st === "Rashodovano") stBadge = "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-300";

                    return (
                      <div
                        key={v.reg || index}
                        onMouseEnter={() => setSelectedIndex(index)}
                        onClick={() => handleSelectVehicle(v)}
                        className={`p-2.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base flex-shrink-0 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            {getVehicleIcon(v.tipMehan)}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-xs text-blue-700 dark:text-blue-400">
                                {v.reg}
                              </span>
                              {v.garazniBroj && v.garazniBroj !== "-" && (
                                <span className="text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded text-slate-700 dark:text-slate-300">
                                  GB: {v.garazniBroj}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {v.markaVoz && v.markaVoz !== "-" ? v.markaVoz : ""} {v.modelVoz && v.modelVoz !== "-" ? v.modelVoz : ""} • {v.tipMehan || "Vozilo"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${stBadge}`}>
                            {st}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 italic">
                    Nema pronađenog vozila za &ldquo;{searchReg}&rdquo;
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
