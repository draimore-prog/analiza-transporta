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
  ArrowRight,
  ClipboardList,
  Smartphone,
  PlusCircle,
  Camera,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Calendar,
  MapPin,
  Check,
  RotateCcw
} from "lucide-react";
import { WORK_ORDER_STATUSES } from "@/hooks/useWarehouseWorkOrders.js";

export function ServiserDashboard({
  masterFleet = [],
  costData = [],
  warehouseMasterFleet = [],
  warehouseCostData = [],
  workOrders = [],
  activeUser,
  onOpenVehicleModal,
  onOpenFieldForm,
  onViewWorkOrder,
  onPrintWorkOrder,
  onLogout,
  onSwitchPortal
}) {
  // Aktivni tab: "work_orders" (zadaci i pregledi mehanizacije) ili "search" (kartoteka vozila)
  const [activeTab, setActiveTab] = useState("work_orders");
  const [ordersSubFilter, setOrdersSubFilter] = useState("pending"); // "pending" | "completed" | "all"

  // Stanje pretrage za kartoteku
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

  // Kombinovana flota za pretragu (skladišna mehanizacija + transportna vozila)
  const combinedFleet = useMemo(() => {
    const whMapped = warehouseMasterFleet.map((v) => ({
      ...v,
      source: "warehouse",
      tipMehan: v.tipMehan || "Skladišni viljuškar"
    }));
    const trMapped = masterFleet.map((v) => ({
      ...v,
      source: "transport",
      tipMehan: v.tipMehan || "Motorno vozilo"
    }));
    return [...whMapped, ...trMapped];
  }, [warehouseMasterFleet, masterFleet]);

  // Filtriranje vozila po reg, garaznom broju, marki, modelu, sasiji
  const filteredVehicles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return combinedFleet.slice(0, 10);
    }

    return combinedFleet
      .filter((v) => {
        const reg = (v.reg || "").toLowerCase();
        const gb = (v.garazniBroj || "").toString().toLowerCase();
        const marka = (v.markaVoz || "").toLowerCase();
        const model = (v.modelVoz || "").toLowerCase();
        const sasija = (v.brojSasije || "").toLowerCase();
        const tip = (v.tipMehan || "").toLowerCase();
        const pj = (v.poslovnaJedinica || "").toLowerCase();

        return (
          reg.includes(term) ||
          gb.includes(term) ||
          marka.includes(term) ||
          model.includes(term) ||
          sasija.includes(term) ||
          tip.includes(term) ||
          pj.includes(term)
        );
      })
      .slice(0, 15);
  }, [combinedFleet, searchTerm]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredVehicles]);

  const handleSelectVehicle = (vehicle) => {
    if (!vehicle || !vehicle.reg) return;
    saveToRecent(vehicle.reg);
    if (onOpenVehicleModal) onOpenVehicleModal(vehicle.reg);
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
      if (onOpenVehicleModal) onOpenVehicleModal(clean.toUpperCase());
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

  const getVehicleIcon = (tip) => {
    const t = (tip || "").toLowerCase();
    if (t.includes("skladi") || t.includes("viljuš") || t.includes("viljusk") || t.includes("etv") || t.includes("regal")) return "🚜";
    if (t.includes("teretn") || t.includes("kamion") || t.includes("tegljač")) return "🚛";
    if (t.includes("putničk") || t.includes("putnick")) return "🚗";
    if (t.includes("priključn") || t.includes("prikljucn")) return "🚚";
    return "🔧";
  };

  // Filtrirani nalozi za servisera
  const serviserOrders = useMemo(() => {
    const userName = (activeUser?.fullname || activeUser?.username || "").toLowerCase();

    return workOrders.filter((o) => {
      // Filter po potkategoriji
      if (ordersSubFilter === "pending") {
        if (o.status !== "pending" && o.status !== "in_progress") return false;
      } else if (ordersSubFilter === "completed") {
        if (o.status !== "completed" && o.status !== "approved") return false;
      }

      // Ako je serviser zadužen ili je nalog otvoren za sve servisere
      if (ordersSubFilter === "pending" && userName) {
        const assigned = (o.assignedTo || "").toLowerCase();
        const isAssignedToMe = assigned.includes(userName) || assigned.includes("svi") || assigned === "";
        return isAssignedToMe;
      }

      return true;
    });
  }, [workOrders, ordersSubFilter, activeUser]);

  // Brojači za tabove
  const counts = useMemo(() => {
    const userName = (activeUser?.fullname || activeUser?.username || "").toLowerCase();
    const pending = workOrders.filter((o) => {
      const isPending = o.status === "pending" || o.status === "in_progress";
      if (!isPending) return false;
      if (!userName) return true;
      const assigned = (o.assignedTo || "").toLowerCase();
      return assigned.includes(userName) || assigned.includes("svi") || assigned === "";
    }).length;

    const completed = workOrders.filter((o) => o.status === "completed" || o.status === "approved").length;

    return { pending, completed, total: workOrders.length };
  }, [workOrders, activeUser]);

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 flex flex-col justify-between overflow-y-auto">
      {/* Gornja traka */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-700 to-blue-600 text-white p-2.5 rounded-2xl shadow-sm flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <span>Radionica Mehanizacije</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                Android Mobilni Portal
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              Radni nalozi, redovni preventivni pregledi i karton mehanizacije
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {onSwitchPortal && (
            <button
              onClick={onSwitchPortal}
              className="text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Servis motornih vozila</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-extrabold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
              {activeUser?.fullname || activeUser?.username || "Serviser"}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border border-red-200 dark:border-red-900/60 cursor-pointer"
            title="Odjava sa sistema"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Odjava</span>
          </button>
        </div>
      </header>

      {/* Navigacijski preklopnik pogleda (Radni nalozi vs Kartoteka pretraga) */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("work_orders")}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "work_orders"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Radni Nalozi & Pregledi</span>
              {counts.pending > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                  {counts.pending}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("search")}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "search"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Karton Mehanizacije</span>
            </button>
          </div>

          {/* Glavni akcijski taster za servisera na terenu */}
          {onOpenFieldForm && (
            <button
              onClick={() => onOpenFieldForm(null)}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shadow-md hover:shadow-emerald-600/30 cursor-pointer shrink-0"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Novi Preventivni Pregled</span>
              <span className="sm:hidden">Novi Pregled</span>
            </button>
          )}
        </div>
      </div>

      {/* Glavni sadržaj */}
      <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full relative z-20">
        {activeTab === "work_orders" ? (
          <div className="space-y-4">
            {/* Brzi CTA baner za pokretanje novog pregleda na telefonu */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-white/20 backdrop-blur-md rounded-2xl">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black tracking-tight">
                    Radni Nalog & Preventivni Pregled
                  </h3>
                  <p className="text-xs text-emerald-100 font-medium mt-0.5">
                    Unos radnih sati (MTH), 8 tačaka ček-liste, opis radova i 5 fotografija jedinice
                  </p>
                </div>
              </div>

              {onOpenFieldForm && (
                <button
                  onClick={() => onOpenFieldForm(null)}
                  className="bg-white text-emerald-800 hover:bg-emerald-50 active:scale-98 px-5 py-3 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer w-full sm:w-auto shrink-0"
                >
                  <PlusCircle className="w-5 h-5 text-emerald-600" />
                  <span>Pokreni Novi Pregled</span>
                </button>
              )}
            </div>

            {/* Filter tabovi za naloge */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOrdersSubFilter("pending")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    ordersSubFilter === "pending"
                      ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>Moji Zaduženi Nalozi</span>
                  <span className="bg-amber-500 text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                    {counts.pending}
                  </span>
                </button>

                <button
                  onClick={() => setOrdersSubFilter("completed")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    ordersSubFilter === "completed"
                      ? "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border border-blue-300 dark:border-blue-700"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>Završeni & Poslani</span>
                  <span className="bg-blue-500 text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                    {counts.completed}
                  </span>
                </button>

                <button
                  onClick={() => setOrdersSubFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    ordersSubFilter === "all"
                      ? "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white border border-slate-300 dark:border-slate-700"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>Svi Nalozi ({counts.total})</span>
                </button>
              </div>
            </div>

            {/* Lista radnih naloga */}
            {serviserOrders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {serviserOrders.map((order) => {
                  const statusMeta = WORK_ORDER_STATUSES[order.status] || {
                    label: order.status,
                    badge: "bg-slate-100 text-slate-700 border-slate-300"
                  };
                  const isPending = order.status === "pending" || order.status === "in_progress";
                  const photoCount = order.photos ? Object.values(order.photos).filter(Boolean).length : 0;

                  return (
                    <div
                      key={order.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Gornji red naloga */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-base text-slate-900 dark:text-white">
                                {order.orderNumber}
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${statusMeta.badge}`}
                              >
                                {statusMeta.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString("bs-BA") : "-"}
                              <span>•</span>
                              <span>{order.type === "preventive" ? "🛡️ Preventivni" : "⚠️ Kvar/Popravka"}</span>
                            </p>
                          </div>

                          {order.priority === "urgent" && (
                            <span className="bg-red-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md animate-pulse">
                              HITNO
                            </span>
                          )}
                        </div>

                        {/* Informacije o vozilu */}
                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 mb-3 border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                              {order.vehicleId}
                            </span>
                            <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                              {order.vehicleDetails?.proizvodjac || ""} {order.vehicleDetails?.model || ""}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {order.vehicleDetails?.lokacija || "Lokacija nije navedena"}
                          </p>
                          {order.workHours > 0 && (
                            <p className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-bold mt-1">
                              Radni sati (MTH): <span className="text-emerald-600">{order.workHours.toLocaleString("bs-BA")} h</span>
                            </p>
                          )}
                        </div>

                        {/* Opis radova */}
                        {order.workDescription && (
                          <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 mb-3 bg-slate-50/50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800/50">
                            {order.workDescription}
                          </p>
                        )}

                        {/* Značke foto i materijala */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            <Camera className="w-3 h-3 text-indigo-500" />
                            {photoCount} / 5 slika
                          </span>
                          {order.usedMaterials && (
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                              Dijelovi: {order.usedMaterials}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Akcijski tasteri */}
                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                        {isPending && onOpenFieldForm ? (
                          <button
                            onClick={() => onOpenFieldForm(order)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Popuni na Terenu</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Završeno</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          {onViewWorkOrder && (
                            <button
                              onClick={() => onViewWorkOrder(order)}
                              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
                              title="Pregledaj detalje"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                          {onPrintWorkOrder && (
                            <button
                              onClick={() => onPrintWorkOrder(order)}
                              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
                              title="Štampaj A4 Nalog"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
                <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nema radnih naloga u odabranoj kategoriji
                </h4>
                <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
                  Svi nalozi su uredno obrađeni ili još niste pokrenuli novi preventivni pregled mehanizacije
                </p>
                {onOpenFieldForm && (
                  <button
                    onClick={() => onOpenFieldForm(null)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-black transition-all inline-flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Pokreni Novi Pregled</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Kartoteka & Pretraga Mehanizacije */
          <div className="w-full bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-center relative z-20">
            <div className="inline-flex bg-gradient-to-tr from-indigo-100 to-blue-100 dark:from-indigo-950 dark:to-blue-950 text-indigo-700 dark:text-indigo-300 p-4 rounded-3xl mb-4 shadow-inner border border-indigo-200/50 dark:border-indigo-800/50">
              <Search className="w-10 h-10" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Karton Mehanizacije & Pretraga Jedinica
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-lg mx-auto font-medium">
              Pretraga skladišne mehanizacije (594 viljuškara) i transportnih vozila po reg. oznaci, garažnom broju ili broju šasije
            </p>

            {/* Forma i Autocomplete Pretraga */}
            <div ref={containerRef} className="relative z-40 max-w-2xl mx-auto mb-6">
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
                    placeholder="Npr. SM-042, GB 123, Jungheinrich..."
                    className="w-full bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-300 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-base font-bold text-slate-900 dark:text-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/20 outline-none uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 transition-all shadow-inner"
                  />
                  <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4 pointer-events-none" />
                </div>

                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white px-7 py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-600/30 cursor-pointer shrink-0"
                >
                  <span>🔍 Pretraži</span>
                </button>
              </form>

              {/* Dropdown sa rezultatima */}
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-left animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5 dark:ring-white/10">
                  <div className="p-2.5 bg-slate-50/80 dark:bg-slate-800/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex justify-between items-center sticky top-0 backdrop-blur-xs z-10 border-b border-slate-100 dark:border-slate-800">
                    <span>Pronađeno ({filteredVehicles.length})</span>
                    <span className="font-mono">Tipka Enter za otvaranje</span>
                  </div>

                  {filteredVehicles.length > 0 ? (
                    filteredVehicles.map((v, idx) => {
                      const isSelected = idx === selectedIndex;
                      const isWh = v.source === "warehouse";

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
                            <div
                              className={`p-2 rounded-xl text-lg ${
                                isSelected
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {getVehicleIcon(v.tipMehan)}
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
                                <span
                                  className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                                    isWh
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                      : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                  }`}
                                >
                                  {isWh ? "Skladišni" : "Transport"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {v.markaVoz || ""} {v.modelVoz || ""} • {v.poslovnaJedinica || v.tipMehan || ""}
                              </p>
                            </div>
                          </div>

                          <ArrowRight className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-slate-300"}`} />
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400 italic">
                      Nema pronađenih jedinica za unos &ldquo;{searchTerm}&rdquo;
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
                    onClick={() => {
                      saveToRecent(r);
                      if (onOpenVehicleModal) onOpenVehicleModal(r);
                    }}
                    className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-slate-700 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-indigo-300 rounded-lg font-bold font-mono transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info kartice za radionicu na dnu */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Ukupno Mehanizacije</p>
              <p className="text-base font-black text-slate-800 dark:text-white">
                {warehouseMasterFleet.length || masterFleet.length} jedinica
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Režim Radionice</p>
              <p className="text-base font-black text-emerald-600 dark:text-emerald-400">Preventivni Pregled</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-xl">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Radni Nalozi u Sistemu</p>
              <p className="text-base font-black text-slate-800 dark:text-white">
                {workOrders.length} naloga
              </p>
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
