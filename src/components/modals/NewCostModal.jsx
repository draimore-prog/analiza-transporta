"use client";

import React, { useState, useRef } from "react";
import { X, PlusCircle, FileText, Upload, Trash2, Loader2, CheckCircle2, Paperclip } from "lucide-react";
import { uploadMediaFile } from "@/lib/fileUpload.js";

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
  
  // Priloženi račun / faktura
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [invoiceName, setInvoiceName] = useState("");
  const [invoiceType, setInvoiceType] = useState("");
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

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

  const handleInvoiceFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingInvoice(true);
    try {
      const res = await uploadMediaFile(file, "invoices");
      if (res && res.url) {
        setInvoiceUrl(res.url);
        setInvoiceName(res.name || file.name);
        setInvoiceType(res.type || file.type);
      }
    } catch (err) {
      alert("Greška pri učitavanju računa: " + err.message);
    } finally {
      setIsUploadingInvoice(false);
    }
  };

  const handleRemoveInvoice = () => {
    setInvoiceUrl("");
    setInvoiceName("");
    setInvoiceType("");
    if (fileInputRef.current) fileInputRef.current.value = "";
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
        invoiceUrl: invoiceUrl || "",
        invoiceName: invoiceName || "",
        invoiceType: invoiceType || "",
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
        <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-950 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                Unos Novog Troška / Servisnog Naloga
              </h3>
              <p className="text-[11px] text-emerald-200">
                Evidentirajte popravku uz mogućnost prilaganja skena/fotografije računa
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1 bg-slate-50 dark:bg-slate-900/50">
          {/* 1. Podaci o Vozilu */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
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
              <label className="block font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Garažni Broj</label>
              <input
                type="text"
                value={garazniBroj}
                onChange={(e) => setGarazniBroj(e.target.value)}
                placeholder="Npr. 40567"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-semibold outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Tip Mehanizacije</label>
              <select
                value={tipMehan}
                onChange={(e) => setTipMehan(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-semibold outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer"
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
              <label className="block font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Marka & Model</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={markaVoz}
                  onChange={(e) => setMarkaVoz(e.target.value)}
                  placeholder="Marka"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-semibold outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={modelVoz}
                  onChange={(e) => setModelVoz(e.target.value)}
                  placeholder="Model"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-semibold outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* 2. Podaci o Servisu i Trošku */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Datum Intervencije <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Iznos Troška (KM sa PDV) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-black text-emerald-600 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Segment Troška</label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="Mehanika">Mehanika</option>
                <option value="Redovan servis">Redovan servis</option>
                <option value="Guma">Guma</option>
                <option value="Elektronika">Elektronika</option>
                <option value="Hidraulika">Hidraulika</option>
                <option value="Signalizacija">Signalizacija</option>
                <option value="Tečnost">Tečnost</option>
                <option value="Ostalo">Ostalo</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Dobavljač / Serviser</label>
              <input
                type="text"
                value={dobavljac}
                onChange={(e) => setDobavljac(e.target.value)}
                placeholder="Npr. Vlastita radionica, MAN Importer..."
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-semibold outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Opis Radova / Dijelova</label>
              <textarea
                rows={2}
                value={opis}
                onChange={(e) => setOpis(e.target.value)}
                placeholder="Unesite detalje popravke, ugrađene dijelove, broj fakture..."
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* 3. UPLOAD RAČUNA / FAKTURE */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <label className="block font-black uppercase text-slate-700 dark:text-slate-200 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Prilog: Račun / Faktura / Radni Nalog</span>
              </span>
              {invoiceUrl && (
                <button
                  type="button"
                  onClick={handleRemoveInvoice}
                  className="text-[11px] text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Ukloni račun
                </button>
              )}
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleInvoiceFileChange}
              className="hidden"
            />

            {invoiceUrl ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-extrabold text-slate-900 dark:text-white truncate">
                      {invoiceName || "Priloženi Račun"}
                    </p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Račun je spreman za spremanje uz nalog
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 font-bold rounded-lg text-[11px] shadow-2xs cursor-pointer"
                >
                  Zamijeni
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingInvoice}
                className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-400 bg-slate-50 dark:bg-slate-800/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 p-4 rounded-xl transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-center"
              >
                {isUploadingInvoice ? (
                  <div className="flex flex-col items-center gap-1 text-emerald-600">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="font-bold">Učitavanje računa...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      Kliknite ovdje za upload računa (PDF ili Slika)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Podržani formati: PDF, JPG, PNG. Račun se trajno veže za ovaj servisni unos.
                    </span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Footer Dugmad */}
          <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-all cursor-pointer"
            >
              Odustani
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingInvoice}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>{isSubmitting ? "Spremanje naloga..." : "💾 Sačuvaj Trošak u Bazu"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
