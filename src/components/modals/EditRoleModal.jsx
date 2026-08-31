"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

const ALL_AVAILABLE_PANELS = [
  { id: "tab1", name: "Pregled Flote & KPI", portal: "transport", icon: "📊", tabId: 1 },
  { id: "tab2", name: "Analiza Održavanja", portal: "transport", icon: "📈", tabId: 2 },
  { id: "tab3", name: "YoY Komparacija", portal: "transport", icon: "🔄", tabId: 3 },
  { id: "tab4", name: "Tabela Servisa", portal: "transport", icon: "🔧", tabId: 4 },
  { id: "tab5", name: "Matična baza podataka", portal: "transport", icon: "🚛", tabId: 5 },
  { id: "wh1", name: "Analitika & Finansije", portal: "warehouse", icon: "📊", tabId: 1 },
  { id: "wh2", name: "Šifrarnik Flote (594)", portal: "warehouse", icon: "🚜", tabId: 2 },
  { id: "wh3", name: "Pregled Svih Opravki", portal: "warehouse", icon: "🔧", tabId: 3 },
  { id: "wh4", name: "Segmenti & Dijelovi", portal: "warehouse", icon: "⚡", tabId: 4 },
  { id: "wh5", name: "Serviseri & Dobavljači", portal: "warehouse", icon: "🏢", tabId: 5 },
  { id: "serviserSearch", name: "Karton Vozila / Pretraga", portal: "serviser", icon: "🔍", tabId: 1 }
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
  const [defaultPortal, setDefaultPortal] = useState("transport");
  const [selectedPanelIds, setSelectedPanelIds] = useState(new Set());
  const [permissions, setPermissions] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (role) {
      setRoleName(role.roleName || "");
      setRoleIcon(role.roleIcon || "🛡️");
      setDescription(role.description || "");
      setDefaultPortal(role.defaultPortal || "transport");
      setSelectedPanelIds(new Set((role.navigationPanels || []).map((p) => p.id)));
      setPermissions({ ...(role.permissions || {}) });
    }
  }, [role]);

  if (!isOpen || !role) return null;

  const togglePanel = (panelId) => {
    setSelectedPanelIds((prev) => {
      const next = new Set(prev);
      if (next.has(panelId)) next.delete(panelId);
      else next.add(panelId);
      return next;
    });
  };

  const togglePermission = (key) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const selectedPanels = ALL_AVAILABLE_PANELS.filter((p) => selectedPanelIds.has(p.id));
      const allowedPortalsSet = new Set();
      selectedPanels.forEach((p) => allowedPortalsSet.add(p.portal));
      if (allowedPortalsSet.size === 0) allowedPortalsSet.add(defaultPortal);

      const updatedRole = {
        roleId: role.roleId,
        roleName: roleName.trim(),
        roleIcon: roleIcon.trim(),
        roleBadge: `${roleIcon.trim()} ${roleName.trim()}`,
        description: description.trim(),
        defaultPortal: defaultPortal,
        allowedPortals: Array.from(allowedPortalsSet),
        navigationPanels: selectedPanels,
        permissions: {
          canUploadExcel: !!permissions.canUploadExcel,
          canInputCost: !!permissions.canInputCost,
          canRegisterVehicle: !!permissions.canRegisterVehicle,
          canAccessAdminPanel: !!permissions.canAccessAdminPanel,
          canSwitchPortal: !!permissions.canSwitchPortal,
          canExportExcel: !!permissions.canExportExcel,
          canEditCost: !!permissions.canEditCost,
          canDeleteCost: !!permissions.canDeleteCost
        }
      };

      await onSaveRole(updatedRole);
      alert(`Uloga "${updatedRole.roleName}" i njena prava su uspješno ažurirani na Firebase bazi!`);
      onClose();
    } catch (err) {
      alert("Greška pri snimanju uloge: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-slate-900/80 flex justify-center items-center z-[80] backdrop-blur-xs p-4 cursor-pointer">
      <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 cursor-default">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{roleIcon}</span>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                Uređivanje Uloge: <span className="text-amber-400">{roleName}</span>
              </h3>
              <p className="text-[11px] text-indigo-200">
                Dinamičko podešavanje navigacijskih panela i prava pristupa u Firestore-u
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
          {/* Metadata */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold uppercase text-slate-500 mb-1">Naziv Uloge</label>
              <input
                type="text"
                required
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Ikonica (Emoji)</label>
              <input
                type="text"
                required
                value={roleIcon}
                onChange={(e) => setRoleIcon(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-bold text-center outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold uppercase text-slate-500 mb-1">Opis Uloge</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-medium outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Default Portal</label>
              <select
                value={defaultPortal}
                onChange={(e) => setDefaultPortal(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="transport">🚛 Glavni Transport</option>
                <option value="warehouse">🏗️ Skladišna Mehanizacija</option>
                <option value="serviser">🔧 Serviser (Karton)</option>
              </select>
            </div>
          </div>

          {/* Navigacijski Paneli */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
              <h4 className="font-extrabold text-slate-900 dark:text-white">
                📑 Dozvoljeni Navigacijski Paneli & Tabovi
              </h4>
              <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                Odaberite tabove vidljive ovoj ulozi
              </span>
            </div>

            {/* Transport tabovi */}
            <div>
              <p className="text-[10px] font-extrabold text-blue-700 dark:text-blue-400 uppercase mb-1.5">
                🚛 Glavni Transportni Portal:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_AVAILABLE_PANELS.filter((p) => p.portal === "transport").map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPanelIds.has(p.id)}
                      onChange={() => togglePanel(p.id)}
                      className="rounded text-indigo-600 w-4 h-4"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {p.icon} {p.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Skladišni tabovi */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 uppercase mb-1.5">
                🏗️ Skladišna Mehanizacija:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_AVAILABLE_PANELS.filter((p) => p.portal === "warehouse").map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPanelIds.has(p.id)}
                      onChange={() => togglePanel(p.id)}
                      className="rounded text-amber-600 w-4 h-4"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {p.icon} {p.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Serviser */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-extrabold text-slate-500 uppercase mb-1.5">
                🔧 Servisna Radionica:
              </p>
              {ALL_AVAILABLE_PANELS.filter((p) => p.portal === "serviser").map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPanelIds.has(p.id)}
                    onChange={() => togglePanel(p.id)}
                    className="rounded text-indigo-600 w-4 h-4"
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {p.icon} {p.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Akcijske Dozvole */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
              <h4 className="font-extrabold text-slate-900 dark:text-white">
                ⚡ Akcijska Prava & Permisije
              </h4>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                Dozvole unosa, izmjena i admin pristupa
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { key: "canUploadExcel", title: "📥 Excel Upload", desc: "Uvoz Excel evidencija" },
                { key: "canInputCost", title: "➕ Unos Troška", desc: "Ručni unos naloga i servisa" },
                { key: "canRegisterVehicle", title: "🚛 Registracija Vozila", desc: "Unos novih vozila u bazu" },
                { key: "canAccessAdminPanel", title: "⚙️ Pristup Admin Panelu", desc: "Upravljanje korisnicima i ulogama" },
                { key: "canSwitchPortal", title: "🔄 Portal Switcher", desc: "Prebacivanje Transport / Skladište" },
                { key: "canExportExcel", title: "📊 Excel Export", desc: "Preuzimanje tabela u XLSX" },
                { key: "canEditCost", title: "✏️ Uređivanje Troškova", desc: "Izmjena unesenih servisa" },
                { key: "canDeleteCost", title: "🗑️ Brisanje Troškova", desc: "Uklanjanje stavki iz baze" }
              ].map((perm) => (
                <label
                  key={perm.key}
                  className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={!!permissions[perm.key]}
                    onChange={() => togglePermission(perm.key)}
                    className="rounded text-indigo-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{perm.title}</span>
                    <span className="text-[10px] text-slate-500">{perm.desc}</span>
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
