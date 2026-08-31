"use client";

import React, { useState, useEffect } from "react";
import { X, Edit3, PlusCircle } from "lucide-react";

export function EditVehicleModal({
  isOpen,
  onClose,
  onSaveVehicle,
  initialVehicle
}) {
  const [reg, setReg] = useState("");
  const [garazniBroj, setGarazniBroj] = useState("");
  const [tipMehan, setTipMehan] = useState("Teretna vozila");
  const [markaVoz, setMarkaVoz] = useState("");
  const [modelVoz, setModelVoz] = useState("");
  const [godProizvodnje, setGodProizvodnje] = useState("");
  const [brojSasije, setBrojSasije] = useState("");
  const [status, setStatus] = useState("Aktivno");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialVehicle) {
      setReg(initialVehicle.reg || "");
      setGarazniBroj(initialVehicle.garazniBroj && initialVehicle.garazniBroj !== "-" ? initialVehicle.garazniBroj : "");
      setTipMehan(initialVehicle.tipMehan || "Teretna vozila");
      setMarkaVoz(initialVehicle.markaVoz && initialVehicle.markaVoz !== "-" ? initialVehicle.markaVoz : "");
      setModelVoz(initialVehicle.modelVoz && initialVehicle.modelVoz !== "-" ? initialVehicle.modelVoz : "");
      setGodProizvodnje(initialVehicle.godProizvodnje && initialVehicle.godProizvodnje !== "-" ? initialVehicle.godProizvodnje : "");
      setBrojSasije(initialVehicle.brojSasije && initialVehicle.brojSasije !== "-" ? initialVehicle.brojSasije : "");
      setStatus(initialVehicle.status || "Aktivno");
    } else {
      setReg("");
      setGarazniBroj("");
      setTipMehan("Teretna vozila");
      setMarkaVoz("");
      setModelVoz("");
      setGodProizvodnje("");
      setBrojSasije("");
      setStatus("Aktivno");
    }
  }, [initialVehicle, isOpen]);

  if (!isOpen) return null;

  const isEditMode = Boolean(initialVehicle && initialVehicle.reg);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reg.trim()) {
      alert("Registarska oznaka je obavezno polje!");
      return;
    }

    setIsSaving(true);
    try {
      const vObj = {
        reg: reg.trim().toUpperCase(),
        garazniBroj: garazniBroj.trim() || "-",
        tipMehan: tipMehan,
        markaVoz: markaVoz.trim() || "-",
        modelVoz: modelVoz.trim() || "-",
        godProizvodnje: godProizvodnje.trim() || "-",
        brojSasije: brojSasije.trim() || "-",
        status: status,
        updatedAt: new Date().toISOString()
      };

      await onSaveVehicle(vObj);
      alert(`Vozilo ${vObj.reg} je uspješno ${isEditMode ? "ažurirano" : "sačuvano"} u bazi!`);
      onClose();
    } catch (err) {
      alert("Greška pri spremanju vozila: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-slate-900/80 flex justify-center items-center z-[90] backdrop-blur-xs p-4 animate-in fade-in duration-200 cursor-pointer">
      <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800 p-6 sm:p-7 cursor-default">
        <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            {isEditMode ? (
              <>
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <span>Uređivanje Podataka Vozila: {initialVehicle.reg}</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <span>Unos Novog Vozila / Nabavka</span>
              </>
            )}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl font-bold cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">
                Registarska Oznaka <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={reg}
                onChange={(e) => setReg(e.target.value)}
                placeholder="Npr. A12-K-345"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Garažni Broj</label>
              <input
                type="text"
                value={garazniBroj}
                onChange={(e) => setGarazniBroj(e.target.value)}
                placeholder="Npr. 40567"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 font-semibold outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Tip Mehanizacije</label>
              <select
                value={tipMehan}
                onChange={(e) => setTipMehan(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Teretna vozila">Teretna vozila</option>
                <option value="Skladišna mehanizacija">Skladišna mehanizacija</option>
                <option value="Putnička vozila">Putnička vozila</option>
                <option value="Priključna vozila">Priključna vozila</option>
                <option value="Radna mašina">Radna mašina</option>
                <option value="Servis motornih vozila">Servis motornih vozila</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Status Vozila</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Aktivno">🟢 Aktivno</option>
                <option value="Prodato">🟣 Prodato</option>
                <option value="Rashodovano">🔴 Rashodovano</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Marka / Proizvođač</label>
              <input
                type="text"
                value={markaVoz}
                onChange={(e) => setMarkaVoz(e.target.value)}
                placeholder="Npr. MAN / Mercedes / Linde"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 font-semibold outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Model</label>
              <input
                type="text"
                value={modelVoz}
                onChange={(e) => setModelVoz(e.target.value)}
                placeholder="Npr. TGX 18.440"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 font-semibold outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Godište</label>
              <input
                type="text"
                value={godProizvodnje}
                onChange={(e) => setGodProizvodnje(e.target.value)}
                placeholder="Npr. 2022"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 font-semibold outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Broj Šasije (VIN)</label>
              <input
                type="text"
                value={brojSasije}
                onChange={(e) => setBrojSasije(e.target.value)}
                placeholder="Npr. WMA06XZZ..."
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 font-mono outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all cursor-pointer"
            >
              Odustani
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>{isSaving ? "Spremanje..." : isEditMode ? "💾 Sačuvaj Izmjene" : "➕ Sačuvaj Novo Vozilo"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
