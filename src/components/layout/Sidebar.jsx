"use client";

import React from "react";
import { ClockWidget } from "./ClockWidget.jsx";
import {
  Truck,
  Shield,
  Key,
  Sun,
  Moon,
  ChevronLeft,
  LogOut
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
  onOpenPasswordModal,
  onLogout
}) {
  return (
    <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-between flex-shrink-0 z-20 shadow-sm transition-colors duration-200 h-full">
      {/* Gornji dio Sidebara */}
      <div className="p-4 flex flex-col gap-4">
        {/* Brending & Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-700 to-indigo-600 text-white p-2.5 rounded-xl shadow-md flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 dark:text-white leading-tight tracking-tight uppercase">
              Analiza Transporta
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-none mt-0.5">
              Servis motornih vozila
            </p>
          </div>
        </div>

        {/* Live sat & kalendar widget */}
        <ClockWidget />
      </div>

      {/* Navigacija */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-1">
        {portalMode === "transport" ? (
          /* Glavni Transport Meni - V1 Originalni Nazivi */
          <>
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Nadzorna ploča
            </div>

            {/* Tab 1: KPI Pregled */}
            <button
              onClick={() => setActiveTab(1)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all cursor-pointer ${
                activeTab === 1
                  ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-extrabold"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
              }`}
            >
              <span className="text-base">📊</span>
              <span>KPI Pregled</span>
            </button>

            {/* Tab 2: Analiza Održavanja */}
            <button
              onClick={() => setActiveTab(2)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all cursor-pointer ${
                activeTab === 2
                  ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-extrabold"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
              }`}
            >
              <span className="text-base">📈</span>
              <span>Analiza Održavanja</span>
            </button>

            {/* Tab 3: YoY Komparacija & KPI Mjesečni */}
            <button
              onClick={() => setActiveTab(3)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all cursor-pointer ${
                activeTab === 3
                  ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-extrabold"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
              }`}
            >
              <span className="text-base">⚖️</span>
              <span>YoY Komparacija & KPI Mjesečni</span>
            </button>

            {/* Tab 4: Tabela Servisa */}
            <button
              onClick={() => setActiveTab(4)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all cursor-pointer ${
                activeTab === 4
                  ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-extrabold"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
              }`}
            >
              <span className="text-base">📋</span>
              <span>Tabela Servisa</span>
            </button>

            {/* Tab 5: Matična baza podataka voznog parka */}
            <button
              onClick={() => setActiveTab(5)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all cursor-pointer ${
                activeTab === 5
                  ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-extrabold"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
              }`}
            >
              <span className="text-base">🏢</span>
              <span>Matična baza podataka voznog parka</span>
            </button>

            {/* Skladišna Mehanizacija Prečica */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 mt-3">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Posebni Portali
              </div>
              <button
                onClick={() => setPortalMode("warehouse")}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-bold bg-amber-50/80 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 transition-all cursor-pointer"
              >
                <span>🏗️</span>
                <span>Skladišna Mehanizacija</span>
              </button>
            </div>
          </>
        ) : (
          /* Skladišna Mehanizacija Meni - V1 Originalni Nazivi */
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider mb-2">
              Skladišna Mehanizacija
            </div>

            <button
              onClick={() => setActiveWhTab(1)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all cursor-pointer ${
                activeWhTab === 1
                  ? "bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-extrabold"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
              }`}
            >
              <span className="text-base">📊</span>
              <span>Analitika & Finansije</span>
            </button>

            <button
              onClick={() => setActiveWhTab(2)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all cursor-pointer ${
                activeWhTab === 2
                  ? "bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-extrabold"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
              }`}
            >
              <span className="text-base">🚜</span>
              <span>Šifrarnik Flote (594)</span>
            </button>

            <button
              onClick={() => setActiveWhTab(3)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all cursor-pointer ${
                activeWhTab === 3
                  ? "bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-extrabold"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
              }`}
            >
              <span className="text-base">🔧</span>
              <span>Pregled Svih Opravki</span>
            </button>

            <button
              onClick={() => setActiveWhTab(4)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all cursor-pointer ${
                activeWhTab === 4
                  ? "bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-extrabold"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
              }`}
            >
              <span className="text-base">⚡</span>
              <span>Segmenti & Dijelovi</span>
            </button>

            <button
              onClick={() => setActiveWhTab(5)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all cursor-pointer ${
                activeWhTab === 5
                  ? "bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-extrabold"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
              }`}
            >
              <span className="text-base">🏢</span>
              <span>Serviseri & Dobavljači</span>
            </button>

            <button
              onClick={() => setPortalMode("transport")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-bold transition-all text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 mt-4 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Glavni Transport
            </button>
          </div>
        )}
      </nav>

      {/* Administrativne kontrole na dnu sidebara */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-900/30">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
          <span>{isDarkMode ? "Svijetla Tema" : "Dark Mode"}</span>
        </button>

        {/* User Card sa odjavom */}
        {activeUser && (
          <div className="mt-1 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="bg-blue-100 dark:bg-blue-900/50 p-1.5 rounded-md text-blue-800 dark:text-blue-300 text-xs">
                👤
              </span>
              <div className="overflow-hidden flex-1">
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
              onClick={onLogout}
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
