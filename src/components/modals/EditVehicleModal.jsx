"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Edit3,
  PlusCircle,
  Camera,
  Upload,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Star,
  Maximize2,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { uploadVehicleImages } from "@/lib/fileUpload.js";
import { normalizeVehicleStatus } from "@/lib/calculations.js";

const MAX_IMAGES = 10;

export function EditVehicleModal({
  isOpen,
  onClose,
  onSaveVehicle,
  onDeleteVehicle,
  activeUser,
  currentRole,
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

  // Galerija slika (do 10 slika)
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [previewLightboxImg, setPreviewLightboxImg] = useState(null);
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
      setStatus(normalizeVehicleStatus(initialVehicle.status));

      // Inicijalizacija niza slika
      if (Array.isArray(initialVehicle.images) && initialVehicle.images.length > 0) {
        setImages(
          initialVehicle.images.map((img, idx) => ({
            url: typeof img === "string" ? img : img.url,
            name: (typeof img === "object" && img.name) ? img.name : `Slika ${idx + 1}`,
            storageType: (typeof img === "object" && img.storageType) ? img.storageType : "firebase"
          })).filter((img) => Boolean(img.url))
        );
      } else if (initialVehicle.imageUrl) {
        setImages([
          {
            url: initialVehicle.imageUrl,
            name: "Glavna fotografija",
            storageType: "firebase"
          }
        ]);
      } else {
        setImages([]);
      }
    } else {
      setReg("");
      setGarazniBroj("");
      setTipMehan("Teretna vozila");
      setMarkaVoz("");
      setModelVoz("");
      setGodProizvodnje("");
      setBrojSasije("");
      setStatus("Aktivno");
      setImages([]);
    }
  }, [initialVehicle, isOpen]);

  if (!isOpen) return null;

  const isEditMode = !!initialVehicle;

  const isSuperadmin =
    activeUser?.role === "superadmin" ||
    currentRole?.roleId === "superadmin" ||
    activeUser?.username === "emir.durakovic";

  // Upload jedne ili više slika (do 10 ukupno) na Firebase Storage
  const handleFileSelection = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentCount = images.length;
    const remainingSlots = MAX_IMAGES - currentCount;

    if (remainingSlots <= 0) {
      alert(`Dostigli ste maksimalan limit od ${MAX_IMAGES} slika za ovo vozilo.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    let filesToUpload = files;
    if (files.length > remainingSlots) {
      alert(`Odabrali ste ${files.length} slika. Zbog limita od ${MAX_IMAGES} slika, biće učitano prvih ${remainingSlots}.`);
      filesToUpload = files.slice(0, remainingSlots);
    }

    setIsUploading(true);
    setUploadProgress(`Priprema i kompresija ${filesToUpload.length} slika...`);

    try {
      const currentReg = reg.trim().toUpperCase() || initialVehicle?.reg || "novo_vozilo";
      const uploaded = await uploadVehicleImages(filesToUpload, currentReg, (prog) => {
        setUploadProgress(`Učitavanje slike ${prog.current} od ${prog.total} na Firebase Storage...`);
      });

      if (uploaded.length > 0) {
        setImages((prev) => [...prev, ...uploaded].slice(0, MAX_IMAGES));
      }
    } catch (err) {
      alert("Greška pri učitavanju slika na Firebase Storage: " + (err.message || err));
    } finally {
      setIsUploading(false);
      setUploadProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Uklanjanje pojedinačne slike
  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Postavljanje odabrane slike kao glavne (premješta je na prvu poziciju)
  const handleSetPrimary = (index) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return copy;
    });
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
        // Čuvanje niza slika i primarne slike
        images: images,
        imageUrl: images[0]?.url || "",
        updatedAt: new Date().toISOString()
      };

      await onSaveVehicle(vObj);
      alert(`Vozilo ${vObj.reg} sa ${images.length} slika je uspješno ${isEditMode ? "ažurirano" : "sačuvano"} u bazi!`);
      onClose();
    } catch (err) {
      alert("Greška pri spremanju vozila: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/80 flex justify-center items-center z-[90] backdrop-blur-xs p-4 animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800 cursor-default"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex justify-between items-center shrink-0">
          <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
            {isEditMode ? (
              <>
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <span>Uređivanje vozila: {initialVehicle.reg}</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <span>Unos novog vozila u matičnu bazu</span>
              </>
            )}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* UPLOAD I GALERIJA SLIKA (DO 10 SLIKA) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <label className="font-black uppercase text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Fotografije vozila (maksimalno {MAX_IMAGES} slika)</span>
              </label>
              <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                images.length >= MAX_IMAGES
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
              }`}>
                {images.length} / {MAX_IMAGES} slika
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
              Fotografije se automatski optimizuju i trajno pohranjuju u <strong>Firebase Storage</strong>. Prva slika sa oznakom zvjezdice služi kao naslovna.
            </p>

            {/* Dugme za odabir slika */}
            <div className="mb-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelection}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || images.length >= MAX_IMAGES}
                className="w-full bg-white dark:bg-slate-850 hover:bg-indigo-50 dark:hover:bg-slate-800 border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-slate-800 dark:text-slate-200 font-bold py-3 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs">{uploadProgress || "Učitavanje slika na Firebase Storage..."}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>
                      {images.length === 0
                        ? "Odaberi slike vozila (podržano više odjednom do 10)"
                        : images.length < MAX_IMAGES
                        ? `+ Dodaj još slika (preostalo ${MAX_IMAGES - images.length} mjesta)`
                        : "Popunjen limit od 10 slika"}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Grid pregled slika (Galerija) */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                {images.map((img, idx) => {
                  const isPrimary = idx === 0;
                  return (
                    <div
                      key={img.url + idx}
                      className={`relative group rounded-xl overflow-hidden border-2 bg-slate-900 aspect-4/3 flex items-center justify-center shadow-xs transition-all ${
                        isPrimary
                          ? "border-amber-400 ring-2 ring-amber-400/40"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.name || `Slika ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Bedž za naslovnu sliku */}
                      {isPrimary && (
                        <div className="absolute top-1 left-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-md">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>Glavna</span>
                        </div>
                      )}

                      {/* Redni broj */}
                      <div className="absolute bottom-1 left-1 bg-black/70 text-white font-mono text-[9px] px-1.5 py-0.2 rounded">
                        #{idx + 1}
                      </div>

                      {/* Akcije na slici */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(idx)}
                            className="p-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow cursor-pointer transition-transform hover:scale-110"
                            title="Postavi kao naslovnu / glavnu sliku"
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setPreviewLightboxImg(img.url)}
                          className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow cursor-pointer transition-transform hover:scale-110"
                          title="Uvećaj sliku"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow cursor-pointer transition-transform hover:scale-110"
                          title="Ukloni sliku"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Glavna Polja Forme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Registarska oznaka <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isEditMode}
                value={reg}
                onChange={(e) => setReg(e.target.value.toUpperCase())}
                placeholder="Npr. M23-E-123"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Garažni broj</label>
              <input
                type="text"
                value={garazniBroj}
                onChange={(e) => setGarazniBroj(e.target.value)}
                placeholder="Npr. 104"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Tip mehanizacije</label>
              <select
                value={tipMehan}
                onChange={(e) => setTipMehan(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="Teretna vozila">🚚 Teretna vozila</option>
                <option value="Dostavna vozila">🚐 Dostavna vozila</option>
                <option value="Priključna vozila">🚛 Priključna vozila</option>
                <option value="Putnička vozila">🚗 Putnička vozila</option>
                <option value="Skladišna mehanizacija">🚜 Skladišna mehanizacija</option>
                <option value="Radna mašina">🏗️ Radna mašina</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Status</label>
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
              <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Marka / proizvođač</label>
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
              <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">Broj šasije (VIN)</label>
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
          <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <div>
              {isEditMode && isSuperadmin && onDeleteVehicle && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm(`Da li ste sigurni da želite TRAJNO obrisati vozilo "${reg}" iz baze podataka?`)) {
                      await onDeleteVehicle(reg);
                      onClose();
                    }
                  }}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-extrabold rounded-xl border border-rose-200 dark:border-rose-900/60 transition-all cursor-pointer flex items-center gap-1.5 text-xs"
                  title="Trajno obriši vozilo iz baze (samo Superadmin)"
                >
                  <Trash2 className="w-4 h-4" /> Obriši vozilo
                </button>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all cursor-pointer"
              >
                Odustani
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>{isSaving ? "Spremanje..." : isEditMode ? "💾 Sačuvaj izmjene" : "➕ Sačuvaj novo vozilo"}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Lightbox za uvećani pregled slike */}
        {previewLightboxImg && (
          <div
            onClick={() => setPreviewLightboxImg(null)}
            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-150"
          >
            <div className="relative max-w-4xl max-h-[85vh] flex flex-col items-center">
              <button
                onClick={() => setPreviewLightboxImg(null)}
                className="absolute -top-10 right-0 text-white hover:text-slate-300 font-bold p-1 text-lg cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={previewLightboxImg}
                alt="Uvećana slika"
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/20"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
