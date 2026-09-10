"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Check, Shield, Eye, Edit3, Slash } from "lucide-react";
import { isEditablePage, getRolePagePermission } from "@/lib/constants.js";

const ALL_PAGES = [
  // Analitika
  { id: "kpi-pregled", name: "KPI Pregled Flote", category: "analitika", icon: "📊" },
  { id: "analiza-odrzavanja", name: "Analiza Održavanja", category: "analitika", icon: "📈" },
  { id: "yoy-komparacija", name: "YoY Komparacija", category: "analitika", icon: "⚖️" },
  { id: "tco-zamjena", name: "TCO & Zamjena Vozila", category: "analitika", icon: "🔄" },

  // Baza podataka
  { id: "maticna-baza-flote", name: "Matična Baza Voznog Parka", category: "baza-podataka", icon: "🏢" },
  { id: "tabela-servisa", name: "Tabela Servisa & Troškova", category: "baza-podataka", icon: "📋" },

  // Skladišna mehanizacija
  { id: "skladiste-analitika", name: "Analitika & Finansije Skladišta", category: "skladisna-mehanizacija", icon: "📊" },
  { id: "skladiste-sifrarnik", name: "Šifrarnik Mehanizacije (594)", category: "skladisna-mehanizacija", icon: "🚜" },
  { id: "skladiste-opravke", name: "Pregled Svih Opravki", category: "skladisna-mehanizacija", icon: "🔧" },
  { id: "skladiste-segmenti", name: "Segmenti & Dijelovi", category: "skladisna-mehanizacija", icon: "⚡" },
  { id: "skladiste-dobavljaci", name: "Serviseri & Dobavljači", category: "skladisna-mehanizacija", icon: "🏢" },
  { id: "skladiste-nalozi", name: "Radni Nalozi & Pregledi", category: "skladisna-mehanizacija", icon: "📋" },

  // Serviser
  { id: "servisna-radionica", name: "Serviserski Portal", category: "serviser", icon: "🔍" },
  { id: "terenski-nalozi", name: "Terenski Radni Nalozi", category: "serviser", icon: "📱" }
];

const CATEGORY_HEADERS = [
  { id: "analitika", title: "Analitika", icon: "📊", color: "text-blue-600 dark:text-blue-400" },
  { id: "baza-podataka", title: "Baza Podataka", icon: "🗄️", color: "text-emerald-600 dark:text-emerald-400" },
  { id: "skladisna-mehanizacija", title: "Skladišna Mehanizacija", icon: "🚜", color: "text-amber-600 dark:text-amber-400" },
  { id: "serviser", title: "Servisna Radionica", icon: "🔧", color: "text-indigo-600 dark:text-indigo-400" }
];

export function EditRoleModal({
  isOpen,
  onClose,
  role,
  onSaveRole
}) {
  const [roleName, setRoleName] = useState("");
  const [roleIcon, setRoleIcon] = useState("🛡️");
  const [description, setDescription] = useState("");
  const [defaultPage, setDefaultPage] = useState("kpi-pregled");
  const [pagePermissions, setPagePermissions] = useState({});
  const [permissions, setPermissions] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (role) {
      setRoleName(role.roleName || "");
      setRoleIcon(role.roleIcon || "🛡️");
      setDescription(role.description || "");
      setDefaultPage(role.defaultPage || "kpi-pregled");

      // Inicijalizuj dozvole za svaku definisanu stranicu
      const initialPerms = {};
      ALL_PAGES.forEach((page) => {
        initialPerms[page.id] = getRolePagePermission(role, page.id);
      });
      setPagePermissions(initialPerms);
      setPermissions({ ...(role.permissions || {}) });
    }
  }, [role]);

  if (!isOpen || !role) return null;

  const toggleBooleanPage = (pageId) => {
    setPagePermissions((prev) => ({
      ...prev,
      [pageId]: !prev[pageId]
    }));
  };

  const setEditableLevel = (pageId, level) => {
    setPagePermissions((prev) => ({
      ...prev,
      [pageId]: level
    }));
  };

  const togglePermission = (key) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Filtriraj panele koji imaju pristup
      const selectedPanels = ALL_PAGES.filter((p) => {
        const val = pagePermissions[p.id];
        return val === true || val === "view" || val === "edit";
      });

      const updatedRole = {
        roleId: role.roleId,
        roleName: roleName.trim(),
        roleIcon: roleIcon.trim(),
        roleBadge: `${roleIcon.trim()} ${roleName.trim()}`,
        description: description.trim(),
        defaultPage: defaultPage,
        pagePermissions: pagePermissions,
        navigationPanels: selectedPanels,
        permissions: {
          canUploadExcel: !!permissions.canUploadExcel,
          canInputCost: pagePermissions["tabela-servisa"] === "edit" || pagePermissions["skladiste-nalozi"] === "edit",
          canRegisterVehicle: pagePermissions["maticna-baza-flote"] === "edit" || pagePermissions["skladiste-sifrarnik"] === "edit",
          canAccessAdminPanel: !!permissions.canAccessAdminPanel,
          canExportExcel: permissions.canExportExcel !== false,
          canEditCost: pagePermissions["tabela-servisa"] === "edit" || pagePermissions["skladiste-sifrarnik"] === "edit",
          canDeleteCost: pagePermissions["tabela-servisa"] === "edit" || pagePermissions["skladiste-opravke"] === "edit"
        }
      };

      await onSaveRole(updatedRole);
      alert(`Uloga "${updatedRole.roleName}" i njene dozvole su uspješno ažurirane!`);
      onClose();
    } catch (err) {
      alert("Greška pri snimanju uloge: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-slate-900/80 flex justify-center items-center z-[80] backdrop-blur-xs p-4 cursor-pointer">
      <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 cursor-default">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{roleIcon}</span>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                Podešavanje Dozvola: <span className="text-amber-400">{roleName}</span>
              </h3>
              <p className="text-[11px] text-indigo-200">
                Granularne dozvole po tabu (Pregled vs Unos) i početna stranica uloge
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Forma */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs flex-1 bg-slate-50 dark:bg-slate-900/50">
          {/* Osnovni Podaci o Ulozi */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold uppercase text-slate-500 mb-1">Naziv Uloge</label>
              <input
                type="text"
                required
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Ikonica (Emoji)</label>
              <input
                type="text"
                required
                value={roleIcon}
                onChange={(e) => setRoleIcon(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 font-bold text-center outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold uppercase text-slate-500 mb-1">Opis Uloge</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 font-medium outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Početna Stranica (Default)</label>
              <select
                value={defaultPage}
                onChange={(e) => setDefaultPage(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {ALL_PAGES.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.icon} {page.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Granularne Dozvole po Stranicama */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-700 pb-3 gap-1">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>📑</span> Dozvole po Tabovima i Stranicama
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tabovi sa unosom podataka podržavaju: <strong>Bez pristupa</strong>, <strong>Samo pregled (View)</strong> ili <strong>Puni unos & izmjene (Edit)</strong>
                </p>
              </div>
              <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-black bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full shrink-0">
                Granularni RBAC
              </span>
            </div>

            {/* Iteracija po 4 glavne kategorije */}
            {CATEGORY_HEADERS.map((cat) => {
              const pagesInCat = ALL_PAGES.filter((p) => p.category === cat.id);
              if (pagesInCat.length === 0) return null;

              return (
                <div key={cat.id} className="pt-2 border-t border-slate-100 dark:border-slate-700 first:border-t-0 first:pt-0">
                  <p className={`text-[11px] font-black uppercase mb-2 flex items-center gap-1.5 ${cat.color}`}>
                    <span>{cat.icon}</span> <span>{cat.title}</span>
                  </p>

                  <div className="space-y-2">
                    {pagesInCat.map((p) => {
                      const isEditable = isEditablePage(p.id);
                      const currentVal = pagePermissions[p.id];

                      if (isEditable) {
                        // 3-state birač za stranice sa unosom
                        const activeLevel = (currentVal === "edit" || currentVal === "view") ? currentVal : "none";

                        return (
                          <div
                            key={p.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors gap-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-base shrink-0">{p.icon}</span>
                              <div>
                                <span className="font-extrabold text-slate-900 dark:text-slate-100 block">
                                  {p.name}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                  Sadrži akcije unosa, izmjena ili brisanja
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 self-start sm:self-auto">
                              <button
                                type="button"
                                onClick={() => setEditableLevel(p.id, "none")}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer ${
                                  activeLevel === "none"
                                    ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                }`}
                              >
                                <Slash className="w-3 h-3" />
                                <span>Bez pristupa</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditableLevel(p.id, "view")}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer ${
                                  activeLevel === "view"
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300"
                                }`}
                              >
                                <Eye className="w-3 h-3" />
                                <span>Samo Pregled</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditableLevel(p.id, "edit")}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer ${
                                  activeLevel === "edit"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-300"
                                }`}
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Puni Unos (Edit)</span>
                              </button>
                            </div>
                          </div>
                        );
                      } else {
                        // Boolean birač za čiste analitičke / izvještajne stranice
                        const isGranted = Boolean(currentVal);

                        return (
                          <div
                            key={p.id}
                            onClick={() => toggleBooleanPage(p.id)}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-base shrink-0">{p.icon}</span>
                              <div>
                                <span className="font-extrabold text-slate-900 dark:text-slate-100 block">
                                  {p.name}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                  Analitički pregled i vizualizacije
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] font-bold ${isGranted ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                                {isGranted ? "Dozvoljeno" : "Onemogućeno"}
                              </span>
                              <input
                                type="checkbox"
                                checked={isGranted}
                                onChange={() => {}} // kontrolisano klikom na cijeli red
                                className="rounded text-indigo-600 w-4 h-4 cursor-pointer"
                              />
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Administrativne i Sistemske Permisije */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
              <h4 className="font-extrabold text-slate-900 dark:text-white">
                ⚡ Sistemske & Administrativne Dozvole
              </h4>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                Administracija & Export
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { key: "canAccessAdminPanel", title: "⚙️ Admin Panel", desc: "Upravljanje korisnicima i rolama" },
                { key: "canUploadExcel", title: "📥 Excel Uvoz", desc: "Masovni uvoz mjesečnih evidencija" },
                { key: "canExportExcel", title: "📊 Excel Export", desc: "Preuzimanje tabela u XLSX fajl" }
              ].map((perm) => (
                <label
                  key={perm.key}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={!!permissions[perm.key]}
                    onChange={() => togglePermission(perm.key)}
                    className="rounded text-indigo-600 w-4 h-4 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{perm.title}</span>
                    <span className="text-[10px] text-slate-500 block leading-tight">{perm.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Dugmad */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all cursor-pointer"
            >
              Odustani
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isSaving ? "Spremanje..." : "💾 Sačuvaj Dozvole u Firebase"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
