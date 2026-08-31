"use client";

import React from "react";
import { ClockWidget } from "./ClockWidget.jsx";
import { 
  BarChart3, 
  TrendingUp, 
  RefreshCw, 
  Wrench, 
  Truck, 
  Moon, 
  Sun, 
  ShieldCheck, 
  Key, 
  Zap, 
  Building2,
  Boxes
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
  const allowedPanelIds = new Set((currentRole?.navigationPanels || []).map(p => p.id));

  return (
    <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col h-screen flex-shrink-0 z-20 transition-all duration-300">
      {/* Title */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {portalMode === "warehouse" ? "Skladišna Mehanizacija" : "Servis motornih vozila"}
          <span className="block text-blue-600 dark:text-blue-400 text-xs font-bold mt-1">
            {portalMode === "warehouse" ? "Održavanje viljuškara i baterija" : "Održavanje voznog parka"}
          </span>
        </h1>
      </div>

      {/* Clock */}
      <ClockWidget />

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {portalMode === "transport" ? (
          <>
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 mt-2">
              Nadzorna ploča
            </div>

            {allowedPanelIds.has("tab1") && (
              <button
                onClick={() => setActiveTab(1)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all ${
                  activeTab === 1
                    ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
                }`}
              >
                <BarChart3 className="w-5 h-5 opacity-80" /> Pregled Flote & KPI
              </button>
            )}

            {allowedPanelIds.has("tab2") && (
              <button
                onClick={() => setActiveTab(2)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all ${
                  activeTab === 2
                    ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
                }`}
              >
                <TrendingUp className="w-5 h-5 opacity-80" /> Analiza Održavanja
              </button>
            )}

            {allowedPanelIds.has("tab3") && (
              <button
                onClick={() => setActiveTab(3)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all ${
                  activeTab === 3
                    ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
                }`}
              >
                <RefreshCw className="w-5 h-5 opacity-80" /> YoY Komparacija
              </button>
            )}

            {allowedPanelIds.has("tab4") && (
              <button
                onClick={() => setActiveTab(4)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all ${
                  activeTab === 4
                    ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
                }`}
              >
                <Wrench className="w-5 h-5 opacity-80" /> Tabela Servisa
              </button>
            )}

            {allowedPanelIds.has("tab5") && (
              <button
                onClick={() => setActiveTab(5)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all ${
                  activeTab === 5
                    ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
                }`}
              >
                <Truck className="w-5 h-5 opacity-80" /> Matična baza podataka
              </button>
            )}

            {/* Switch to Warehouse if permitted */}
            {currentRole?.permissions?.canSwitchPortal && (
              <button
                onClick={() => setPortalMode("warehouse")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 border border-amber-200 dark:border-amber-800 mt-4 cursor-pointer"
              >
                <Boxes className="w-5 h-5" /> Skladišna Mehanizacija
              </button>
            )}
          </>
        ) : (
          /* Skladišna Mehanizacija Nav */
          <>
            <div className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider mb-3 mt-2">
              Skladišna Mehanizacija
            </div>

            {allowedPanelIds.has("wh1") && (
              <button
                onClick={() => setActiveWhTab(1)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all ${
                  activeWhTab === 1
                    ? "bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
                }`}
              >
                <BarChart3 className="w-5 h-5" /> Analitika & Finansije
              </button>
            )}

            {allowedPanelIds.has("wh2") && (
              <button
                onClick={() => setActiveWhTab(2)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all ${
                  activeWhTab === 2
                    ? "bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
                }`}
              >
                <Truck className="w-5 h-5" /> Šifrarnik Flote (594)
              </button>
            )}

            {allowedPanelIds.has("wh3") && (
              <button
                onClick={() => setActiveWhTab(3)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all ${
                  activeWhTab === 3
                    ? "bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
                }`}
              >
                <Wrench className="w-5 h-5" /> Pregled Svih Opravki
              </button>
            )}

            {allowedPanelIds.has("wh4") && (
              <button
                onClick={() => setActiveWhTab(4)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all ${
                  activeWhTab === 4
                    ? "bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
                }`}
              >
                <Zap className="w-5 h-5" /> Segmenti & Dijelovi
              </button>
            )}

            {allowedPanelIds.has("wh5") && (
              <button
                onClick={() => setActiveWhTab(5)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all ${
                  activeWhTab === 5
                    ? "bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
                }`}
              >
                <Building2 className="w-5 h-5" /> Serviseri & Dobavljači
              </button>
            )}

            {/* Back to Transport if permitted */}
            {currentRole?.permissions?.canSwitchPortal && (
              <button
                onClick={() => setPortalMode("transport")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 mt-4 cursor-pointer"
              >
                <Truck className="w-5 h-5" /> Glavni Transport
              </button>
            )}
          </>
        )}
      </nav>

      {/* Bottom Administrative Controls */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-amber-300 hover:bg-slate-200 dark:hover:bg-slate-600 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600 shadow-sm cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          <span>{isDarkMode ? "Svijetla Tema" : "Tamna Tema"}</span>
        </button>

        {/* User Card */}
        {activeUser && (
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="bg-blue-200 dark:bg-blue-900/50 p-1.5 rounded-md text-blue-800 dark:text-blue-300">
                👤
              </span>
              <div className="overflow-hidden">
                <p className="font-extrabold text-xs text-slate-800 dark:text-slate-200 truncate">
                  {activeUser.fullname || activeUser.username}
                </p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono truncate">
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
                  <ShieldCheck className="w-3.5 h-3.5" /> Admin
                </button>
              )}
              <button
                onClick={onOpenPasswordModal}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-bold px-2 py-1.5 rounded-lg transition-colors text-[10px] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" /> Šifra
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
