"use client";

import React, { useState, useEffect } from "react";
import { ClockWidget } from "./ClockWidget.jsx";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Wrench,
  Database,
  Boxes,
  Layers,
  Building2,
  Moon,
  Sun,
  Shield,
  Key,
  LogOut,
  ChevronLeft
} from "lucide-react";

export function Sidebar({
  portalMode,
  setPortalMode,
  activeTab,
  setActiveTab,
  activeWhTab,
  setActiveWhTab,
  activeUser,
  currentRole,
  isDarkMode,
  setIsDarkMode,
  onOpenAdminPanel,
  onOpenPasswordModal
}) {
  const isSuperadmin = activeUser?.role === "superadmin" || activeUser?.username === "emir.durakovic";

  const isTabAllowed = (tabId, portal = "transport") => {
    if (isSuperadmin) return true;
    const allowedPanels = currentRole?.navigationPanels || [];
    return allowedPanels.some((p) => p.portal === portal && p.tabId === tabId);
  };

  return (
    <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full flex-shrink-0 z-20 transition-all duration-300">
      {/* Logo / Naslov */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Servis motornih vozila
          <span className="block text-blue-600 dark:text-blue-400 text-sm mt-1">
            Održavanje voznog parka
          </span>
        </h1>
      </div>

      {/* Sat i Kalendar Widget */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
        <ClockWidget />
      </div>

      {/* Navigacijski linkovi */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {portalMode === "transport" ? (
          <>
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 mt-2">
              Nadzorna ploča
            </div>

            {isTabAllowed(1, "transport") && (
              <button
                onClick={() => setActiveTab(1)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 1
                    ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-extrabold"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
                }`}
              >
                <LayoutDashboard className="w-5 h-5 opacity-80" />
                <span>Pregled Flote & KPI</span>
              </button>
            )}

            {isTabAllowed(2, "transport") && (
              <button
                onClick={() => setActiveTab(2)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 2
                    ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-extrabold"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
                }`}
              >
                <TrendingUp className="w-5 h-5 opacity-80" />
                <span>Analiza Održavanja</span>
              </button>
            )}

            {isTabAllowed(3, "transport") && (
              <button
                onClick={() => setActiveTab(3)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 3
                    ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-extrabold"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
                }`}
              >
                <BarChart3 className="w-5 h-5 opacity-80" />
                <span>YoY Komparacija</span>
              </button>
            )}

            {isTabAllowed(4, "transport") && (
              <button
                onClick={() => setActiveTab(4)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 4
                    ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-extrabold"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
                }`}
              >
                <Wrench className="w-5 h-5 opacity-80" />
                <span>Tabela Servisa</span>
              </button>
            )}

            {isTabAllowed(5, "transport") && (
              <button
                onClick={() => setActiveTab(5)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 5
                    ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-extrabold"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
                }`}
              >
                <Database className="w-5 h-5 opacity-80" />
                <span>Matična baza podataka voznog parka</span>
              </button>
            )}

            {/* Skladišna Mehanizacija Prečica */}
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setPortalMode("warehouse")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40 hover:bg-amber-100 border border-amber-200 dark:border-amber-900 transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>🏗️</span> Skladišna Mehanizacija
                </span>
                <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded font-mono font-bold">
                  594
                </span>
              </button>
            </div>
          </>
        ) : (
          /* Skladišna Mehanizacija Meni */
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider mb-3 mt-2">
              Skladišna Mehanizacija
            </div>

            <button
              onClick={() => setActiveWhTab(1)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all cursor-pointer ${
                activeWhTab === 1
                  ? "bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-extrabold"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
              }`}
            >
              <span className="text-lg">📊</span> Analitika & Finansije
            </button>

            <button
              onClick={() => setActiveWhTab(2)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all cursor-pointer ${
                activeWhTab === 2
                  ? "bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-extrabold"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
              }`}
            >
              <span className="text-lg">🚜</span> Šifrarnik Flote (594)
            </button>

            <button
              onClick={() => setActiveWhTab(3)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all cursor-pointer ${
                activeWhTab === 3
                  ? "bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-extrabold"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
              }`}
            >
              <span className="text-lg">🔧</span> Pregled Svih Opravki
            </button>

            <button
              onClick={() => setActiveWhTab(4)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all cursor-pointer ${
                activeWhTab === 4
                  ? "bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-extrabold"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
              }`}
            >
              <span className="text-lg">⚡</span> Segmenti & Dijelovi
            </button>

            <button
              onClick={() => setActiveWhTab(5)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all cursor-pointer ${
                activeWhTab === 5
                  ? "bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-extrabold"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
              }`}
            >
              <span className="text-lg">🏢</span> Serviseri & Dobavljači
            </button>

            <button
              onClick={() => setPortalMode("transport")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 mt-4 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Glavni Transport
            </button>
          </div>
        )}
      </nav>

      {/* Administrativne kontrole na dnu sidebara */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-amber-300 hover:bg-slate-200 dark:hover:bg-slate-600 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600 shadow-xs cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          <span>{isDarkMode ? "Svijetla Tema" : "Dark Mode"}</span>
        </button>

        {/* User Card */}
        {activeUser && (
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="bg-blue-200 dark:bg-blue-900/50 p-1.5 rounded-md text-blue-800 dark:text-blue-300 text-sm">
                👤
              </span>
              <div className="overflow-hidden">
                <p className="font-extrabold text-xs text-slate-800 dark:text-slate-200 truncate">
                  {activeUser.fullname || activeUser.username}
                </p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                  {currentRole?.roleName || activeUser.role}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {currentRole?.permissions?.canAccessAdminPanel && (
                <button
                  onClick={onOpenAdminPanel}
                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-bold px-2 py-1.5 rounded-lg transition-colors text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Shield className="w-3 h-3" /> Admin
                </button>
              )}
              <button
                onClick={onOpenPasswordModal}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-bold px-2 py-1.5 rounded-lg transition-colors text-[10px] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Key className="w-3 h-3" /> Šifra
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
