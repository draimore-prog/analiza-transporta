"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Edit3, PlusCircle, Camera, Upload, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { uploadMediaFile } from "@/lib/fileUpload.js";

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
  const [imageUrl, setImageUrl] = useState("");
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);

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
      setImageUrl(initialVehicle.imageUrl || "");
    } else {
      setReg("");
      setGarazniBroj("");
      setTipMehan("Teretna vozila");
      setMarkaVoz("");
      setModelVoz("");
      setGodProizvodnje("");
      setBrojSasije("");
      setStatus("Aktivno");
      setImageUrl("");
    }
  }, [initialVehicle, isOpen]);

  if (!isOpen) return null;

  const isEditMode = Boolean(initialVehicle && initialVehicle.reg);

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImg(true);
    try {
      const res = await uploadMediaFile(file, "vehicles");
      if (res && res.url) {
        setImageUrl(res.url);
      }
    } catch (err) {
      alert("Greška pri učitavanju slike: " + err.message);
    } finally {
      setIsUploadingImg(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
        imageUrl: imageUrl.trim() || "",
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
      <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800 cursor-default">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex justify-between items-center shrink-0">
          <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
            {isEditMode ? (
              <>
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <span>Uređivanje Vozila: {initialVehicle.reg}</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <span>Unos Novog Vozila / Nabavka</span>
              </>
            )}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl font-bold cursor-pointer p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* UPLOAD SLIKE VOZILA */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <label className="block font-black uppercase text-slate-700 dark:text-slate-200 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Slika Vozila</span>
              </span>
              {imageUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-[11px] text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Ukloni sliku
                </button>
              )}
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Preview Slike */}
              <div className="w-28 h-24 sm:w-32 sm:h-28 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center relative shrink-0 shadow-inner">
                {isUploadingImg ? (
                  <div className="flex flex-col items-center gap-1 text-indigo-600 dark:text-indigo-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-[10px] font-bold">Učitavanje...</span>
                  </div>
                ) : imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={reg || "Vozilo"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-400 dark:text-slate-500 gap-1 p-2 text-center">
                    <ImageIcon className="w-6 h-6 opacity-60" />
                    <span className="text-[9px] font-semibold">Nema slike</span>
                  </div>
                )}
              </div>

              {/* Upload Kontrole */}
              <div className="flex-1 w-full space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImg}
                  className="w-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-bold py-2 px-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>{imageUrl ? "Promijeni sliku vozila" : "Izaberi sliku iz galerije / kamere"}</span>
                </button>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Podržani formati: JPG, PNG, WebP. Slika se automatski optimizuje i trajno pohranjuje uz karton vozila.
                </p>
              </div>
            </div>
          </div>

          {/* Glavna Polja Forme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
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
              <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Garažni Broj</label>
              <input
                type="text"
                value={garazniBroj}
                onChange={(e) => setGarazniBroj(e.target.value)}
                placeholder="Npr. 40567"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 font-semibold outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Tip Mehanizacije</label>
              <select
                value={tipMehan}
                onChange={(e) => setTipMehan(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
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
              <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Status Vozila</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="Aktivno">🟢 Aktivno</option>
                <option value="Prodato">🟣 Prodato</option>
                <option value="Rashodovano">🔴 Rashodovano</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Marka / Proizvođač</label>
              <input
                type="text"
                value={markaVoz}
                onChange={(e) => setMarkaVoz(e.target.value)}
                placeholder="Npr. MAN / Mercedes / Linde"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 font-semibold outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Model</label>
              <input
                type="text"
                value={modelVoz}
                onChange={(e) => setModelVoz(e.target.value)}
                placeholder="Npr. TGX 18.440"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 font-semibold outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Godište</label>
              <input
                type="text"
                value={godProizvodnje}
                onChange={(e) => setGodProizvodnje(e.target.value)}
                placeholder="Npr. 2022"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 font-semibold outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Broj Šasije (VIN)</label>
              <input
                type="text"
                value={brojSasije}
                onChange={(e) => setBrojSasije(e.target.value)}
                placeholder="Npr. WMA06XZZ..."
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 font-mono outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Footer Dugmad */}
          <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all cursor-pointer"
            >
              Odustani
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploadingImg}
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
