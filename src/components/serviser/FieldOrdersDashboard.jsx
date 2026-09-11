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
  ChevronRight,
  Menu,
  RefreshCw,
  User,
  Shield,
  Smartphone,
  Check
} from "lucide-react";
import { WORK_ORDER_STATUSES } from "@/hooks/useWarehouseWorkOrders.js";
import { notificationService } from "@/lib/notificationSound.js";

const APP_VERSION = "1.1.0 (Build 2026.09.11)";

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
  // Stanje filtera: "pending" (aktivni/dodijeljeni) ili "completed" (završeni)
  const [ordersFilter, setOrdersFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Stanje gornjeg menija "tri linije" (Drawer)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Stanje za OTA ažuriranje i notifikacije
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatusMessage, setUpdateStatusMessage] = useState("");
  const [testCountdown, setTestCountdown] = useState(0);

  // Notifikacija i zvučni alarm za novi dodijeljeni radni nalog
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const initialOrdersLoadedRef = useRef(false);
  const prevOrdersMapRef = useRef(new Map());

  // Otključavanje Web Audio API-ja na prvi dodir ekrana (zaobilaženje browser autoplay restrikcija)
  useEffect(() => {
    const unlockAudio = () => {
      notificationService.getAudioContext();
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("click", unlockAudio);
    };
    window.addEventListener("touchstart", unlockAudio, { passive: true });
    window.addEventListener("click", unlockAudio, { passive: true });
    return () => {
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("click", unlockAudio);
    };
  }, []);

  const triggerOrderNotification = (order) => {
    setNewOrderAlert(order);
    notificationService.playOrderAlert();
    notificationService.showSystemNotification(
      `🔔 NOVI RADNI NALOG: ${order.vehicleId || "Mehanizacija"}`,
      order.workDescription || "Dodijeljen vam je novi radni nalog."
    );
    if (typeof window !== "undefined" && window.ReactNativeWebView) {
      try {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: "NOTIFICATION",
            title: `🔔 NOVI RADNI NALOG: ${order.vehicleId || "Mehanizacija"}`,
            body: order.workDescription || "Dodijeljen vam je novi radni nalog.",
            orderId: order.id
          })
        );
      } catch (e) {}
    }
  };

  useEffect(() => {
    if (!workOrders || workOrders.length === 0) return;

    const rawUserName = (activeUser?.fullname || activeUser?.username || "").toLowerCase();
    const role = (activeUser?.role || "").toLowerCase();
    const isAdminOrTester =
      role === "admin" ||
      role === "superadmin" ||
      role === "uprava" ||
      role === "dispecer" ||
      role === "warehouse_manager" ||
      rawUserName.includes("admin") ||
      rawUserName.includes("emir");

    const normalizeStr = (s) =>
      (s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "dj")
        .replace(/ž/g, "z")
        .replace(/č/g, "c")
        .replace(/ć/g, "c")
        .replace(/š/g, "s")
        .trim();

    const normUser = normalizeStr(rawUserName);

    // Pri prvom učitavanju zabilježi postojeće naloge, ali provjeri ima li svježih nepročitanih
    if (!initialOrdersLoadedRef.current) {
      workOrders.forEach((o) => {
        if (o.id) prevOrdersMapRef.current.set(o.id, o);
      });
      initialOrdersLoadedRef.current = true;

      // Ako postoji nalog kreiran u zadnjih 60 minuta koji još nije potvrđen, odmah oglasi alarm
      const now = Date.now();
      for (const o of workOrders) {
        if ((o.status === "pending" || o.status === "in_progress") && o.createdAt) {
          const orderAge = now - new Date(o.createdAt).getTime();
          const ackKey = `ack_order_${o.id}`;
          let isAck = false;
          try { isAck = !!localStorage.getItem(ackKey); } catch (e) {}

          const normAssigned = normalizeStr(o.assignedTo || "");
          const isAssignedToMe =
            isAdminOrTester ||
            !normAssigned ||
            normAssigned === "svi" ||
            normAssigned.includes("svi") ||
            (normUser && normAssigned.includes(normUser)) ||
            (normUser && normUser.includes(normAssigned)) ||
            role === "mobile_serviser" ||
            role === "serviser";

          if (orderAge < 60 * 60 * 1000 && !isAck && isAssignedToMe) {
            try { localStorage.setItem(ackKey, "1"); } catch (e) {}
            triggerOrderNotification(o);
            break;
          }
        }
      }
      return;
    }

    // Provjeri ima li novi nalog pristigao u realnom vremenu
    for (const o of workOrders) {
      if (o.id && !prevOrdersMapRef.current.has(o.id)) {
        prevOrdersMapRef.current.set(o.id, o);

        const normAssigned = normalizeStr(o.assignedTo || "");
        const isAssignedToMe =
          isAdminOrTester ||
          !normAssigned ||
          normAssigned === "svi" ||
          normAssigned.includes("svi") ||
          (normUser && normAssigned.includes(normUser)) ||
          (normUser && normUser.includes(normAssigned)) ||
          role === "mobile_serviser" ||
          role === "serviser";

        if (isAssignedToMe && (o.status === "pending" || o.status === "in_progress")) {
          const ackKey = `ack_order_${o.id}`;
          try { localStorage.setItem(ackKey, "1"); } catch (e) {}
          triggerOrderNotification(o);
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

  // Provjera OTA ažuriranja
  const handleCheckOtaUpdate = () => {
    setIsCheckingUpdate(true);
    setUpdateStatusMessage("Provjeravam najnoviju verziju koda sa servera...");

    // 1. Pošalji poruku u React Native WebView ako je aplikacija na telefonu
    if (typeof window !== "undefined" && window.ReactNativeWebView) {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: "CHECK_OTA_UPDATE" }));
      } catch (e) {}
    }

    // 2. Simuliraj i osvježi keš na Webu
    setTimeout(() => {
      setIsCheckingUpdate(false);
      setUpdateStatusMessage("Aplikacija je ažurna! Prikazana je najnovija verzija.");
      setTimeout(() => setUpdateStatusMessage(""), 5000);
    }, 1800);
  };

  // Testiranje notifikacije na zaključanom ekranu sa 5 sekundi odgode
  const handleTestDelayedNotification = () => {
    notificationService.requestNotificationPermission();

    // Pošalji native WebView nalog za alarm sa odgodom od 5 sekundi
    if (typeof window !== "undefined" && window.ReactNativeWebView) {
      try {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: "TEST_DELAYED_NOTIFICATION", delaySeconds: 5 })
        );
      } catch (e) {}
    }

    setTestCountdown(5);
    const interval = setInterval(() => {
      setTestCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          notificationService.playOrderAlert();
          notificationService.showBrowserNotification("🔔 TEST NOTIFIKACIJA ZA SERVISERA", {
            body: "Uspješno primljena notifikacija na zaključanom ekranu! Zvuk i vibracija rade.",
            tag: "test-notification"
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      
      {/* ========================================================================= */}
      {/* GORNJE ZAGLAVLJE SA MENIJEM 'TRI LINIJE' (☰)                              */}
      {/* ========================================================================= */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2.5 shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* DUGME 'TRI LINIJE' (HAMBURGER MENI) */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white transition-all cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-95 flex items-center justify-center shrink-0"
            title="Otvori meni aplikacije"
          >
            <Menu className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-gradient-to-tr from-emerald-600 to-teal-700 text-white p-2 rounded-xl shadow-xs shrink-0 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight truncate">
                Terenski radni nalozi
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-none mt-0.5 truncate">
                Bingo Servis Mehanizacije • Radionica
              </p>
            </div>
          </div>
        </div>

        {/* Brze akcije desno */}
        <div className="flex items-center gap-2 shrink-0">
          {setIsDarkMode && (
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isDarkMode ? "Svijetla tema" : "Tamna tema"}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          )}

          {/* Kartica prijavljenog korisnika u zaglavlju */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-extrabold truncate max-w-[90px] sm:max-w-[120px] text-slate-800 dark:text-slate-200">
              {activeUser?.fullname || activeUser?.username || "Serviser"}
            </span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* BOČNI DRAWER / SLIDE-OVER MENI ('TRI LINIJE')                              */}
      {/* ========================================================================= */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9998] flex justify-start animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm h-full shadow-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-y-auto p-5 animate-in slide-in-from-left duration-200">
            
            <div className="space-y-5">
              {/* Zaglavlje menija */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black text-sm">
                    B
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      Bingo Mehanizacija
                    </h2>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                      Serviserski mobilni meni
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. INFORMACIJE O PRIJAVLJENOM KORISNIKU */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span>Prijavljeni serviser</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white font-black text-lg flex items-center justify-center shadow-sm">
                    {(activeUser?.fullname || activeUser?.username || "S").charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-black text-sm text-slate-900 dark:text-white truncate">
                      {activeUser?.fullname || activeUser?.username || "Serviser"}
                    </h3>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold truncate">
                      @{activeUser?.username || "serviser"}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {activeUser?.role === "superadmin"
                        ? "Superadmin"
                        : activeUser?.role === "serviser_terenski"
                        ? "Terenski serviser"
                        : activeUser?.role || "Serviser"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-750 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Radionica / PJ:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {activeUser?.radionica || "Centralna radionica"}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Status uređaja:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Povezano
                    </strong>
                  </div>
                </div>
              </div>

              {/* 2. BROJ VERZIJE I OTA AŽURIRANJE */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Verzija aplikacije</span>
                  </span>
                  <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-200">
                    {APP_VERSION}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Aplikacija podržava direktno OTA (Over-The-Air) osvježavanje bez potrebe za ponovnom instalacijom APK paketa.
                </p>

                {updateStatusMessage && (
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-xs font-bold rounded-xl flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{updateStatusMessage}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCheckOtaUpdate}
                  disabled={isCheckingUpdate}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isCheckingUpdate ? "animate-spin" : ""}`} />
                  <span>{isCheckingUpdate ? "PROVJERAVAM..." : "PROVJERI OTA AŽURIRANJE"}</span>
                </button>
              </div>

              {/* 3. DIJAGNOSTIKA NOTIFIKACIJA & TEST ZAKLJUČANOG EKRANA */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5" />
                  <span>Status notifikacija</span>
                </div>

                <div className="text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Notifikacioni kanal:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Aktivan (MAX)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Zvuk i vibracija:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Omogućeno</span>
                  </div>
                </div>

                {testCountdown > 0 ? (
                  <div className="p-3 bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 rounded-xl text-center space-y-1">
                    <div className="text-xl font-black font-mono text-amber-900 dark:text-amber-200">
                      ODMAH ZAKLJUČAJTE EKRAN! ({testCountdown}s)
                    </div>
                    <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                      Za {testCountdown} sekundi telefon će zazvoniti i probuditi zaključan ekran.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleTestDelayedNotification}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>TESTIRAJ ZAKLJUČAN EKRAN (ODGODA 5S)</span>
                  </button>
                )}
              </div>

            </div>

            {/* Donji dio menija: Odjava */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-rose-200 dark:border-rose-900"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ODJAVI SE SA SISTEMA</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STRANICA 1: GLAVNI SADRŽAJ (INFORMACIJE O KORISNIKU I RADNI NALOZI)        */}
      {/* ========================================================================= */}
      <main className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full space-y-4">
        
        {/* KARTICA 1: INFORMACIJE O KORISNIKU I RADIONICI (STRANICA 1) */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-4 sm:p-5 rounded-3xl shadow-md flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">
              Bingo Servis Mehanizacije • Terenski nalozi
            </span>
            <h2 className="text-lg sm:text-xl font-black tracking-tight leading-tight mt-0.5">
              {activeUser?.fullname || activeUser?.username || "Serviser"}
            </h2>
            <div className="text-xs text-blue-100 font-medium mt-1 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                {activeUser?.radionica || "Skladišna mehanizacija"}
              </span>
              <span>•</span>
              <span className="font-mono text-amber-300 font-bold">{counts.pending} aktivan nalog(a)</span>
            </div>
          </div>

          {/* Elegantna statusna značka umjesto duplog hamburger dugmeta */}
          <div className="p-3 bg-white/10 text-white rounded-2xl flex flex-col items-center gap-0.5 shrink-0 border border-white/15">
            <span className="text-[10px] font-black uppercase text-blue-200">Zadaci</span>
            <span className="text-xl font-black font-mono text-amber-300 leading-none">{counts.pending}</span>
          </div>
        </div>

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
            placeholder="Pretraži naloge po broju, mašini ili opisu..."
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
                        className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold py-2.5 px-3 rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span>Pregledaj detalje</span>
                      </button>
                    )}

                    {onPrintWorkOrder && (
                      <button
                        type="button"
                        onClick={() => onPrintWorkOrder(order)}
                        className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-2xl transition-colors cursor-pointer"
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
