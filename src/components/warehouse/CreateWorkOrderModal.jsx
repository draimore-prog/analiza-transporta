"use client";

import React, { useState, useMemo } from "react";
import { X, Search, PlusCircle, AlertCircle, Wrench, Shield, Check } from "lucide-react";

export function CreateWorkOrderModal({
  isOpen,
  onClose,
  warehouseMasterFleet = [],
  onCreateWorkOrder,
  activeUser
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [orderType, setOrderType] = useState("preventive");
  const [priority, setPriority] = useState("normal");
  const [assignedTo, setAssignedTo] = useState("");
  const [instructions, setInstructions] = useState("");
  const [workHours, setWorkHours] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Pretraga mehanizacije za brzi odabir
  const filteredVehicles = useMemo(() => {
    if (!searchTerm.trim()) return warehouseMasterFleet.slice(0, 10);
    const term = searchTerm.toLowerCase();

    return warehouseMasterFleet
      .filter((v) => {
        const id = (v.reg || "").toLowerCase();
        const tip = (v.tipMehan || "").toLowerCase();
        const marka = (v.markaVoz || "").toLowerCase();
        const model = (v.modelVoz || "").toLowerCase();
        const sasija = (v.brojSasije || "").toLowerCase();
        const lok = (v.poslovnaJedinica || "").toLowerCase();

        return (
          id.includes(term) ||
          tip.includes(term) ||
          marka.includes(term) ||
          model.includes(term) ||
          sasija.includes(term) ||
          lok.includes(term)
        );
      })
      .slice(0, 10);
  }, [warehouseMasterFleet, searchTerm]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) {
      setError("Molimo odaberite jedinicu skladišne mehanizacije!");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await onCreateWorkOrder({
        status: "pending",
        type: orderType,
        priority: priority,
        assignedTo: assignedTo.trim() || "Interni serviser",
        createdBy: activeUser?.fullname || activeUser?.username || "Voditelj mehanizacije",
        vehicleId: selectedVehicle.reg || "",
        vehicleDetails: {
          tip: selectedVehicle.tipMehan || "Skladišna mehanizacija",
          proizvodjac: selectedVehicle.markaVoz || "",
          model: selectedVehicle.modelVoz || "",
          serijskiBroj: selectedVehicle.brojSasije || "",
          lokacija: selectedVehicle.poslovnaJedinica || ""
        },
        workHours: Number(workHours) || 0,
        workDescription: instructions.trim(),
        checklist: {},
        usedMaterials: "",
        photos: {}
      });

      onClose();
    } catch (err) {
      setError("Došlo je do greške pri kreiranju radnog naloga.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex justify-center items-center z-[9995] p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 rounded-xl border border-blue-500/40 text-blue-400">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Kreiraj & Dodijeli Radni Nalog</h2>
              <p className="text-xs text-slate-400">Dispečing zadatka serviseru skladišne mehanizacije</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded-xl font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Odabir Mašine */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
              1. Odaberi Mehanizaciju (Pretraga po ID, Tipu ili Lokaciji)
            </label>
            <div className="relative mb-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Unesite ID viljuškara (npr. SM-042), model ili poslovnu jedinicu..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {/* Lista rezultata pretrage */}
            <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-1">
              {filteredVehicles.map((v) => {
                const isSelected = selectedVehicle?.reg === v.reg;
                return (
                  <div
                    key={v.reg}
                    onClick={() => {
                      setSelectedVehicle(v);
                      setError("");
                    }}
                    className={`p-2 rounded-lg flex items-center justify-between cursor-pointer text-xs transition-colors ${
                      isSelected
                        ? "bg-blue-100 dark:bg-blue-900/60 border border-blue-300 dark:border-blue-700 font-bold"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div>
                      <span className="font-mono font-black text-blue-700 dark:text-blue-400 mr-2">{v.reg}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {v.tipMehan} • {v.markaVoz} {v.modelVoz}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{v.poslovnaJedinica}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Odabrana jedinica - info kartica */}
          {selectedVehicle && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">
                  Odabrana jedinica za servis:
                </span>
                <strong className="text-slate-900 dark:text-white">
                  {selectedVehicle.reg} — {selectedVehicle.markaVoz} {selectedVehicle.modelVoz} ({selectedVehicle.poslovnaJedinica})
                </strong>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
                className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
              >
                Promijeni
              </button>
            </div>
          )}

          {/* Tip Naloga & Prioritet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                2. Vrsta Radnog Naloga
              </label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold outline-none text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="preventive">🛡️ Redovni preventivni pregled</option>
                <option value="corrective">⚠️ Vanredni servis / Prijava kvara</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                3. Prioritet Naloga
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold outline-none text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">Normalan prioritet</option>
                <option value="urgent">⚡ Hitno (Potreban pregled isti dan)</option>
                <option value="critical">🚨 Kritično (Viljuškar van funkcije)</option>
              </select>
            </div>
          </div>

          {/* Serviser & Radni Sati */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                4. Zaduženi Serviser
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Ime servisera ili naziv servisa..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold outline-none text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Zadnje Poznati Radni Sati (Opcionalno)
              </label>
              <input
                type="number"
                value={workHours}
                onChange={(e) => setWorkHours(e.target.value)}
                placeholder="Unesite radne sate (MTH)..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold outline-none text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Opis Zadatka / Kvara */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
              5. Opis Zadatka / Uputstvo Za Servisera
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="Unesite opis kvara, zahtjev skladištara ili uputstvo za redovni pregled..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-medium outline-none text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Odustani
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <PlusCircle className="w-4 h-4" />
              )}
              <span>Kreiraj & Pošalji Nalog</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
