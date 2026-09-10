"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
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
  Search,
  X,
  Bell,
  Volume2,
  Sun,
  Moon,
  Truck,
  Wrench,
  LogOut,
  ChevronRight
} from "lucide-react";
import { WORK_ORDER_STATUSES } from "@/hooks/useWarehouseWorkOrders.js";
import { notificationService } from "@/lib/notificationSound.js";

export function FieldOrdersDashboard({
  workOrders = [],
  warehouseMasterFleet = [],
  activeUser,
  isDarkMode = false,
  setIsDarkMode,
  onOpenFieldForm,
  onViewWorkOrder,
  onPrintWorkOrder,
  onLogout,
  onSwitchPortal,
  onNavigateToPortal,
  canEdit = true
}) {
  // Filter za radne naloge: "pending" (aktivni/dodijeljeni) ili "completed" (završeni)
  const [ordersFilter, setOrdersFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");

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

        const assigned = (o.assignedTo || "").toLowerCase();
        const isAssignedToMe =
          !assigned ||
          assigned === "svi" ||
          (userName && assigned.includes(userName)) ||
          (userName && userName.includes(assigned));

        if (isAssignedToMe && (o.status === "pending" || o.status === "in_progress")) {
          setNewOrderAlert(o);
          notificationService.playOrderAlert();
          notificationService.showBrowserNotification(
            `Novi radni nalog: ${o.vehicleId || "Mehanizacija"}`,
            {
              body: o.workDescription || "Dodijeljen vam je novi radni nalog.",
              tag: `order-${o.id}`
            }
          );
          break;
        }
      }
    }
  }, [workOrders, activeUser]);

  // Brojači
  const counts = useMemo(() => {
    let pending = 0;
    let completed = 0;

    workOrders.forEach((o) => {
      if (o.status === "pending" || o.status === "in_progress") {
        pending++;
      } else if (o.status === "completed" || o.status === "approved") {
        completed++;
      }
    });

    return { pending, completed };
  }, [workOrders]);

  // Filtrirani nalozi za trenutni tab
  const filteredOrders = useMemo(() => {
    let list = workOrders.filter((o) => {
      if (ordersFilter === "pending") {
        return o.status === "pending" || o.status === "in_progress";
      }
      return o.status === "completed" || o.status === "approved";
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((o) => {
        const vId = (o.vehicleId || "").toLowerCase();
        const num = (o.orderNumber || "").toLowerCase();
        const desc = (o.workDescription || "").toLowerCase();
        const ass = (o.assignedTo || "").toLowerCase();
        return vId.includes(q) || num.includes(q) || desc.includes(q) || ass.includes(q);
      });
    }

    return list;
  }, [workOrders, ordersFilter, searchQuery]);

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      {/* Gornje Zaglavlje */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-emerald-600 to-teal-700 text-white p-2.5 rounded-2xl shadow-sm flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Terenski Radni Nalozi
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              Mobilni pregledi, ček-liste i radni sati (MTH)
            </p>
          </div>
        </div>

        {/* Akcije navigacije */}
        <div className="flex items-center gap-2 flex-wrap">
          {onNavigateToPortal && (
            <button
              type="button"
              onClick={onNavigateToPortal}
              className="text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/60 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 cursor-pointer"
              title="Otvori brzu pretragu kartona vozila"
            >
              <Search className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Serviserski Portal</span>
            </button>
          )}

          {onSwitchPortal && (
            <button
              type="button"
              onClick={onSwitchPortal}
              className="text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Povratak na transport i analitiku"
            >
              <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Glavna Aplikacija</span>
            </button>
          )}

          {setIsDarkMode && (
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isDarkMode ? "Svijetla tema" : "Tamna tema"}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          )}

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-extrabold truncate max-w-[130px]">
              {activeUser?.fullname || activeUser?.username || "Serviser"}
            </span>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50 px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 border border-red-200 dark:border-red-900/60 cursor-pointer"
              title="Odjava sa sistema"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Odjava</span>
            </button>
          )}
        </div>
      </header>

      {/* Glavni sadržaj */}
      <main className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full space-y-4">
        {/* Iskačući zvučni alarm za novi nalog */}
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

        {/* GLAVNO DUGME: POKRENI NOVI NALOG */}
        {onOpenFieldForm && canEdit && (
          <button
            type="button"
            onClick={() => onOpenFieldForm(null)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white p-4 sm:p-5 rounded-3xl font-black text-lg sm:text-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-emerald-600/30 transition-all cursor-pointer border-2 border-emerald-500"
          >
            <PlusCircle className="w-7 h-7 sm:w-8 h-8 shrink-0" />
            <span className="tracking-wide">+ POKRENI NOVI NALOG</span>
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
            className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer py-1"
          >
            <Volume2 className="w-4 h-4 text-emerald-500" />
            <span>Isprobaj zvuk alarma za novi nalog</span>
          </button>
        </div>

        {/* Tabovi filtera: Čekaju na rad / Završeni */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOrdersFilter("pending")}
            className={`p-3.5 rounded-2xl font-black text-sm sm:text-base flex flex-col items-center justify-center gap-1 transition-all border-2 cursor-pointer ${
              ordersFilter === "pending"
                ? "bg-amber-500 text-white border-amber-600 shadow-md scale-101"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
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
            className={`p-3.5 rounded-2xl font-black text-sm sm:text-base flex flex-col items-center justify-center gap-1 transition-all border-2 cursor-pointer ${
              ordersFilter === "completed"
                ? "bg-emerald-600 text-white border-emerald-700 shadow-md scale-101"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
            }`}
          >
            <span>🟢 ZAVRŠENI NALOZI</span>
            <span className="text-lg sm:text-xl font-mono font-black">
              {counts.completed}
            </span>
          </button>
        </div>

        {/* Brza pretraga unutar naloga */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pretraži naloge po broju, vozilu ili opisu..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold outline-none text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* LISTA RADNIH NALOGA */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-3.5 pt-1">
            {filteredOrders.map((order) => {
              const statusMeta = WORK_ORDER_STATUSES[order.status] || {
                label: order.status,
                badge: "bg-slate-100 text-slate-700 border-slate-300"
              };
              const isPending = order.status === "pending" || order.status === "in_progress";
              const photoCount = order.photos ? Object.values(order.photos).filter(Boolean).length : 0;

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3 transition-all hover:border-emerald-500/50"
                >
                  {/* Zaglavlje kartice naloga */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xl text-slate-900 dark:text-white">
                          {order.vehicleId || "Bez oznake"}
                        </span>
                        {order.priority === "urgent" && (
                          <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse">
                            HITNO
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                        {order.orderNumber}
                      </div>
                    </div>

                    <span
                      className={`text-xs font-black px-3 py-1 rounded-xl border ${statusMeta.badge}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>

                  {/* Informacije o jedinici i nalogu */}
                  <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-3 space-y-1.5 text-xs">
                    {order.workHours && (
                      <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span>Radni sati:</span>
                        <span className="font-mono font-black text-blue-600 dark:text-blue-400">
                          {Number(order.workHours).toLocaleString("bs-BA")} MTH
                        </span>
                      </div>
                    )}

                    {order.workDescription && (
                      <div className="text-slate-800 dark:text-slate-200 font-bold leading-snug">
                        <span className="text-slate-400 font-normal mr-1">Opis:</span>
                        {order.workDescription}
                      </div>
                    )}

                    {order.usedMaterials && (
                      <div className="text-slate-600 dark:text-slate-400 text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-800">
                        <span className="font-bold">Utrošeni dijelovi:</span> {order.usedMaterials}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{photoCount} / 5 fotografija</span>
                      </span>
                      <span>
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString("bs-BA") : "Nedavno"}
                      </span>
                    </div>
                  </div>

                  {/* Akcije na kartici */}
                  <div className="flex items-center gap-2 pt-1">
                    {isPending && onOpenFieldForm && canEdit ? (
                      <button
                        type="button"
                        onClick={() => onOpenFieldForm(order)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-4 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
                      >
                        <span>⚡ OTVORI I POPUNI NALOG</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onViewWorkOrder && onViewWorkOrder(order)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2.5 px-3 rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span>Pregledaj detalje</span>
                      </button>
                    )}

                    {onPrintWorkOrder && (
                      <button
                        type="button"
                        onClick={() => onPrintWorkOrder(order)}
                        className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl transition-colors cursor-pointer"
                        title="Štampaj nalog (A4)"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="font-black text-base text-slate-800 dark:text-white">
              {ordersFilter === "pending"
                ? "Nema otvorenih radnih naloga na čekanju"
                : "Nema završenih naloga u arhivi"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {ordersFilter === "pending"
                ? "Svi zadaci su uspješno završeni ili trenutno nema dodijeljenih naloga za radionicu."
                : "Završeni i odobreni nalozi će se pojaviti ovdje."}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-slate-400 dark:text-slate-500 text-[11px] font-medium border-t border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50">
        Bingo d.o.o. Tuzla • Transport & Održavanje • Terenski Radni Nalozi
      </footer>
    </div>
  );
}
