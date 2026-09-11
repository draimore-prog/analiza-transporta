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
  Send,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Smartphone,
  Lock,
  MapPin,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { CHECKLIST_ITEMS } from "@/hooks/useWarehouseWorkOrders.js";
import { compressImage } from "@/lib/imageCompression.js";
import { normalizeVehicleStatus } from "@/lib/calculations.js";

const PHOTO_SLOTS = [
  { key: "front", label: "1. Pogled naprijed", hint: "Cijeli viljuškar sa prednje strane" },
  { key: "back", label: "2. Pogled nazad", hint: "Zadnji dio sa vučnom kukom i tegom" },
  { key: "left", label: "3. Lijeva strana", hint: "Profil sa točkovima i kranom" },
  { key: "right", label: "4. Desna strana", hint: "Profil sa hidrauličnim crijevima" },
  { key: "interior", label: "5. Tabla sa satima / sjedište", hint: "Prikaz brojača radnih sati i unutrašnjost" }
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

function normalizeChecklist(existingChecklist) {
  const normalized = {};
  CHECKLIST_ITEMS.forEach((item) => {
    const val = existingChecklist && typeof existingChecklist === "object" ? existingChecklist[item.key] : null;
    if (val && typeof val === "object" && val.status) {
      normalized[item.key] = {
        status: val.status === "issue" ? "issue" : "ok",
        note: typeof val.note === "string" ? val.note : ""
      };
    } else if (typeof val === "string") {
      normalized[item.key] = {
        status: val === "issue" ? "issue" : "ok",
        note: ""
      };
    } else {
      normalized[item.key] = { status: "ok", note: "" };
    }
  });
  return normalized;
}

function extractVehicleFromOrder(order) {
  if (!order) return null;
  const vDetails = order.vehicleDetails || {};
  return {
    reg: order.vehicleId || "",
    tipMehan: vDetails.tip || "Viljuškar",
    markaVoz: vDetails.proizvodjac || "",
    modelVoz: vDetails.model || "",
    brojSasije: vDetails.serijskiBroj || "",
    poslovnaJedinica: vDetails.lokacija || ""
  };
}

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

  // Trenutni korak čarobnjaka (1: Jedinica, 2: Ček-lista, 3: Radovi, 4: Sati & slike)
  const [currentStep, setCurrentStep] = useState(1);

  // Stanje forme - bezbjedno inicijalizovano direktno iz initialOrder
  const [selectedVehicle, setSelectedVehicle] = useState(() => extractVehicleFromOrder(initialOrder));
  const [orderType, setOrderType] = useState(() => initialOrder?.type || "preventive");
  const [workHours, setWorkHours] = useState(() => (initialOrder?.workHours ? String(initialOrder.workHours) : ""));
  const [workDescription, setWorkDescription] = useState(() => initialOrder?.workDescription || "");
  const [usedMaterials, setUsedMaterials] = useState(() => initialOrder?.usedMaterials || "");

  // Ček-lista: garantovano normalizovano svih 8 stavki
  const [checklist, setChecklist] = useState(() => normalizeChecklist(initialOrder?.checklist));

  // Fotografije i statistike kompresije
  const [photos, setPhotos] = useState(() => (initialOrder?.photos && typeof initialOrder.photos === "object" ? initialOrder.photos : {}));
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

    setCurrentStep(1); // Uvijek počni od koraka 1 pri otvaranju

    if (initialOrder) {
      setSelectedVehicle(extractVehicleFromOrder(initialOrder));
      setIsSearchingVehicle(false);
      setOrderType(initialOrder.type || "preventive");
      setWorkHours(initialOrder.workHours ? String(initialOrder.workHours) : "");
      setWorkDescription(initialOrder.workDescription || "");
      setUsedMaterials(initialOrder.usedMaterials || "");
      setChecklist(normalizeChecklist(initialOrder.checklist));
      setPhotos(initialOrder.photos && typeof initialOrder.photos === "object" ? initialOrder.photos : {});
      setSubmittedOrderNumber(null);
      setErrorMessage("");
    } else {
      setSelectedVehicle(null);
      setIsSearchingVehicle(true);
      setOrderType("preventive");
      setWorkHours("");
      setWorkDescription("");
      setUsedMaterials("");
      setChecklist(normalizeChecklist(null));
      setPhotos({});
      setSubmittedOrderNumber(null);
      setErrorMessage("");
    }
  }, [initialOrder, isOpen]);

  // Filtriraj SAMO aktivna vozila (isključi rashodovana, prodata i neaktivna)
  const activeWarehouseFleet = useMemo(() => {
    return (warehouseMasterFleet || []).filter(
      (v) => normalizeVehicleStatus(v.status) === "Aktivno"
    );
  }, [warehouseMasterFleet]);

  // Filtriranje vozila za pretragu
  const filteredVehicles = useMemo(() => {
    if (!searchVehicleTerm.trim()) return activeWarehouseFleet.slice(0, 8);
    const term = searchVehicleTerm.toLowerCase();

    return activeWarehouseFleet
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
  }, [activeWarehouseFleet, searchVehicleTerm]);

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

  // Prelazak na sljedeći korak uz validaciju
  const handleNextStep = () => {
    setErrorMessage("");

    if (currentStep === 1) {
      if (!selectedVehicle) {
        setErrorMessage("Morate odabrati jedinicu skladišne mehanizacije prije prelaska dalje!");
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      setCurrentStep(4);
      return;
    }
  };

  // Povratak na prethodni korak
  const handlePrevStep = () => {
    setErrorMessage("");
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Slanje radnog naloga
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!selectedVehicle) {
      setErrorMessage("Morate odabrati jedinicu skladišne mehanizacije!");
      setCurrentStep(1);
      return;
    }

    if (!workHours || Number(workHours) <= 0) {
      setErrorMessage("Obavezno unesite trenutne radne sate (MTH) sa table viljuškara!");
      setCurrentStep(4);
      return;
    }

    const uploadedPhotosCount = Object.values(photos).filter(Boolean).length;
    if (uploadedPhotosCount === 0) {
      setErrorMessage("Fotodokumentacija je OBAVEZNA! Molimo priložite barem jednu fotografiju stanja viljuškara / popravke.");
      setCurrentStep(4);
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

  // Brojač defekata u ček listi - bezbjedna kalkulacija bez hook restrikcija
  const defectCount = Object.values(checklist || {}).filter(
    (c) => c && typeof c === "object" && c.status === "issue"
  ).length;

  // Brojač slika
  const photoCount = Object.values(photos || {}).filter(Boolean).length;

  // Ako modal nije otvoren, bezbjedno vrati null NAKON što su svi hookovi bezuslovno izvršeni
  if (!isOpen) return null;

  // Ako je nalog uspješno poslan, prikaži ekran potvrde
  if (submittedOrderNumber) {
    return (
      <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex justify-center items-center z-[9999] p-4 animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Check className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Radni nalog uspješno poslan!
          </h2>

          <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-blue-700 dark:text-blue-400">
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
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
          >
            U redu / Povratak
          </button>
        </div>
      </div>
    );
  }

  // Definicija koraka čarobnjaka
  const STEPS = [
    { id: 1, title: "1. Jedinica", subtitle: "Zadatak" },
    { id: 2, title: "2. Ček-lista", subtitle: `${defectCount > 0 ? `${defectCount} kvar` : "Ispravnost"}` },
    { id: 3, title: "3. Radovi", subtitle: "Opis & dijelovi" },
    { id: 4, title: "4. Sati & slike", subtitle: `${photoCount}/5 slika` }
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex justify-center items-center z-[9995] p-1.5 sm:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xl h-full max-h-[96dvh] sm:max-h-[92vh] flex flex-col justify-between overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Mobile-First Kompaktno Zaglavlje */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-3.5 py-2.5 sm:px-5 sm:py-3 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/10 rounded-xl">
              <Smartphone className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight leading-tight">
                {initialOrder ? `Završi nalog ${initialOrder.orderNumber}` : "Novi terenski radni nalog"}
              </h2>
              <p className="text-[10px] text-blue-100 font-medium leading-none mt-0.5">
                Serviser: <strong>{activeUser?.fullname || activeUser?.username || "Serviser"}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Zatvori formu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEPPER NAVIGATOR (ONEMOGUĆENO PRESKAKANJE UNAPRIJED) */}
        <div className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-2 py-1.5 shrink-0">
          <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
            {STEPS.map((s) => {
              const isActive = currentStep === s.id;
              const isPast = currentStep > s.id;
              const isDisabled = s.id > currentStep;

              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    // Dozvoli samo povratak na prethodno završene korake (nema preskakanja unaprijed)
                    if (s.id < currentStep) {
                      setCurrentStep(s.id);
                      setErrorMessage("");
                    }
                  }}
                  className={`py-1.5 px-1 rounded-xl text-center transition-all border flex flex-col items-center justify-center ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm scale-[1.01]"
                      : isPast
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 cursor-pointer"
                      : "bg-slate-50 dark:bg-slate-850/40 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {isPast && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                    <span className="text-[10px] sm:text-xs font-black truncate">{s.title}</span>
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-semibold opacity-90 truncate hidden xs:inline">
                    {s.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TIJELO TRENUTNE STRANICE / KORAKA (SKALIRANO DA STANE NA EKRAN) */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-3 text-slate-800 dark:text-slate-200">
          {/* Upozorenje o grešci */}
          {errorMessage && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded-xl font-bold flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* KORAK 1: PODACI O MEHANIZACIJI I ZADATAK                                  */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-3 animate-in fade-in">
              <div className="bg-slate-50 dark:bg-slate-850 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1">
                    <span>1. Jedinica skladišne mehanizacije</span>
                    <span className="text-rose-500 font-black">*</span>
                  </label>
                  {!isAssignedOrder && selectedVehicle && (
                    <button
                      type="button"
                      onClick={() => setIsSearchingVehicle(true)}
                      className="text-xs text-blue-600 dark:text-blue-400 font-black underline cursor-pointer"
                    >
                      Promijeni mašinu
                    </button>
                  )}
                </div>

                {isAssignedOrder ? (
                  /* ZAKLJUČANA JEDINICA: Voditelj je odredio ovaj viljuškar */
                  <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-400 dark:border-amber-600 rounded-2xl shadow-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 text-[10px] font-black uppercase tracking-wider">
                      <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Zadatak od voditelja (fiksirano)</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                      {selectedVehicle?.reg || initialOrder?.vehicleId || "Mehanizacija"}
                    </div>
                    <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                      {selectedVehicle?.tipMehan || initialOrder?.vehicleDetails?.tip || "Viljuškar"} • {selectedVehicle?.markaVoz || initialOrder?.vehicleDetails?.proizvodjac || ""} {selectedVehicle?.modelVoz || initialOrder?.vehicleDetails?.model || ""}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        Lokacija: {selectedVehicle?.poslovnaJedinica || initialOrder?.vehicleDetails?.lokacija || "PJ Centralno Skladište"}
                      </span>
                      {(selectedVehicle?.brojSasije || initialOrder?.vehicleDetails?.serijskiBroj) && (
                        <span className="text-slate-500">• Šasija: {selectedVehicle?.brojSasije || initialOrder?.vehicleDetails?.serijskiBroj}</span>
                      )}
                    </div>

                    {initialOrder?.workDescription && (
                      <div className="mt-2 p-2.5 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-amber-200 dark:border-amber-800 text-xs">
                        <span className="text-[10px] font-black uppercase text-amber-900 dark:text-amber-300 block mb-0.5">
                          Uputstvo / Opis kvara od voditelja:
                        </span>
                        <p className="font-bold text-slate-900 dark:text-white leading-snug">
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
                        placeholder="Broj viljuškara (npr. SM-042), model..."
                        className="w-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-bold outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>

                    <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
                      {filteredVehicles.map((v) => (
                        <div
                          key={v.reg}
                          onClick={() => {
                            setSelectedVehicle(v);
                            setIsSearchingVehicle(false);
                            setErrorMessage("");
                          }}
                          className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer flex justify-between items-center text-xs transition-colors"
                        >
                          <div>
                            <span className="font-mono font-black text-xs text-blue-700 dark:text-blue-400 mr-2">{v.reg}</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {v.tipMehan} • {v.markaVoz}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{v.poslovnaJedinica}</span>
                          </div>
                          <span className="text-[11px] font-black text-blue-600 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg">
                            Odaberi
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-200 dark:border-blue-900/60 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-mono text-base font-black text-blue-700 dark:text-blue-400 block">
                        {selectedVehicle.reg}
                      </span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs block">
                        {selectedVehicle.tipMehan} • {selectedVehicle.markaVoz} {selectedVehicle.modelVoz}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {selectedVehicle.poslovnaJedinica || "Skladište"}
                      </span>
                    </div>
                    <span className="text-xs font-black text-emerald-600 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-1 rounded-lg">
                      <CheckCircle2 className="w-4 h-4" /> Odabrano
                    </span>
                  </div>
                )}
              </div>

              {/* Vrsta intervencije */}
              <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                <label className="block text-[11px] font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                  Vrsta radnog naloga
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType("preventive")}
                    className={`py-2 px-2 rounded-xl text-xs font-black border-2 transition-all cursor-pointer text-center ${
                      orderType === "preventive"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    🛡️ Redovni pregled
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType("corrective")}
                    className={`py-2 px-2 rounded-xl text-xs font-black border-2 transition-all cursor-pointer text-center ${
                      orderType === "corrective"
                        ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    ⚠️ Kvar / popravka
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* KORAK 2: KONTROLNA ČEK-LISTA (8 SKLOPOVA - KOMPAKTNO STANE NA EKRAN)       */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-2.5 animate-in fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Kontrolna ček-lista (8 sklopova)
                  </h3>
                </div>
                {defectCount > 0 ? (
                  <span className="text-[11px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-2 py-0.5 rounded-lg border border-rose-300">
                    ⚠️ {defectCount} defekt(a)
                  </span>
                ) : (
                  <span className="text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-300">
                    ✓ Sve ispravno
                  </span>
                )}
              </div>

              {/* Dugme za brzu potvrdu svih ispravnih dijelova */}
              <button
                type="button"
                onClick={handleMarkAllOk}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>KLIKNI OVDJE: OZNAČI SVE KAO ISPRAVNO</span>
              </button>

              <div className="space-y-1.5">
                {CHECKLIST_ITEMS.map((item) => {
                  const checkData = checklist[item.key] || { status: "ok", note: "" };
                  const isOk = checkData.status === "ok";

                  return (
                    <div
                      key={item.key}
                      className={`px-2.5 py-1.5 rounded-xl border transition-all space-y-1.5 ${
                        isOk
                          ? "bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700"
                          : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 shadow-xs"
                      }`}
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.label}
                        </span>
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleChecklistToggle(item.key, "ok")}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-black transition-all cursor-pointer ${
                              isOk
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                          >
                            ✓ OK
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChecklistToggle(item.key, "issue")}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-black transition-all cursor-pointer ${
                              !isOk
                                ? "bg-rose-600 text-white shadow-xs"
                                : "text-slate-500 hover:text-rose-600"
                            }`}
                          >
                            ⚠️ Kvar
                          </button>
                        </div>
                      </div>

                      {!isOk && (
                        <input
                          type="text"
                          value={checkData.note || ""}
                          onChange={(e) => handleChecklistNote(item.key, e.target.value)}
                          placeholder="Opišite uočeni kvar ili oštećenje na ovom sklopu..."
                          className="w-full bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 rounded-lg px-2 py-1 text-xs text-rose-900 dark:text-rose-200 font-bold outline-none focus:ring-1 focus:ring-rose-500 animate-in fade-in"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* KORAK 3: OPIS IZVRŠENIH RADOVA I UTROŠENI DIJELOVI                       */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-3 animate-in fade-in">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  Opis izvršenih radova / intervencije
                </label>

                {/* Brzi šabloni za lakši unos na terenu */}
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {COMMON_REPAIR_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl}
                      type="button"
                      onClick={() => handleAddTemplate(tmpl)}
                      className="text-[10px] font-bold bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950 text-slate-800 dark:text-slate-200 hover:text-blue-700 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                    >
                      + {tmpl}
                    </button>
                  ))}
                </div>

                <textarea
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  rows={3}
                  placeholder="Šta je pregledano ili popravljeno na viljuškaru..."
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm font-medium outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 shadow-inner"
                />
              </div>

              {/* Utrošeni materijal i rezervni dijelovi */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-600" />
                  Utrošeni materijal i rezervni dijelovi
                </label>
                <textarea
                  value={usedMaterials}
                  onChange={(e) => setUsedMaterials(e.target.value)}
                  rows={2}
                  placeholder="Npr. 2x točkić krana 85mm, 5L hidraulično ulje HD46..."
                  className="w-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm font-medium outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 shadow-inner"
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* KORAK 4: RADNI SATI (MTH), 5 SLIKA I ZAKLJUČIVANJE NALOGA                 */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-3 animate-in fade-in">
              {/* Radni Sati (MTH) */}
              <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl border-2 border-amber-400 dark:border-amber-600 space-y-1.5">
                <label className="block text-xs font-black uppercase text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Radni sati sa table (MTH)
                  </span>
                  <span className="text-rose-600 font-black text-[10px] uppercase bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded-md">
                    * Obavezno
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
                    className="w-full bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-xl pl-9 pr-14 py-2 text-lg font-mono font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <Clock className="w-4 h-4 text-amber-500 absolute left-3 top-3 pointer-events-none" />
                  <span className="absolute right-3 top-2.5 font-black text-[10px] text-slate-400 uppercase tracking-wider pointer-events-none">
                    MTH
                  </span>
                </div>
              </div>

              {/* Fotodokumentacija sa 5 pozicija (Kompaktan grid od 5 slika na jedan ekran) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    Fotodokumentacija (5 pozicija)
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">
                      * Min 1
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                      {photoCount}/5
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {PHOTO_SLOTS.map((slot, idx) => {
                    const imgData = photos[slot.key];
                    const isCompressing = compressingSlot === slot.key;

                    return (
                      <div
                        key={slot.key}
                        className="p-1 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between items-center text-center"
                      >
                        <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 truncate w-full block">
                          {idx + 1}. {slot.key}
                        </span>

                        {imgData ? (
                          <div className="relative w-full h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 mt-1 group">
                            <img src={imgData} alt={slot.label} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(slot.key)}
                              className="absolute top-0.5 right-0.5 p-1 bg-rose-600 text-white rounded-md cursor-pointer"
                              title="Ukloni sliku"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                            <span className="absolute bottom-0.5 left-0.5 right-0.5 bg-emerald-600 text-white text-[8px] font-bold py-0.2 rounded-xs">
                              ✓ OK
                            </span>
                          </div>
                        ) : (
                          <div
                            onClick={() => fileInputRefs.current[slot.key]?.click()}
                            className="w-full h-16 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 rounded-lg flex flex-col items-center justify-center p-1 text-center cursor-pointer transition-colors bg-white dark:bg-slate-800 active:scale-95 mt-1"
                          >
                            {isCompressing ? (
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Camera className="w-4 h-4 text-indigo-500 mb-0.5" />
                                <span className="text-[8px] font-bold text-slate-500 uppercase">
                                  Foto
                                </span>
                              </>
                            )}
                          </div>
                        )}

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
            </div>
          )}
        </div>

        {/* DONJA NAVIGACIJSKA TRAKA (NAZAD / DALJE / ZAKLJUČI) */}
        <div className="p-2.5 sm:p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 shrink-0">
          {/* Dugme lijevo: Nazad ili Odustani */}
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Nazad</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Odustani
            </button>
          )}

          {/* Dugme desno: Dalje ili Zaključi */}
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              <span>
                {currentStep === 1 && "Dalje: Ček-lista"}
                {currentStep === 2 && "Dalje: Radovi"}
                {currentStep === 3 && "Dalje: Sati & slike"}
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 sm:px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ml-auto"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{isSubmitting ? "SLANJE..." : "ZAKLJUČI I POŠALJI NALOG"}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
