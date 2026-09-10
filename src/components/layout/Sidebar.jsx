"use client";

import React, { useMemo } from "react";
import { ClockWidget } from "./ClockWidget.jsx";
import { Truck, Shield, Key, LogOut } from "lucide-react";
import { APP_NAV_SECTIONS, hasPageAccess } from "@/lib/constants.js";

export function Sidebar({
  activePage = "kpi-pregled",
  onNavigatePage,
  activeUser,
  currentRole,
  isDarkMode,
  setIsDarkMode,
  onOpenAdminPanel,
  onOpenPasswordModal,
  onLogout,
  pendingWorkOrdersCount = 0
}) {
  // Filtrirane sekcije i stranice na osnovu granularnih permisija uloge
  const visibleSections = useMemo(() => {
    return APP_NAV_SECTIONS.map((sec) => {
      const visibleItems = sec.items.filter((item) => {
        return hasPageAccess(currentRole, item.id);
      });

      if (visibleItems.length === 0) return null;

      return {
        ...sec,
        items: visibleItems
      };
    }).filter(Boolean);
  }, [currentRole]);

  return (
    <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-between flex-shrink-0 z-20 shadow-sm transition-colors duration-200 h-full">
      {/* Gornji dio Sidebara: Logo & Live Sat */}
      <div className="p-4 flex flex-col gap-3 shrink-0">
        {/* Brending & Logo */}
        <div className="flex items-center gap-3" title="Logistika - Servis motornih vozila">
          <div className="bg-gradient-to-tr from-blue-700 to-indigo-600 text-white p-2.5 rounded-xl shadow-md flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xs font-black text-slate-900 dark:text-white leading-tight tracking-tight uppercase">
              Logistika - Servis
            </h1>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-wider leading-none mt-0.5">
              Motornih vozila
            </p>
          </div>
        </div>

        {/* Live sat & kalendar widget */}
        <ClockWidget />
      </div>

      {/* Navigacija organizovana po kategorijama (Analitika, Baza podataka, Skladišna mehanizacija, Servisna radionica) */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {visibleSections.map((sec) => (
          <div key={sec.id} className="space-y-1">
            {/* Naslov kategorije */}
            <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>{sec.icon}</span>
              <span>{sec.title}</span>
            </div>

            {/* Stavke u kategoriji */}
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigatePage && onNavigatePage(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer group ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-extrabold"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0 transition-transform group-hover:scale-110">
                        {item.icon}
                      </span>
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.hasBadge && pendingWorkOrdersCount > 0 && (
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-xs shrink-0 ${
                          isActive
                            ? "bg-white text-purple-700"
                            : "bg-purple-600 text-white animate-pulse"
                        }`}
                      >
                        {pendingWorkOrdersCount}
                      </span>
                    )}

                    {item.id === "tco-zamjena" && !isActive && (
                      <span className="text-[9px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 px-1.5 py-0.2 rounded font-bold uppercase shrink-0">
                        Test
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Administrativne kontrole na dnu sidebara */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-900/30 shrink-0">
        {/* User Card sa ulogom */}
        {activeUser && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="bg-blue-100 dark:bg-blue-900/50 p-1.5 rounded-md text-blue-800 dark:text-blue-300 text-xs">
                👤
              </span>
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="font-extrabold text-xs text-slate-800 dark:text-slate-200 truncate">
                  {activeUser.fullname || activeUser.username}
                </p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono truncate">
                  {currentRole?.roleName || activeUser.role}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {currentRole?.permissions?.canAccessAdminPanel && (
                <button
                  onClick={onOpenAdminPanel}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold px-2 py-1.5 rounded-lg transition-colors text-[10px] flex items-center justify-center gap-1 border border-indigo-200 dark:border-indigo-900 cursor-pointer"
                >
                  <Shield className="w-3 h-3" /> Admin
                </button>
              )}
              <button
                onClick={onOpenPasswordModal}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold px-2 py-1.5 rounded-lg transition-colors text-[10px] flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <Key className="w-3 h-3" /> Šifra
              </button>
            </div>

            {/* Dugme za Odjavu */}
            <button
              onClick={() => onLogout && onLogout()}
              className="w-full bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50 font-extrabold px-2.5 py-1.5 rounded-lg transition-colors text-[10px] flex items-center justify-center gap-1.5 border border-red-200 dark:border-red-900/60 cursor-pointer mt-0.5"
            >
              <LogOut className="w-3 h-3" /> Odjava
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
