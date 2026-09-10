"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Wrench,
  Search,
  Truck,
  LogOut,
  ChevronRight,
  ClipboardList,
  PlusCircle,
  Camera,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Calendar,
  MapPin,
  ArrowRight,
  Clock,
  ChevronDown,
  X,
  Bell,
  Volume2
} from "lucide-react";
import { WORK_ORDER_STATUSES } from "@/hooks/useWarehouseWorkOrders.js";
import { notificationService } from "@/lib/notificationSound.js";

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
  // Filter za radne naloge: "pending" (aktivni/dodijeljeni) ili "completed" (završeni)
  const [ordersFilter, setOrdersFilter] = useState("pending");

  // Prikaz kartoteke / brze pretrage jedinica
  const [showVehicleSearch, setShowVehicleSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Zatvaranje dropdowna na klik van
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Notifikacija i zvučni alarm za novi dodijeljeni radni nalog
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const initialOrdersLoadedRef = useRef(false);
  const prevOrdersMapRef = useRef(new Map());

  useEffect(() => {
    if (!workOrders || workOrders.length === 0) return;

    const userName = (activeUser?.fullname || activeUser?.username || "").toLowerCase();

    // Pri prvom učitavanju samo zabilježi postojeće naloge da ne svira za stare naloge
    if (!initialOrdersLoadedRef.current) {
      workOrders.forEach((o) => {
        if (o.id) prevOrdersMapRef.current.set(o.id, o);
      });
      initialOrdersLoadedRef.current = true;
      return;
    }

    // Provjeri ima li novi nalog
    for (const o of workOrders) {
      if (o.id && !prevOrdersMapRef.current.has(o.id)) {
        prevOrdersMapRef.current.set(o.id, o);

        const isPending = o.status === "pending" || o.status === "in_progress";
        if (isPending) {
          const assigned = (o.assignedTo || "").toLowerCase();
          const isForMe = !userName || assigned.includes(userName) || assigned.includes("svi") || assigned === "";

          if (isForMe) {
            setNewOrderAlert(o);
            notificationService.showSystemNotification(
              `🔔 NOVI RADNI NALOG: ${o.vehicleId || "Skladišna mehanizacija"}`,
              `Zadatak: ${o.workDescription || "Pregled i servis jedinice"}`
            );
            break;
          }
        }
      }
    }
  }, [workOrders, activeUser]);

  // Kombinovana flota za pretragu
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

  // Filtrirana vozila
  const filteredVehicles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return combinedFleet.slice(0, 8);

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
      .slice(0, 10);
  }, [combinedFleet, searchTerm]);

  const handleSelectVehicle = (vehicle) => {
    if (!vehicle || !vehicle.reg) return;
    if (onOpenVehicleModal) onOpenVehicleModal(vehicle.reg);
    setSearchTerm("");
    setIsDropdownOpen(false);
    setShowVehicleSearch(false);
  };

  // Filtrirani nalozi za prijavljenog servisera
  const serviserOrders = useMemo(() => {
    const userName = (activeUser?.fullname || activeUser?.username || "").toLowerCase();

    return workOrders.filter((o) => {
      // Filter po statusu
      if (ordersFilter === "pending") {
        if (o.status !== "pending" && o.status !== "in_progress") return false;
      } else if (ordersFilter === "completed") {
        if (o.status !== "completed" && o.status !== "approved") return false;
      }

      // Ako je zadužen nalog
      if (ordersFilter === "pending" && userName) {
        const assigned = (o.assignedTo || "").toLowerCase();
        const isAssignedToMe = assigned.includes(userName) || assigned.includes("svi") || assigned === "";
        return isAssignedToMe;
      }

      return true;
    });
  }, [workOrders, ordersFilter, activeUser]);

  // Brojači naloga
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
    <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 flex flex-col justify-between text-slate-900 dark:text-white">
      {/* Glavno zaglavlje aplikacije - prilagođeno mobilnom ekranu */}
      <header className="bg-white dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-800 px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-xs">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">
                Servis Mehanizacije
              </h1>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {activeUser?.fullname || activeUser?.username || "Serviser na terenu"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSwitchPortal && (
              <button
                onClick={onSwitchPortal}
                className="text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                title="Prebaci na transport"
              >
                <Truck className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onLogout}
              className="text-xs font-black bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Odjavi se"
            >
              <LogOut className="w-4 h-4" />
              <span>Odjava</span>
            </button>
          </div>
        </div>
      </header>

      {/* Glavni sadržaj za servisera */}
      <main className="flex-1 px-4 py-4 max-w-xl mx-auto w-full space-y-4">
        {/* Iskačući zvučni alarm / obavijest o novom nalogu */}
        {newOrderAlert && (
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-4 sm:p-5 rounded-3xl shadow-2xl border-4 border-amber-300 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-6 h-6 text-white animate-bounce" />
                <span className="font-black text-base sm:text-lg uppercase tracking-wide">
                  STIGAO NOVI RADNI NALOG!
                </span>
              </div>
              <button
                type="button"
                onClick={() => setNewOrderAlert(null)}
                className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
                title="Zatvori obavijest"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20">
              <div className="text-2xl font-black font-mono">
                {newOrderAlert.vehicleId}
              </div>
              <p className="text-sm font-bold mt-1 leading-snug">
                {newOrderAlert.workDescription || "Dodijeljen radni nalog od strane voditelja."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const target = newOrderAlert;
                setNewOrderAlert(null);
                if (onOpenFieldForm) onOpenFieldForm(target);
              }}
              className="mt-3 w-full bg-white text-amber-950 hover:bg-amber-50 active:scale-98 font-black py-3.5 px-4 rounded-2xl text-base shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>⚡ OTVORI I POPUNI ODMAH</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 1. GLAVNO DUGME: POKRENI NOVI NALOG (Veliko, uočljivo za starije ljude) */}
        {onOpenFieldForm && (
          <button
            type="button"
            onClick={() => onOpenFieldForm(null)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white p-4 sm:p-5 rounded-3xl font-black text-lg sm:text-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-emerald-600/30 transition-all cursor-pointer border-2 border-emerald-500"
          >
            <PlusCircle className="w-7 h-7 sm:w-8 h-8 shrink-0" />
            <span className="tracking-wide">POKRENI NOVI NALOG</span>
          </button>
        )}

        {/* Test zvuka alarma i notifikacija */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => {
              notificationService.requestNotificationPermission();
              notificationService.playOrderAlert();
            }}
            className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors cursor-pointer py-1"
          >
            <Volume2 className="w-4 h-4 text-indigo-500" />
            <span>Isprobaj zvuk alarma za novi nalog</span>
          </button>
        </div>

        {/* 2. BRZA PRETRAGA KARTONA MEHANIZACIJE (Kao sklopivi panel da ne smeta) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setShowVehicleSearch(!showVehicleSearch)}
            className="w-full px-4 py-3 flex items-center justify-between text-left font-extrabold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Pretraga kartona viljuškara i vozila</span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition-transform ${showVehicleSearch ? "rotate-180" : ""}`}
            />
          </button>

          {showVehicleSearch && (
            <div ref={searchContainerRef} className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Ukucajte ID npr. 342 RX 17, model ili PJ..."
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-3 py-3 text-sm font-bold outline-none text-slate-900 dark:text-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
              </div>

              {isDropdownOpen && filteredVehicles.length > 0 && (
                <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-700 max-h-56 overflow-y-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
                  {filteredVehicles.map((v) => (
                    <div
                      key={v.reg}
                      onClick={() => handleSelectVehicle(v)}
                      className="p-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400 mr-2">
                          {v.reg}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {v.tipMehan} • {v.markaVoz} {v.modelVoz}
                        </span>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {v.poslovnaJedinica || "Centralno skladište"}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. SEKCIJA: RADNI NALOZI U SISTEMU */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black uppercase text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Radni nalozi u sistemu</span>
            </h2>
          </div>

          {/* Dva velika tab dugmeta za filter */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOrdersFilter("pending")}
              className={`p-3 rounded-2xl font-black text-sm sm:text-base flex flex-col items-center justify-center gap-1 transition-all border-2 cursor-pointer ${
                ordersFilter === "pending"
                  ? "bg-amber-500 text-white border-amber-600 shadow-md scale-101"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
              }`}
            >
              <span>🟡 ČEKAJU NA RAD</span>
              <span className="text-lg sm:text-xl font-mono font-black">
                {counts.pending}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setOrdersFilter("completed")}
              className={`p-3 rounded-2xl font-black text-sm sm:text-base flex flex-col items-center justify-center gap-1 transition-all border-2 cursor-pointer ${
                ordersFilter === "completed"
                  ? "bg-emerald-600 text-white border-emerald-700 shadow-md scale-101"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
              }`}
            >
              <span>🟢 ZAVRŠENI NALOZI</span>
              <span className="text-lg sm:text-xl font-mono font-black">
                {counts.completed}
              </span>
            </button>
          </div>

          {/* LISTA RADNIH NALOGA */}
          {serviserOrders.length > 0 ? (
            <div className="space-y-3.5 pt-1">
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
                    className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3"
                  >
                    {/* Zaglavlje kartice naloga */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-base sm:text-lg text-slate-900 dark:text-white">
                            {order.orderNumber}
                          </span>
                          <span
                            className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${statusMeta.badge}`}
                          >
                            {statusMeta.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString("bs-BA") : "-"}
                          <span>•</span>
                          <span>{order.type === "preventive" ? "🛡️ Preventivni" : "⚠️ Kvar/Popravka"}</span>
                        </p>
                      </div>

                      {order.priority === "urgent" && (
                        <span className="bg-red-600 text-white text-xs font-black uppercase px-2.5 py-1 rounded-lg animate-pulse">
                          HITNO
                        </span>
                      )}
                    </div>

                    {/* Istaknuti podaci o viljuškaru */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-750">
                      <div className="text-xl sm:text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                        {order.vehicleId}
                      </div>
                      <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                        {order.vehicleDetails?.proizvodjac || ""} {order.vehicleDetails?.model || ""}
                      </div>
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{order.vehicleDetails?.lokacija || "PJ Centralno Skladište"}</span>
                      </div>
                      {order.workHours > 0 && (
                        <div className="text-xs font-mono text-slate-700 dark:text-slate-300 font-bold mt-1.5">
                          Radni sati (MTH): <span className="text-emerald-600 dark:text-emerald-400 font-black">{order.workHours.toLocaleString("bs-BA")} h</span>
                        </div>
                      )}
                    </div>

                    {/* Nalog / Uputstvo voditelja (ako postoji) */}
                    {order.workDescription && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border-l-4 border-amber-500 rounded-r-2xl">
                        <span className="text-xs font-black uppercase text-amber-900 dark:text-amber-300 block mb-0.5">
                          Nalog voditelja:
                        </span>
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                          {order.workDescription}
                        </p>
                      </div>
                    )}

                    {/* Status slika i materijala */}
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
                        <Camera className="w-3.5 h-3.5 text-indigo-500" />
                        {photoCount} / 5 slika
                      </span>
                      {order.usedMaterials && (
                        <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl truncate max-w-[180px]">
                          Dijelovi: {order.usedMaterials}
                        </span>
                      )}
                    </div>

                    {/* Akcija na kartici */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      {isPending && onOpenFieldForm ? (
                        <button
                          type="button"
                          onClick={() => onOpenFieldForm(order)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                        >
                          <Camera className="w-5 h-5" />
                          <span>OTVORI I POPUNI NALOG</span>
                          <ArrowRight className="w-5 h-5 ml-auto" />
                        </button>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>ZAVRŠENO</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {onViewWorkOrder && (
                              <button
                                type="button"
                                onClick={() => onViewWorkOrder(order)}
                                className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer"
                                title="Pregledaj detalje"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            )}
                            {onPrintWorkOrder && (
                              <button
                                type="button"
                                onClick={() => onPrintWorkOrder(order)}
                                className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer"
                                title="Štampaj A4 Nalog"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800 shadow-xs">
              <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h4 className="text-base font-black text-slate-700 dark:text-slate-300 mb-1">
                Nema naloga u ovoj kategoriji
              </h4>
              <p className="text-xs text-slate-400 font-medium">
                {ordersFilter === "pending"
                  ? "Trenutno nemate zaduženih radnih naloga na čekanju."
                  : "Još nema završenih radnih naloga."}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Jednostavan footer */}
      <footer className="py-3 text-center text-slate-400 dark:text-slate-500 text-xs font-bold border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70">
        Bingo Servis Mehanizacije • Mobilni Portal
      </footer>
    </div>
  );
}
