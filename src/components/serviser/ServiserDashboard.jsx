"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Wrench,
  Search,
  Truck,
  LogOut,
  ChevronRight,
  History,
  ShieldCheck,
  Building2,
  Clock,
  ArrowRight
} from "lucide-react";

export function ServiserDashboard({
  masterFleet = [],
  costData = [],
  activeUser,
  onOpenVehicleModal,
  onLogout,
  onSwitchPortal
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentVehicles, setRecentVehicles] = useState([]);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Učitaj nedavna vozila iz sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("serviser_recent_searches");
      if (saved) {
        setRecentVehicles(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const saveToRecent = (reg) => {
    try {
      const updated = [reg, ...recentVehicles.filter((r) => r !== reg)].slice(0, 5);
      setRecentVehicles(updated);
      sessionStorage.setItem("serviser_recent_searches", JSON.stringify(updated));
    } catch (e) {}
  };

  // Zatvaranje dropdowna na klik van komponente
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtriranje vozila po reg, garaznom broju, marki, modelu, sasiji
  const filteredVehicles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return masterFleet.filter((v) => (v.status || "Aktivno") === "Aktivno").slice(0, 10);
    }

    return masterFleet
      .filter((v) => {
        const reg = (v.reg || "").toLowerCase();
        const gb = (v.garazniBroj || "").toString().toLowerCase();
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
      .slice(0, 15);
  }, [masterFleet, searchTerm]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredVehicles]);

  const handleSelectVehicle = (vehicle) => {
    if (!vehicle || !vehicle.reg) return;
    saveToRecent(vehicle.reg);
    onOpenVehicleModal(vehicle.reg);
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const clean = searchTerm.trim();
    if (!clean) return;

    if (filteredVehicles.length > 0) {
      handleSelectVehicle(filteredVehicles[selectedIndex] || filteredVehicles[0]);
    } else {
      saveToRecent(clean.toUpperCase());
      onOpenVehicleModal(clean.toUpperCase());
      setSearchTerm("");
      setIsDropdownOpen(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!isDropdownOpen) {
      if (e.key === "ArrowDown") setIsDropdownOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredVehicles.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredVehicles.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 flex flex-col justify-between overflow-y-auto">
      {/* Gornja traka */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-700 to-blue-600 text-white p-2.5 rounded-2xl shadow-sm flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Servisna Radionica
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              Karton Vozila & Servisna Historija Održavanja
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onSwitchPortal && (
            <button
              onClick={onSwitchPortal}
              className="text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              <span>Glavni Transport</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-extrabold text-slate-800 dark:text-slate-200">
              {activeUser?.fullname || activeUser?.username || "Serviser"}
            </span>
            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-mono font-bold">
              🔧 Serviser
            </span>
          </div>

          <button
            onClick={onLogout}
            className="text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border border-red-200 dark:border-red-900/60 cursor-pointer"
            title="Odjava sa sistema"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Odjava</span>
          </button>
        </div>
      </header>

      {/* Glavni sadržaj: Centrirana kartica za pretragu */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full">
        <div className="w-full bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden">
          {/* Pozadinski sjaj */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex bg-gradient-to-tr from-indigo-100 to-blue-100 dark:from-indigo-950 dark:to-blue-950 text-indigo-700 dark:text-indigo-300 p-5 rounded-3xl mb-6 shadow-inner border border-indigo-200/50 dark:border-indigo-800/50">
            <Wrench className="w-12 h-12" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Servisna Radionica & Kartoteka
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-lg mx-auto font-medium">
            Unesite registraciju, garažni broj ili broj šasije za trenutni uvid u historiju popravki, zamijenjene dijelove i karton vozila
          </p>

          {/* Forma i Autocomplete Pretraga */}
          <div ref={containerRef} className="relative max-w-2xl mx-auto mb-6">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Npr. J41-M-123 ili GB: 123..."
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-300 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-base sm:text-lg font-bold text-slate-900 dark:text-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/20 outline-none uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 transition-all shadow-inner"
                />
                <Search className="w-6 h-6 text-slate-400 absolute left-4 top-4.5 pointer-events-none" />
              </div>

              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white px-8 py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-600/30 cursor-pointer shrink-0"
              >
                <span>🔍 Pretraži</span>
              </button>
            </form>

            {/* Dropdown sa rezultatima */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-left animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex justify-between items-center">
                  <span>Pronađena vozila ({filteredVehicles.length})</span>
                  <span className="font-mono">Tipka Enter za otvaranje</span>
                </div>

                {filteredVehicles.length > 0 ? (
                  filteredVehicles.map((v, idx) => {
                    const isSelected = idx === selectedIndex;
                    const st = v.status || "Aktivno";
                    const isAct = st.toLowerCase() === "aktivno";

                    return (
                      <div
                        key={v.reg || idx}
                        onClick={() => handleSelectVehicle(v)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-white"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl text-lg ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
                            🚛
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-slate-900 dark:text-white">
                                {v.reg}
                              </span>
                              {v.garazniBroj && (
                                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-full font-mono font-bold">
                                  GB: {v.garazniBroj}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {v.markaVoz || ""} {v.modelVoz || ""} • {v.tipMehan || "Vozilo"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                              isAct
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600"
                            }`}
                          >
                            {st}
                          </span>
                          <ArrowRight className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-slate-300"}`} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 italic">
                    Nema pronađenih vozila za unos &ldquo;{searchTerm}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Brzi pregled nedavnih pretraga */}
          {recentVehicles.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Nedavno pregledano:
              </span>
              {recentVehicles.map((r) => (
                <button
                  key={r}
                  onClick={() => onOpenVehicleModal(r)}
                  className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-slate-700 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-indigo-300 rounded-lg font-bold font-mono transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info kartice za radionicu na dnu */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Ukupno Mehanizacije</p>
              <p className="text-base font-black text-slate-800 dark:text-white">{masterFleet.length} jedinica</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Režim Radionice</p>
              <p className="text-base font-black text-emerald-600 dark:text-emerald-400">Tehnički Pregled</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Evidentirani Servisi</p>
              <p className="text-base font-black text-slate-800 dark:text-white">{costData.length.toLocaleString("bs-BA")} naloga</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-slate-400 dark:text-slate-500 text-[11px] font-medium border-t border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50">
        Bingo d.o.o. Tuzla • Transport & Održavanje Voznog Parka • Servisni Portal Mehaničara
      </footer>
    </div>
  );
}
