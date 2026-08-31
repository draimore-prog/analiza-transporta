"use client";

import React, { useState } from "react";
import { X, PlusCircle } from "lucide-react";

export function NewCostModal({
  isOpen,
  onClose,
  masterFleet,
  onSaveCost,
  activeUser
}) {
  const [reg, setReg] = useState("");
  const [garazniBroj, setGarazniBroj] = useState("");
  const [tipMehan, setTipMehan] = useState("Teretna vozila");
  const [markaVoz, setMarkaVoz] = useState("");
  const [modelVoz, setModelVoz] = useState("");
  const [datum, setDatum] = useState(new Date().toISOString().split("T")[0]);
  const [segment, setSegment] = useState("Mehanika");
  const [opis, setOpis] = useState("");
  const [dobavljac, setDobavljac] = useState("");
  const [cost, setCost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleRegChange = (val) => {
    setReg(val);
    const upper = val.trim().toUpperCase();
    const found = masterFleet.find((v) => v.reg.toUpperCase() === upper || (v.garazniBroj && v.garazniBroj === upper));
    if (found) {
      setReg(found.reg);
      setGarazniBroj(found.garazniBroj || "-");
      setTipMehan(found.tipMehan || "Teretna vozila");
      setMarkaVoz(found.markaVoz || "-");
      setModelVoz(found.modelVoz || "-");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reg.trim() || !cost || parseFloat(cost) <= 0) {
      alert("Molimo unesite registraciju i ispravan iznos troška!");
      return;
    }

    setIsSubmitting(true);
    try {
      const dateObj = new Date(datum);
      const year = isNaN(dateObj.getFullYear()) ? new Date().getFullYear() : dateObj.getFullYear();
      const month = isNaN(dateObj.getMonth()) ? (new Date().getMonth() + 1) : (dateObj.getMonth() + 1);

      const newRecord = {
        reg: reg.trim().toUpperCase(),
        garazniBroj: garazniBroj.trim() || "-",
        tipMehan: tipMehan,
        markaVoz: markaVoz.trim() || "-",
        modelVoz: modelVoz.trim() || "-",
        datum: datum,
        datumObj: dateObj,
        year: year,
        month: month,
        segment: segment,
        opisPopravke: opis.trim(),
        opisRadova: opis.trim(),
        dobavljacOrig: dobavljac.trim() || "Vlastita Radionica",
        dobavljac: dobavljac.trim() || "Vlastita Radionica",
        cost: parseFloat(cost),
        userCreated: activeUser?.username || "admin",
        createdAt: new Date().toISOString()
      };

      await onSaveCost(newRecord);
      alert(`Servisni nalog za vozilo ${reg} je uspješno upisan u bazu podataka!`);
      onClose();
    } catch (err) {
      alert("Greška pri unosu: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-slate-900/80 flex justify-center items-center z-[70] backdrop-blur-xs p-4 cursor-pointer">
      <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 cursor-default">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-950 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                Unos Novog Troška / Servisnog Naloga
              </h3>
              <p className="text-[11px] text-emerald-200">
                Evidentirajte popravku ili račun direktno u Firestore bazu podataka
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

        {/* Forma */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1 bg-slate-50 dark:bg-slate-900/50">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">
                Registracija / Oznaka <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="modalVehicleList"
                required
                value={reg}
                onChange={(e) => handleRegChange(e.target.value)}
                placeholder="Ukucajte reg. ili garažni..."
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <datalist id="modalVehicleList">
                {masterFleet.map((v) => (
                  <option key={v.reg} value={v.reg}>
                    {v.reg} (GB: {v.garazniBroj || "-"} - {v.markaVoz})
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">
                Garažni Broj
              </label>
              <input
                type="text"
                value={garazniBroj}
                onChange={(e) => setGarazniBroj(e.target.value)}
                placeholder="Npr. 40123"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-semibold outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">
                Tip Mehanizacije
              </label>
              <select
                value={tipMehan}
                onChange={(e) => setTipMehan(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-semibold outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
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
              <label className="block font-bold uppercase text-slate-500 mb-1">
                Marka & Model
              </label>
              <input
                type="text"
                value={markaVoz}
                onChange={(e) => setMarkaVoz(e.target.value)}
                placeholder="Npr. MAN / Linde"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-semibold outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">
                Datum Računa / Servisa <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">
                Segment Troška
              </label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-semibold outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="Mehanika">Mehanika</option>
                <option value="Baterije">Baterije</option>
                <option value="Točkovi / Gume">Točkovi / Gume</option>
                <option value="Hidraulika">Hidraulika</option>
                <option value="Elektronika">Elektronika</option>
                <option value="Ulja i filteri">Ulja i filteri</option>
                <option value="Karoserija">Karoserija</option>
                <option value="Registracija / Pregled">Registracija / Pregled</option>
                <option value="Ostalo">Ostalo</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">
                Iznos Troška (KM) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00 KM"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-black text-emerald-600 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold uppercase text-slate-500 mb-1">
                Opis Popravke / Zamijenjeni Dijelovi
              </label>
              <input
                type="text"
                value={opis}
                onChange={(e) => setOpis(e.target.value)}
                placeholder="Npr. Zamjena ulja, filtera, disk pločica..."
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">
                Serviser / Dobavljač
              </label>
              <input
                type="text"
                value={dobavljac}
                onChange={(e) => setDobavljac(e.target.value)}
                placeholder="Npr. Vlastita radionica / Turbo Servis"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Dugmad */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all cursor-pointer"
            >
              Odustani
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? "Spremanje..." : "💾 Sačuvaj Trošak u Bazu"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
