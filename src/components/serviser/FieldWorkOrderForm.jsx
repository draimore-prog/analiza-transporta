"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  X,
  Search,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wrench,
  Package,
  ShieldCheck,
  Check,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  ArrowLeft,
  Smartphone,
  Lock,
  MapPin
} from "lucide-react";
import { CHECKLIST_ITEMS } from "@/hooks/useWarehouseWorkOrders.js";
import { compressImage } from "@/lib/imageCompression.js";

const PHOTO_SLOTS = [
  { key: "front", label: "1. Pogled Naprijed", hint: "Cijeli viljuškar sa prednje strane" },
  { key: "back", label: "2. Pogled Nazad", hint: "Zadnji dio sa vučnom kukom i tegom" },
  { key: "left", label: "3. Lijeva Strana", hint: "Profil sa točkovima i kranom" },
  { key: "right", label: "4. Desna Strana", hint: "Profil sa hidrauličnim crijevima" },
  { key: "interior", label: "5. Tabla sa Satima / Sjedište", hint: "Prikaz brojača radnih sati i unutrašnjost" }
];

const COMMON_REPAIR_TEMPLATES = [
  "Zamjena pogonskog točka",
  "Zamjena teretnog točkića krana",
  "Dolijevanje hidrauličnog ulja HD46",
  "Čišćenje i zaštita terminala baterije",
  "Podmazivanje lanca krana i klizača",
  "Podešavanje elektromagnetne kočnice",
  "Provjera sigurnosnog mikroprekidača sjedišta",
  "Otklanjanje vlaženja hidrauličnog crijeva"
];

export function FieldWorkOrderForm({
  isOpen,
  onClose,
  warehouseMasterFleet = [],
  onSubmitOrder,
  activeUser,
  initialOrder = null
}) {
  // Da li je ovo postojeći zadatak koji je dodijelio voditelj?
  const isAssignedOrder = !!(initialOrder && (initialOrder.vehicleId || initialOrder.id));

  // Stanje forme
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [orderType, setOrderType] = useState("preventive");
  const [workHours, setWorkHours] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [usedMaterials, setUsedMaterials] = useState("");

  // Ček-lista: inicijalno sve postavljeno na 'ok'
  const [checklist, setChecklist] = useState(() => {
    const init = {};
    CHECKLIST_ITEMS.forEach((item) => {
      init[item.key] = { status: "ok", note: "" };
    });
    return init;
  });

  // Fotografije i statistike kompresije
  const [photos, setPhotos] = useState({});
  const [compressingSlot, setCompressingSlot] = useState(null);
  const [photoStats, setPhotoStats] = useState({});

  // Pretraga vozila
  const [searchVehicleTerm, setSearchVehicleTerm] = useState("");
  const [isSearchingVehicle, setIsSearchingVehicle] = useState(!isAssignedOrder);

  // Greške i status slanja
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState(null);

  const fileInputRefs = useRef({});

  // Sinhronizacija stanja kada se otvori modal ili promijeni dodijeljeni nalog
  useEffect(() => {
    if (!isOpen) return;

    if (initialOrder) {
      const vDetails = initialOrder.vehicleDetails || {};
      setSelectedVehicle({
        reg: initialOrder.vehicleId || "",
        tipMehan: vDetails.tip || "Viljuškar",
        markaVoz: vDetails.proizvodjac || "",
        modelVoz: vDetails.model || "",
        brojSasije: vDetails.serijskiBroj || "",
        poslovnaJedinica: vDetails.lokacija || ""
      });
      setIsSearchingVehicle(false);
      setOrderType(initialOrder.type || "preventive");
      setWorkHours(initialOrder.workHours ? String(initialOrder.workHours) : "");
      setWorkDescription(initialOrder.workDescription || "");
      setUsedMaterials(initialOrder.usedMaterials || "");

      if (initialOrder.checklist && Object.keys(initialOrder.checklist).length > 0) {
        setChecklist(initialOrder.checklist);
      } else {
        const init = {};
        CHECKLIST_ITEMS.forEach((item) => {
          init[item.key] = { status: "ok", note: "" };
        });
        setChecklist(init);
      }

      setPhotos(initialOrder.photos || {});
      setSubmittedOrderNumber(null);
      setErrorMessage("");
    } else {
      setSelectedVehicle(null);
      setIsSearchingVehicle(true);
      setOrderType("preventive");
      setWorkHours("");
      setWorkDescription("");
      setUsedMaterials("");
      const init = {};
      CHECKLIST_ITEMS.forEach((item) => {
        init[item.key] = { status: "ok", note: "" };
      });
      setChecklist(init);
      setPhotos({});
      setSubmittedOrderNumber(null);
      setErrorMessage("");
    }
  }, [initialOrder, isOpen]);

  // Filtriranje vozila za pretragu
  const filteredVehicles = useMemo(() => {
    if (!searchVehicleTerm.trim()) return warehouseMasterFleet.slice(0, 8);
    const term = searchVehicleTerm.toLowerCase();

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
  }, [warehouseMasterFleet, searchVehicleTerm]);

  if (!isOpen) return null;

  // Brzo označavanje svih sklopova ispravnim
  const handleMarkAllOk = () => {
    const updated = {};
    CHECKLIST_ITEMS.forEach((item) => {
      updated[item.key] = { status: "ok", note: "" };
    });
    setChecklist(updated);
  };

  // Promjena statusa pojedinog sklopa
  const handleChecklistToggle = (key, status) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        status,
        note: status === "ok" ? "" : prev[key]?.note || ""
      }
    }));
  };

  // Promjena napomene za sklop sa defektom
  const handleChecklistNote = (key, note) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        note
      }
    }));
  };

  // Dodavanje brzog predloška u opis radova
  const handleAddTemplate = (template) => {
    setWorkDescription((prev) => {
      if (!prev.trim()) return template;
      return `${prev.trim()}; ${template}`;
    });
  };

  // Obrada fotografisanja sa automatskom kompresijom
  const handlePhotoCapture = async (slotKey, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCompressingSlot(slotKey);
    setErrorMessage("");

    try {
      // Kompresija na klijentu: Max 1280px, 0.75 kvalitet
      const result = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.75 });

      setPhotos((prev) => ({
        ...prev,
        [slotKey]: result.dataUrl
      }));

      setPhotoStats((prev) => ({
        ...prev,
        [slotKey]: `${result.originalSizeKB} KB ➔ ${result.compressedSizeKB} KB (-${result.savedPercent}%)`
      }));
    } catch (err) {
      setErrorMessage("Greška pri kompresiji slike: " + (err.message || err));
    } finally {
      setCompressingSlot(null);
    }
  };

  const handleRemovePhoto = (slotKey) => {
    setPhotos((prev) => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });
    setPhotoStats((prev) => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });
  };

  // Slanje radnog naloga
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedVehicle) {
      setErrorMessage("Morate odabrati jedinicu skladišne mehanizacije!");
      return;
    }

    if (!workHours || Number(workHours) <= 0) {
      setErrorMessage("Obavezno unesite trenutne radne sate (MTH) sa table viljuškara!");
      return;
    }

    const uploadedPhotosCount = Object.values(photos).filter(Boolean).length;
    if (uploadedPhotosCount === 0) {
      setErrorMessage("Fotodokumentacija je OBAVEZNA! Molimo priložite barem jednu fotografiju stanja viljuškara / popravke (preporučeno: tabla sa radnim satima i izgled jedinice).");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const orderPayload = {
        ...(initialOrder?.id ? { id: initialOrder.id, orderNumber: initialOrder.orderNumber } : {}),
        status: "completed", // Serviser na terenu završava nalog i šalje ga na verifikaciju voditelju
        type: orderType,
        assignedTo: activeUser?.fullname || activeUser?.username || "Serviser",
        createdBy: initialOrder?.createdBy || activeUser?.fullname || activeUser?.username || "Serviser",
        vehicleId: selectedVehicle.reg,
        vehicleDetails: {
          tip: selectedVehicle.tipMehan || "Viljuškar",
          proizvodjac: selectedVehicle.markaVoz || "",
          model: selectedVehicle.modelVoz || "",
          serijskiBroj: selectedVehicle.brojSasije || "",
          lokacija: selectedVehicle.poslovnaJedinica || ""
        },
        workHours: Number(workHours),
        checklist,
        workDescription: workDescription.trim(),
        usedMaterials: usedMaterials.trim(),
        photos,
        completedAt: new Date().toISOString()
      };

      const res = await onSubmitOrder(orderPayload);
      setSubmittedOrderNumber(res?.orderNumber || initialOrder?.orderNumber || "Zabilježeno");
    } catch (err) {
      setErrorMessage("Greška pri slanju radnog naloga: " + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ako je nalog uspješno poslan, prikaži ekran potvrde
  if (submittedOrderNumber) {
    return (
      <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex justify-center items-center z-[9999] p-4 animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Check className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Radni Nalog Uspješno Poslan!
          </h2>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-blue-700 dark:text-blue-400">
            {submittedOrderNumber}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Podaci sa terena, 8-dijelna ček-lista, radni sati ({workHours} h) i optimizovane fotografije su
            uspješno sinhronizovani u bazu. Voditelj je obaviješten u realnom vremenu.
          </p>

          <button
            onClick={() => {
              setSubmittedOrderNumber(null);
              onClose();
            }}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
          >
            U redu / Povratak
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex justify-center items-center z-[9995] p-2 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[96vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Mobile-First Zaglavlje */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-4 sm:p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Smartphone className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight leading-tight">
                {initialOrder ? `Završi Nalog ${initialOrder.orderNumber}` : "Novi Terenski Radni Nalog"}
              </h2>
              <p className="text-[11px] text-blue-100 font-medium leading-none mt-0.5">
                Serviser: <strong>{activeUser?.fullname || activeUser?.username || "Serviser"}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tijelo forme */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-slate-800 dark:text-slate-200">
          {/* Upozorenje o grešci */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded-xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* KORAK 1: Jedinica Skladišne Mehanizacije */}
          <div className="bg-slate-50 dark:bg-slate-850 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
                <span>1. Jedinica Skladišne Mehanizacije</span>
                <span className="text-rose-500 font-black">*</span>
              </label>
              {!isAssignedOrder && selectedVehicle && (
                <button
                  type="button"
                  onClick={() => setIsSearchingVehicle(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 font-black underline cursor-pointer p-1"
                >
                  Promijeni jedinicu
                </button>
              )}
            </div>

            {isAssignedOrder ? (
              /* ZAKLJUČANA JEDINICA: Voditelj je odredio ovaj viljuškar - serviser je ne može mijenjati */
              <div className="p-4 sm:p-5 bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-400 dark:border-amber-600 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 text-xs font-black uppercase tracking-wider mb-2">
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Zadatak od Voditelja (Fiksirano)</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                  {selectedVehicle?.reg || initialOrder.vehicleId}
                </div>
                <div className="text-base font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                  {selectedVehicle?.tipMehan || "Viljuškar"} • {selectedVehicle?.markaVoz} {selectedVehicle?.modelVoz}
                </div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-300">
                    <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                    Lokacija: {selectedVehicle?.poslovnaJedinica || initialOrder.vehicleDetails?.lokacija || "PJ Centralno Skladište"}
                  </span>
                  {selectedVehicle?.brojSasije && (
                    <span className="text-slate-500">• Broj šasije: {selectedVehicle.brojSasije}</span>
                  )}
                </div>

                {initialOrder?.workDescription && (
                  <div className="mt-3 p-3 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-amber-200 dark:border-amber-800">
                    <span className="text-xs font-black uppercase text-amber-900 dark:text-amber-300 block mb-0.5">
                      Nalog / Uputstvo voditelja:
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {initialOrder.workDescription}
                    </p>
                  </div>
                )}
              </div>
            ) : isSearchingVehicle || !selectedVehicle ? (
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchVehicleTerm}
                    onChange={(e) => setSearchVehicleTerm(e.target.value)}
                    placeholder="Ukucajte broj viljuškara (npr. SM-042), model ili PJ..."
                    className="w-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-3 py-3 text-sm font-bold outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
                  {filteredVehicles.map((v) => (
                    <div
                      key={v.reg}
                      onClick={() => {
                        setSelectedVehicle(v);
                        setIsSearchingVehicle(false);
                        setErrorMessage("");
                      }}
                      className="p-3 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer flex justify-between items-center text-xs transition-colors"
                    >
                      <div>
                        <span className="font-mono font-black text-sm text-blue-700 dark:text-blue-400 mr-2">{v.reg}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {v.tipMehan} • {v.markaVoz} {v.modelVoz}
                        </span>
                        <span className="text-[11px] text-slate-400 block">{v.poslovnaJedinica}</span>
                      </div>
                      <span className="text-xs font-black text-blue-600 bg-blue-50 dark:bg-blue-950 px-3 py-1.5 rounded-lg">
                        Odaberi
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-200 dark:border-blue-900/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-mono text-lg font-black text-blue-700 dark:text-blue-400 block">
                    {selectedVehicle.reg}
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm block">
                    {selectedVehicle.tipMehan} • {selectedVehicle.markaVoz} {selectedVehicle.modelVoz}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedVehicle.poslovnaJedinica || "Skladište"} • SN: {selectedVehicle.brojSasije || "-"}
                  </span>
                </div>
                <span className="text-xs font-black text-emerald-600 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" /> Odabrano
                </span>
              </div>
            )}
          </div>

          {/* KORAK 2: Vrsta Naloga & OBAVEZAN unos radnih sati */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vrsta rada */}
            <div>
              <label className="block text-sm font-black uppercase text-slate-800 dark:text-slate-200 mb-2">
                2. Vrsta Pregleda
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType("preventive")}
                  className={`py-3 px-2 rounded-xl text-sm font-black border-2 transition-all cursor-pointer text-center ${
                    orderType === "preventive"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                  }`}
                >
                  🛡️ Redovni Pregled
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType("corrective")}
                  className={`py-3 px-2 rounded-xl text-sm font-black border-2 transition-all cursor-pointer text-center ${
                    orderType === "corrective"
                      ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                  }`}
                >
                  ⚠️ Kvar / Popravka
                </button>
              </div>
            </div>

            {/* Radni Sati (MTH) - OBAVEZNO POLJE ZA STARIJE SERVISERE */}
            <div>
              <label className="block text-sm font-black uppercase text-slate-800 dark:text-slate-200 mb-2 flex items-center justify-between">
                <span>3. Radni Sati sa Table (MTH)</span>
                <span className="text-rose-600 font-black text-xs uppercase bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded-md">
                  Obavezno
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  value={workHours}
                  onChange={(e) => setWorkHours(e.target.value)}
                  required
                  placeholder="Npr. 4850..."
                  className="w-full bg-white dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-500 rounded-2xl pl-11 pr-14 py-3.5 text-xl font-mono font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-amber-500/20 shadow-inner"
                />
                <Clock className="w-6 h-6 text-amber-500 absolute left-3.5 top-4 pointer-events-none" />
                <span className="absolute right-3.5 top-4 font-black text-xs text-slate-400 uppercase tracking-wider pointer-events-none">
                  Sati
                </span>
              </div>
            </div>
          </div>

          {/* KORAK 3: Kontrolna Ček-Lista (8 Sklopova) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                4. Kontrolna Ček-Lista (8 Sklopova)
              </h3>
            </div>

            {/* Veliko dugme za brzu potvrdu svih ispravnih dijelova */}
            <button
              type="button"
              onClick={handleMarkAllOk}
              className="w-full py-3 sm:py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>KLIKNI OVDJE: OZNAČI SVE KAO ISPRAVNO</span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CHECKLIST_ITEMS.map((item) => {
                const checkData = checklist[item.key] || { status: "ok", note: "" };
                const isOk = checkData.status === "ok";

                return (
                  <div
                    key={item.key}
                    className={`p-3.5 rounded-2xl border-2 transition-all space-y-2.5 ${
                      isOk
                        ? "bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700"
                        : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 shadow-xs"
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        {item.label}
                      </span>
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleChecklistToggle(item.key, "ok")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            isOk
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          ✓ Ispravno
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChecklistToggle(item.key, "issue")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            !isOk
                              ? "bg-rose-600 text-white shadow-xs"
                              : "text-slate-500 hover:text-rose-600"
                          }`}
                        >
                          ⚠️ Defekt
                        </button>
                      </div>
                    </div>

                    {!isOk && (
                      <input
                        type="text"
                        value={checkData.note || ""}
                        onChange={(e) => handleChecklistNote(item.key, e.target.value)}
                        placeholder="Opišite uočeni kvar ili oštećenje..."
                        className="w-full bg-white dark:bg-slate-900 border-2 border-rose-300 dark:border-rose-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-rose-900 dark:text-rose-200 font-bold outline-none focus:ring-2 focus:ring-rose-500 animate-in fade-in"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* KORAK 4: Opis Radova & Brzi Predlošci */}
          <div className="space-y-2.5">
            <label className="block text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-blue-600" />
              5. Opis Izvršenih Radova
            </label>

            {/* Brzi tagovi / predlošci */}
            <div className="flex flex-wrap gap-2">
              {COMMON_REPAIR_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl}
                  type="button"
                  onClick={() => handleAddTemplate(tmpl)}
                  className="text-xs font-bold bg-white hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950 text-slate-800 dark:text-slate-200 hover:text-blue-700 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-xl transition-colors cursor-pointer shadow-2xs"
                >
                  + {tmpl}
                </button>
              ))}
            </div>

            <textarea
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              rows={3}
              placeholder="Napišite detaljan opis šta je urađeno na viljuškaru..."
              className="w-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-2xl p-3.5 text-sm font-medium outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 shadow-inner"
            />
          </div>

          {/* KORAK 5: Utrošeni Materijal i Dijelovi */}
          <div className="space-y-2">
            <label className="block text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-amber-600" />
              6. Utrošeni Materijal i Rezervni Dijelovi
            </label>
            <textarea
              value={usedMaterials}
              onChange={(e) => setUsedMaterials(e.target.value)}
              rows={2}
              placeholder="Npr. 2x točkić krana 85mm, 5L hidraulično ulje HD46, 1x sprej za lance..."
              className="w-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-2xl p-3.5 text-sm font-medium outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 shadow-inner"
            />
          </div>

          {/* KORAK 6: Foto-dokumentacija (5 pozicija) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
                  <Camera className="w-5 h-5 text-indigo-600" />
                  7. Foto Dokumentacija (5 Standardnih Pozicija)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Slike sa kamere telefona se automatski komprimuju radi brzog slanja preko mobilne mreže.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                  * Unos slika obavezan
                </span>
                {Object.values(photos).filter(Boolean).length > 0 && (
                  <span className="text-[11px] font-black px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {Object.values(photos).filter(Boolean).length}/5 slika
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PHOTO_SLOTS.map((slot) => {
                const imgData = photos[slot.key];
                const isCompressing = compressingSlot === slot.key;
                const stats = photoStats[slot.key];

                return (
                  <div
                    key={slot.key}
                    className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border-2 border-slate-200 dark:border-slate-700 flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white block">{slot.label}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{slot.hint}</span>
                      </div>
                      {imgData && (
                        <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-lg text-xs font-black flex items-center gap-0.5 shrink-0">
                          <Check className="w-3.5 h-3.5" /> OK
                        </span>
                      )}
                    </div>

                    {imgData ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 mb-2 group">
                        <img src={imgData} alt={slot.label} className="w-full h-36 object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(slot.key)}
                          className="absolute top-2 right-2 p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md cursor-pointer"
                          title="Ukloni fotografiju"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {stats && (
                          <div className="absolute bottom-1 left-1 right-1 bg-black/80 text-[10px] font-bold text-emerald-300 py-0.5 px-2 rounded-lg text-center truncate">
                            {stats}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRefs.current[slot.key]?.click()}
                        className="h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 rounded-xl flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors mb-2 bg-white dark:bg-slate-800 active:scale-98"
                      >
                        {isCompressing ? (
                          <div className="flex flex-col items-center gap-2 text-blue-600">
                            <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-bold">Kompresija...</span>
                          </div>
                        ) : (
                          <>
                            <Camera className="w-8 h-8 text-indigo-500 mb-1" />
                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase">
                              Dodirni za Kameru / Sliku
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Skriveni input za kameru */}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      ref={(el) => (fileInputRefs.current[slot.key] = el)}
                      onChange={(e) => handlePhotoCapture(slot.key, e)}
                      className="hidden"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dugmad na dnu za slanje (Uočljiva i velika) */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 bg-white dark:bg-slate-900 py-3 z-10">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-center"
            >
              Odustani
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:flex-1 py-4 px-8 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-base font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              <span>{isSubmitting ? "SLANJE..." : "POŠALJI RADNI NALOG VODITELJU"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
