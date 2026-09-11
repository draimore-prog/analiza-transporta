"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { PlusCircle, Search, X, ChevronRight, Sun, Moon, Bell, ClipboardList, Plus, Menu } from "lucide-react";
import { normalizeVehicleStatus, getVehicleStatusBadge } from "@/lib/calculations.js";
import { APP_NAV_SECTIONS, canEditPage } from "@/lib/constants.js";

export function Header({
  activePage = "kpi-pregled",
  portalMode,
  setPortalMode,
  currentRole,
  masterFleet = [],
  isDarkMode,
  setIsDarkMode,
  onOpenVehicleModal,
  onOpenNewCostModal,
  onOpenNewVehicleModal,
  pendingWorkOrders = [],
  onOpenWorkOrder,
  onToggleMobileSidebar
}) {
  const [searchReg, setSearchReg] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef(null);
  const notifRef = useRef(null);
  const inputRef = useRef(null);

  // Informacije o trenutnoj kategoriji i stranici za breadcrumb
  const activePageInfo = useMemo(() => {
    for (const sec of APP_NAV_SECTIONS) {
      const item = sec.items.find((i) => i.id === activePage);
      if (item) {
        return {
          categoryTitle: sec.title,
          categoryIcon: sec.icon,
          title: item.name,
          icon: item.icon
        };
      }
    }
    return {
      categoryTitle: "Analitika",
      categoryIcon: "📊",
      title: "KPI Pregled Flote",
      icon: "📊"
    };
  }, [activePage]);

  // Filtriranje vozila za search dropdown
  const matchingVehicles = useMemo(() => {
    const term = searchReg.trim().toLowerCase();
    if (!term) {
      // Ako nema unosa a dropdown je otvoren, prikaži prvih 8 aktivnih vozila
      return masterFleet.filter((v) => normalizeVehicleStatus(v.status) === "Aktivno").slice(0, 8);
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
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotificationOpen(false);
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

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 z-30 flex-shrink-0 shadow-xs">
      <div className="flex items-center gap-2.5">
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="p-1.5 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl md:hidden cursor-pointer shrink-0"
            title="Otvori / Sakrij meni"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-base">{activePageInfo.categoryIcon}</span>
          <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
            {activePageInfo.categoryTitle}
          </span>
          <span className="text-slate-300 dark:text-slate-600 font-bold">/</span>
          <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>{activePageInfo.title}</span>
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
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
                    const statusBadge = getVehicleStatusBadge(v.status);

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
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${statusBadge.className}`}>
                            {statusBadge.status}
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

        {/* Novo Vozilo Dugme */}
        {canEditPage(currentRole, "maticna-baza-flote") && onOpenNewVehicleModal && (
          <button
            onClick={onOpenNewVehicleModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-3 py-1.5 rounded-lg transition-colors text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Unos novog vozila ili skladišne mehanizacije"
          >
            <Plus className="w-4 h-4" />
            <span>Novo vozilo</span>
          </button>
        )}

        {/* Unos troška Dugme */}
        {canEditPage(currentRole, "tabela-servisa") && (
          <button
            onClick={onOpenNewCostModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3 py-1.5 rounded-lg transition-colors text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Unos troška</span>
          </button>
        )}

        {/* Notification Bell (Radni nalozi sa terena) */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer relative"
            title="Pristigli radni nalozi sa terena"
          >
            <Bell className="w-4 h-4" />
            {pendingWorkOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center animate-bounce shadow-xs">
                {pendingWorkOrders.length}
              </span>
            )}
          </button>

          {/* Notifikacijski Dropdown */}
          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
              <div className="p-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-wider">Radni nalozi sa terena</span>
                </div>
                <span className="text-[10px] font-black bg-purple-600 text-white px-2 py-0.5 rounded-full">
                  {pendingWorkOrders.length} čekaju pregled
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {pendingWorkOrders.length > 0 ? (
                  pendingWorkOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => {
                        setIsNotificationOpen(false);
                        if (onOpenWorkOrder) onOpenWorkOrder(order);
                      }}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-mono text-xs font-black text-blue-700 dark:text-blue-400">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {order.createdAt ? new Date(order.createdAt).toLocaleTimeString("bs-BA", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {order.vehicleId} • {order.vehicleDetails?.proizvodjac || ""} {order.vehicleDetails?.model || ""}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        Serviser: <strong>{order.assignedTo}</strong> • {order.vehicleDetails?.lokacija || ""}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Nema naloga koji čekaju pregled voditelja.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle u Headeru */}
        {setIsDarkMode && (
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
            title={isDarkMode ? "Prebaci na svijetlu temu" : "Prebaci na tamnu temu"}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}
      </div>
    </header>
  );
}
