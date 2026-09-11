"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  X,
  PlusCircle,
  FileText,
  Upload,
  Trash2,
  Loader2,
  CheckCircle2,
  Paperclip,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
  Truck,
  Wrench,
  Tag,
  DollarSign
} from "lucide-react";
import { uploadMediaFile } from "@/lib/fileUpload.js";
import { cleanVehicleType, formatDate } from "@/lib/calculations.js";
import { useConfirm } from "@/context/ConfirmContext.jsx";

export function NewCostModal({
  isOpen,
  onClose,
  masterFleet = [],
  onSaveCost,
  activeUser
}) {
  const { confirm, alert: showAlert } = useConfirm();
  // Osnovni podaci o vozilu
  const [reg, setReg] = useState("");
  const [garazniBroj, setGarazniBroj] = useState("");
  const [godProizvodnje, setGodProizvodnje] = useState("");
  const [tipMehan, setTipMehan] = useState("Teretna vozila");
  const [markaVoz, setMarkaVoz] = useState("");
  const [modelVoz, setModelVoz] = useState("");
  const [isVehicleLocked, setIsVehicleLocked] = useState(false);
  const [vehicleStatusWarning, setVehicleStatusWarning] = useState(null);

  // Detalji servisa i fakture
  const [datum, setDatum] = useState(new Date().toISOString().split("T")[0]);
  const [brojRacuna, setBrojRacuna] = useState("");
  const [dobavljac, setDobavljac] = useState("");
  const [opis, setOpis] = useState("");

  // Kategorizacija
  const [segment, setSegment] = useState("Redovan servis");
  const [vrstaTroska, setVrstaTroska] = useState("Eksterni dobavljač");
  const [vrstaFakture, setVrstaFakture] = useState("Kombinovana faktura (Dijelovi + Usluga)");

  // Finansijski iznosi
  const [costPart, setCostPart] = useState("");
  const [costService, setCostService] = useState("");
  const [cost, setCost] = useState("");

  // Kilometraža / Radni sati
  const [kilometraza, setKilometraza] = useState("");
  const [radniSati, setRadniSati] = useState("0");
  const [isMatchingMileage, setIsMatchingMileage] = useState(false);
  const [matchMessage, setMatchMessage] = useState(null);
  const odometerDataRef = useRef(null);

  // Prilog računa / fakture
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [invoiceName, setInvoiceName] = useState("");
  const [invoiceType, setInvoiceType] = useState("");
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // Lista jedinstvenih dobavljača za predlaganje (datalist)
  const commonSuppliers = useMemo(() => {
    return [
      "Centralna radionica Bingo",
      "MAN Importer BH",
      "Scania BH",
      "Mercedes-Benz Starline",
      "Volvo Trucks BH",
      "Iveco Servis",
      "Guma M",
      "Unitrade",
      "Inter Cars",
      "Linde Viljuškari",
      "Jungheinrich BH",
      "Still Servis",
      "Total Trade",
      "Vianor",
      "Vlastita radionica",
      "Eksterni servis"
    ];
  }, []);

  if (!isOpen) return null;

  const normalizePlate = (str) => {
    if (!str) return "";
    return str
      .toString()
      .trim()
      .toUpperCase()
      .replace(/[Š]/g, "S")
      .replace(/[ČĆ]/g, "C")
      .replace(/[Ž]/g, "Z")
      .replace(/[Đ]/g, "DJ")
      .replace(/[^A-Z0-9]/g, "");
  };

  const fetchOdometerData = async () => {
    if (odometerDataRef.current) return odometerDataRef.current;
    try {
      const res = await fetch("/fleet_odometer.json");
      if (res.ok) {
        const data = await res.json();
        odometerDataRef.current = data;
        return data;
      }
    } catch (err) {
      console.warn("Notice loading fleet_odometer.json:", err);
    }
    return null;
  };

  const triggerOdometerMatch = async (vehicleReg, vehicleGb, serviceDate) => {
    if (!vehicleReg && !vehicleGb) return;
    setIsMatchingMileage(true);
    setMatchMessage(null);
    try {
      const data = await fetchOdometerData();
      if (!data) {
        setMatchMessage({ success: false, text: "Baza točenja goriva trenutno nije dostupna." });
        return;
      }

      const rNorm = normalizePlate(vehicleReg);
      const mNorm = normalizePlate(vehicleGb);

      const readings = (rNorm && data[rNorm]) || (mNorm && data[mNorm]) || null;

      if (!readings || readings.length === 0) {
        setMatchMessage({
          success: false,
          text: `Nema evidentiranih točenja sa pumpe za vozilo ${vehicleReg || vehicleGb}. Unesite kilometražu ručno.`
        });
        return;
      }

      const targetTime = serviceDate ? new Date(serviceDate).getTime() : Date.now();
      let bestKm = null;
      let bestDate = null;
      let bestDiff = Infinity;

      readings.forEach(([dStr, kmVal]) => {
        const dTime = new Date(dStr).getTime();
        const diff = Math.abs(targetTime - dTime);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestKm = kmVal;
          bestDate = dStr;
        }
      });

      if (bestKm != null) {
        setKilometraza(bestKm.toString());
        const daysDiff = Math.round(bestDiff / (1000 * 60 * 60 * 24));
        const diffText = daysDiff === 0 ? "isti dan" : `odstupanje ${daysDiff} d.`;
        setMatchMessage({
          success: true,
          text: `Pronađeno točenje od ${formatDate(bestDate)} (${diffText}): ${bestKm.toLocaleString("bs-BA")} km`
        });
      }
    } catch (e) {
      setMatchMessage({ success: false, text: "Greška pri pretrazi točenja: " + e.message });
    } finally {
      setIsMatchingMileage(false);
    }
  };

  const findMatchingVehicle = (inputStr) => {
    if (!inputStr || !masterFleet || masterFleet.length === 0) return null;
    const raw = inputStr.trim().toUpperCase();

    let candidate = raw;
    if (raw.includes(" [")) {
      candidate = raw.split(" [")[0].trim();
    } else if (raw.includes(" (")) {
      const matchInside = raw.match(/\(([^)]+)\)/);
      const matchOutside = raw.split(" (")[0].trim();
      if (matchInside) {
        const inside = matchInside[1].replace("GB:", "").trim();
        const byInside = masterFleet.find(
          (v) =>
            (v.reg && v.reg.toUpperCase() === inside) ||
            (v.garazniBroj && v.garazniBroj.toString().toUpperCase() === inside)
        );
        if (byInside) return byInside;
      }
      candidate = matchOutside;
    }

    const cleanNorm = candidate.replace(/[\s-]/g, "");

    return masterFleet.find((v) => {
      const vRegNorm = (v.reg || "").toUpperCase().replace(/[\s-]/g, "");
      const vGbNorm = (v.garazniBroj || "").toString().toUpperCase().replace(/[\s-]/g, "");
      return (
        (vRegNorm && vRegNorm === cleanNorm) ||
        (vGbNorm && vGbNorm !== "-" && vGbNorm === cleanNorm)
      );
    });
  };

  const handleRegChange = (val) => {
    setReg(val);
    setVehicleStatusWarning(null);

    const match = findMatchingVehicle(val);
    if (match) {
      setReg(match.reg);
      setGarazniBroj(match.garazniBroj && match.garazniBroj !== "-" ? match.garazniBroj : "-");
      setGodProizvodnje(match.godProizvodnje && match.godProizvodnje !== "-" ? match.godProizvodnje : "-");
      const cleanT = cleanVehicleType(match.tipMehan || match.tip || "Teretna vozila");
      setTipMehan(cleanT);
      setMarkaVoz(match.markaVoz || "-");
      setModelVoz(match.modelVoz || "-");
      setIsVehicleLocked(true);

      if (match.status) {
        const st = match.status.toLowerCase();
        if (st.includes("prodat") || st.includes("rashod") || st.includes("neaktivno")) {
          setVehicleStatusWarning(`Upozorenje: Ovo vozilo u šifrarniku ima status "${match.status.toUpperCase()}".`);
        }
      }

      setMatchMessage(null);

      if (cleanT === "Priključna vozila" || cleanT === "Radna mašina") {
        setKilometraza("");
        setRadniSati("");
      } else if (cleanT === "Skladišna mehanizacija") {
        setRadniSati("0");
        setKilometraza("");
      } else {
        triggerOdometerMatch(match.reg, match.garazniBroj, datum);
      }
    } else {
      if (!val.trim()) {
        setGarazniBroj("");
        setGodProizvodnje("");
        setMarkaVoz("");
        setModelVoz("");
        setIsVehicleLocked(false);
        setMatchMessage(null);
        setKilometraza("");
        setRadniSati("0");
      }
    }
  };

  const handleTipMehanChange = (newTip) => {
    const cleanT = cleanVehicleType(newTip);
    setTipMehan(cleanT);
    setMatchMessage(null);
    if (cleanT === "Priključna vozila" || cleanT === "Radna mašina") {
      setKilometraza("");
      setRadniSati("");
    } else if (cleanT === "Skladišna mehanizacija") {
      setRadniSati("0");
      setKilometraza("");
    } else {
      if (reg.trim()) {
        triggerOdometerMatch(reg, garazniBroj, datum);
      }
    }
  };

  // Automatski proračun ukupnog troška (dijelovi + rad)
  const handleCostPartChange = (val) => {
    setCostPart(val);
    const p = parseFloat(val) || 0;
    const s = parseFloat(costService) || 0;
    if (p + s > 0) {
      setCost((p + s).toFixed(2));
    } else if (!val && !costService) {
      setCost("");
    }
  };

  const handleCostServiceChange = (val) => {
    setCostService(val);
    const p = parseFloat(costPart) || 0;
    const s = parseFloat(val) || 0;
    if (p + s > 0) {
      setCost((p + s).toFixed(2));
    } else if (!costPart && !val) {
      setCost("");
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
      await showAlert({
        title: "Greška pri učitavanju",
        message: "Greška pri učitavanju računa: " + err.message,
        variant: "danger"
      });
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

  const handleRequestClose = async () => {
    const hasData = !!(reg || opis || cost || brojRacuna || dobavljac || invoiceUrl);
    if (!hasData) {
      onClose();
      return;
    }
    const confirmCancel = await confirm({
      title: "Prekid unosa",
      message: "Da li ste sigurni da želite odustati od unosa troška? Svi uneseni podaci bit će poništeni.",
      confirmText: "Odustani od unosa",
      cancelText: "Nastavi unos",
      variant: "warning"
    });
    if (confirmCancel) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reg.trim()) {
      await showAlert({
        title: "Obavezno polje",
        message: "Molimo unesite registraciju ili odaberite vozilo!",
        variant: "warning"
      });
      return;
    }
    if (!datum) {
      await showAlert({
        title: "Obavezno polje",
        message: "Molimo odaberite datum intervencije!",
        variant: "warning"
      });
      return;
    }
    if (!opis.trim()) {
      await showAlert({
        title: "Obavezno polje",
        message: "Molimo unesite opis kvara ili servisnih radova!",
        variant: "warning"
      });
      return;
    }
    const totalCostNum = parseFloat(cost);
    if (isNaN(totalCostNum) || totalCostNum <= 0) {
      await showAlert({
        title: "Neispravan iznos",
        message: "Molimo unesite ispravan iznos troška u polje 'Total Trošak'!",
        variant: "warning"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const dateObj = new Date(datum);
      const year = isNaN(dateObj.getFullYear()) ? new Date().getFullYear() : dateObj.getFullYear();
      const month = isNaN(dateObj.getMonth()) ? new Date().getMonth() + 1 : dateObj.getMonth() + 1;

      let finalKm = null;
      let finalHours = null;
      const cleanT = cleanVehicleType(tipMehan);

      if (cleanT === "Priključna vozila" || cleanT === "Radna mašina") {
        finalKm = null;
        finalHours = null;
      } else if (cleanT === "Skladišna mehanizacija") {
        finalHours = radniSati !== "" ? parseFloat(radniSati) : 0;
        finalKm = null;
      } else {
        finalKm = kilometraza !== "" ? parseInt(kilometraza, 10) : null;
        finalHours = null;
      }

      const isInternal =
        dobavljac.toLowerCase().includes("intern") ||
        vrstaTroska === "Interni rad / servis" ||
        vrstaTroska === "Interno";

      const newRecord = {
        reg: reg.trim().toUpperCase(),
        garazniBroj: garazniBroj.trim() || "-",
        godProizvodnje: godProizvodnje.trim() || "-",
        tipMehan: cleanT,
        markaVoz: markaVoz.trim() || "-",
        modelVoz: modelVoz.trim() || "-",
        datum: datum,
        datumObj: dateObj,
        year: year,
        month: month,
        kilometraza: finalKm,
        radniSati: finalHours,
        segment: segment || "Redovan servis",
        brojRacuna: brojRacuna.trim() || "-",
        vrstaTroska: vrstaTroska,
        vrstaFakture: vrstaFakture,
        fakturaTip: vrstaFakture,
        type: isInternal ? "Interno" : "Eksterno",
        opisPopravke: opis.trim() || "Servis / Popravka",
        opisRadova: opis.trim() || "Servis / Popravka",
        dobavljacOrig: dobavljac.trim() || "Vlastita Radionica",
        dobavljac: dobavljac.trim() || "Vlastita Radionica",
        costPart: parseFloat(costPart) || 0,
        costService: parseFloat(costService) || 0,
        cost: totalCostNum,
        invoiceUrl: invoiceUrl || "",
        invoiceName: invoiceName || "",
        invoiceType: invoiceType || "",
        userCreated: activeUser?.username || "admin",
        createdAt: new Date().toISOString()
      };

      await onSaveCost(newRecord);
      await showAlert({
        title: "Uspješan unos",
        message: `Servisni nalog za vozilo ${reg} je uspješno upisan u bazu podataka!`,
        variant: "success"
      });
      onClose();
    } catch (err) {
      await showAlert({
        title: "Greška pri unosu",
        message: "Greška pri unosu: " + err.message,
        variant: "danger"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isKmApplicable =
    cleanVehicleType(tipMehan) !== "Priključna vozila" &&
    cleanVehicleType(tipMehan) !== "Radna mašina" &&
    cleanVehicleType(tipMehan) !== "Skladišna mehanizacija";

  const isHoursApplicable = cleanVehicleType(tipMehan) === "Skladišna mehanizacija";

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 flex justify-center items-center z-[70] backdrop-blur-xs p-3 sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 cursor-default"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 to-teal-950 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <PlusCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight flex items-center gap-2">
                <span>Unos novog troška / servisnog naloga</span>
              </h3>
              <p className="text-[11px] text-emerald-200">
                Evidentirajte servis ili trošak direktno u bazu uz automatska pravila šifrarnika
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
            title="Zatvori (uz potvrdu)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Forma sa sekcijama */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1 bg-slate-50 dark:bg-slate-900/60"
        >
          {/* Upozorenje za status vozila ako nije aktivno */}
          {vehicleStatusWarning && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center gap-2.5 text-amber-800 dark:text-amber-300 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{vehicleStatusWarning}</span>
            </div>
          )}

          {/* SEKCIJA 1: OSNOVNI PODACI O VOZILU / MEHANIZACIJI */}
          <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-lg text-emerald-700 dark:text-emerald-400">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">
                    1. Osnovni podaci o vozilu / mehanizaciji
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Izborom registracije ili garažnog broja automatski se popunjavaju i zaključavaju podaci iz šifrarnika
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isVehicleLocked ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
                      <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Šifrarnik: Zaključano</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsVehicleLocked(false)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 text-xs font-bold transition-all cursor-pointer"
                      title="Kliknite ako želite ručno promijeniti podatke o vozilu"
                    >
                      <Unlock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Otključaj polja</span>
                    </button>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold">
                    <Unlock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Ručni unos / Otključano</span>
                  </span>
                )}
              </div>
            </div>

            {/* Fino poravnat grid 4 kolone na većim ekranima */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Red 1 - Kolona 1: Reg oznaka */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Reg. oznaka <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  list="modalVehicleList"
                  required
                  value={reg}
                  onChange={(e) => handleRegChange(e.target.value)}
                  placeholder="Npr. M04-E-456 ili 40567"
                  className="w-full h-10 border border-slate-300 dark:border-slate-600 rounded-xl px-3 font-black uppercase outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-slate-900 dark:text-white shadow-2xs text-xs"
                />
                <datalist id="modalVehicleList">
                  {masterFleet.map((v, i) => {
                    const gbStr = v.garazniBroj && v.garazniBroj !== "-" ? ` [GB: ${v.garazniBroj}]` : "";
                    const markaStr = v.markaVoz && v.markaVoz !== "-" ? ` - ${v.markaVoz}` : "";
                    return (
                      <React.Fragment key={`${v.reg || i}_${v.garazniBroj || ""}`}>
                        <option value={`${v.reg}${gbStr}${markaStr}`} />
                        {v.garazniBroj && v.garazniBroj !== "-" && v.garazniBroj !== v.reg && (
                          <option value={`${v.garazniBroj} (${v.reg})${markaStr}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </datalist>
              </div>

              {/* Red 1 - Kolona 2: Garažni broj */}
              <div>
                <div className="flex items-center justify-between mb-1.5 h-4">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    Garažni broj (MT)
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">🔒 Šifrarnik</span>
                </div>
                <input
                  type="text"
                  readOnly={isVehicleLocked}
                  value={garazniBroj}
                  onChange={(e) => setGarazniBroj(e.target.value)}
                  placeholder="Garažni broj..."
                  className={`w-full h-10 border rounded-xl px-3 font-bold outline-none text-xs transition-all ${
                    isVehicleLocked
                      ? "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                      : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500"
                  }`}
                />
              </div>

              {/* Red 1 - Kolona 3: Tip mehanizacije */}
              <div>
                <div className="flex items-center justify-between mb-1.5 h-4">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    Tip mehanizacije
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">🔒 Šifrarnik</span>
                </div>
                <select
                  disabled={isVehicleLocked}
                  value={tipMehan}
                  onChange={(e) => handleTipMehanChange(e.target.value)}
                  className={`w-full h-10 border rounded-xl px-3 font-bold outline-none text-xs transition-all ${
                    isVehicleLocked
                      ? "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                      : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  }`}
                >
                  <option value="Teretna vozila">Teretna vozila</option>
                  <option value="Putnička vozila">Putnička vozila</option>
                  <option value="Skladišna mehanizacija">Skladišna mehanizacija</option>
                  <option value="Priključna vozila">Priključna vozila</option>
                  <option value="Radna mašina">Radna mašina</option>
                  <option value="Servis motornih vozila">Servis motornih vozila</option>
                </select>
              </div>

              {/* Red 1 - Kolona 4: Godište */}
              <div>
                <div className="flex items-center justify-between mb-1.5 h-4">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    Godište
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">🔒 Šifrarnik</span>
                </div>
                <input
                  type="text"
                  readOnly={isVehicleLocked}
                  value={godProizvodnje}
                  onChange={(e) => setGodProizvodnje(e.target.value)}
                  placeholder="Godište..."
                  className={`w-full h-10 border rounded-xl px-3 font-semibold outline-none text-xs transition-all ${
                    isVehicleLocked
                      ? "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                      : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500"
                  }`}
                />
              </div>

              {/* Red 2 - Kolona 1: Marka vozila */}
              <div>
                <div className="flex items-center justify-between mb-1.5 h-4">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    Marka vozila
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">🔒 Šifrarnik</span>
                </div>
                <input
                  type="text"
                  readOnly={isVehicleLocked}
                  value={markaVoz}
                  onChange={(e) => setMarkaVoz(e.target.value)}
                  placeholder="Marka..."
                  className={`w-full h-10 border rounded-xl px-3 font-semibold outline-none text-xs transition-all ${
                    isVehicleLocked
                      ? "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                      : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500"
                  }`}
                />
              </div>

              {/* Red 2 - Kolona 2: Model vozila */}
              <div>
                <div className="flex items-center justify-between mb-1.5 h-4">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    Model vozila
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">🔒 Šifrarnik</span>
                </div>
                <input
                  type="text"
                  readOnly={isVehicleLocked}
                  value={modelVoz}
                  onChange={(e) => setModelVoz(e.target.value)}
                  placeholder="Model..."
                  className={`w-full h-10 border rounded-xl px-3 font-semibold outline-none text-xs transition-all ${
                    isVehicleLocked
                      ? "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                      : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500"
                  }`}
                />
              </div>

              {/* Red 2 - Kolone 3 & 4 (raspon 2 kolone): Dinamičko polje Kilometraža / Radni sati */}
              <div className="sm:col-span-2">
                {isKmApplicable ? (
                  <div>
                    <div className="flex items-center justify-between mb-1.5 h-4">
                      <label className="block text-xs font-bold uppercase text-indigo-900 dark:text-indigo-300">
                        🛣️ Kilometraža na datum servisa (km)
                      </label>
                      <button
                        type="button"
                        onClick={() => triggerOdometerMatch(reg, garazniBroj, datum)}
                        disabled={isMatchingMileage || !reg.trim()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/70 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                        title="Pretražuje najbliže točenje goriva za ovo vozilo"
                      >
                        {isMatchingMileage ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        )}
                        <span>⚡ Poklopi sa točenjem goriva</span>
                      </button>
                    </div>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={kilometraza}
                      onChange={(e) => {
                        setKilometraza(e.target.value);
                        setMatchMessage(null);
                      }}
                      placeholder="Npr. 285400 (ili kliknite 'Poklopi sa točenjem')"
                      className="w-full h-10 border border-indigo-300 dark:border-indigo-700/80 rounded-xl px-3 font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 text-slate-900 dark:text-white text-xs"
                    />

                    {matchMessage && (
                      <div
                        className={`mt-1.5 p-2 rounded-lg text-xs flex items-center gap-1.5 font-medium ${
                          matchMessage.success
                            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                        }`}
                      >
                        {matchMessage.success ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        ) : (
                          <X className="w-4 h-4 shrink-0 text-amber-600" />
                        )}
                        <span>{matchMessage.text}</span>
                      </div>
                    )}
                  </div>
                ) : isHoursApplicable ? (
                  <div>
                    <div className="flex items-center justify-between mb-1.5 h-4">
                      <label className="block text-xs font-bold uppercase text-amber-900 dark:text-amber-300">
                        ⏱️ Radni sati na datum servisa (h)
                      </label>
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-extrabold bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                        🚜 Skladišna mehanizacija
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={radniSati}
                      onChange={(e) => setRadniSati(e.target.value)}
                      placeholder="Npr. 4250"
                      className="w-full h-10 border border-amber-300 dark:border-amber-700 rounded-xl px-3 font-bold outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/40 dark:bg-amber-950/30 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="mb-1.5 h-4">
                      <label className="block text-xs font-bold uppercase text-slate-400 dark:text-slate-500">
                        Status očitanja (KM / Sati)
                      </label>
                    </div>
                    <div className="w-full h-10 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl px-3 bg-slate-50/80 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 flex items-center justify-center text-xs font-medium">
                      <span>Ovaj tip mehanizacije ne bilježi kilometre ni radne sate</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SEKCIJA 2: DETALJI SERVISA I FAKTURE */}
          <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/80 pb-3">
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-lg text-emerald-700 dark:text-emerald-400">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">
                  2. Detalji servisa i fakture
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Datum intervencije <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={datum}
                  onChange={(e) => {
                    setDatum(e.target.value);
                    if (isKmApplicable && reg.trim()) {
                      triggerOdometerMatch(reg, garazniBroj, e.target.value);
                    }
                  }}
                  className="w-full h-10 border border-slate-300 dark:border-slate-600 rounded-xl px-3 font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Broj računa / RN
                </label>
                <input
                  type="text"
                  value={brojRacuna}
                  onChange={(e) => setBrojRacuna(e.target.value)}
                  placeholder="Npr. RN-2026/014"
                  className="w-full h-10 border border-slate-300 dark:border-slate-600 rounded-xl px-3 font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Serviser / izvođač
                </label>
                <input
                  type="text"
                  list="modalSupplierList"
                  value={dobavljac}
                  onChange={(e) => setDobavljac(e.target.value)}
                  placeholder="Npr. Centralni Servis, MAN..."
                  className="w-full h-10 border border-slate-300 dark:border-slate-600 rounded-xl px-3 font-semibold outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                />
                <datalist id="modalSupplierList">
                  {commonSuppliers.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                Opis kvara / servisnih radova <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={opis}
                onChange={(e) => setOpis(e.target.value)}
                placeholder="Unesite detaljan opis zamijenjenih dijelova ili izvršenih usluga..."
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-3 font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
              />
            </div>

            {/* Cloud Prilog / Upload računa */}
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-2">
              <label className="block font-extrabold uppercase text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Slika / skenirana faktura ili račun (Firebase Storage)</span>
                </span>
                {invoiceUrl ? (
                  <button
                    type="button"
                    onClick={handleRemoveInvoice}
                    className="text-[11px] text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Ukloni račun
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-normal">☁️ Cloud prilog</span>
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
                <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-extrabold text-slate-900 dark:text-white truncate">
                        {invoiceName || "Priloženi Račun"}
                      </p>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Račun je spreman za spremanje uz nalog
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 font-bold rounded-lg text-xs shadow-2xs cursor-pointer"
                  >
                    Zamijeni
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingInvoice}
                  className="w-full border-2 border-dashed border-emerald-300/80 dark:border-emerald-700/80 hover:border-emerald-500 bg-white/70 dark:bg-slate-800/60 hover:bg-emerald-50/50 p-4 rounded-xl transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50 text-center"
                >
                  {isUploadingInvoice ? (
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold py-1">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Slanje računa u Cloud Storage...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Kliknite ovdje za odabir skenirane fakture ili slike računa
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Podržani formati: PDF, JPG, PNG. Račun se trajno veže za ovaj servisni unos.
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* SEKCIJA 3: KATEGORIZACIJA I VRSTA TROŠKA */}
          <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/80 pb-3">
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-lg text-emerald-700 dark:text-emerald-400">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">
                  3. Kategorizacija i vrsta troška
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Segment troška <span className="text-red-500">*</span>
                </label>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="w-full h-10 border border-slate-300 dark:border-slate-600 rounded-xl px-3 font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer text-xs"
                >
                  <option value="Redovan servis">Redovan servis</option>
                  <option value="Mehanika">Mehanika</option>
                  <option value="Guma">Guma</option>
                  <option value="Elektronika">Elektronika</option>
                  <option value="Hidraulika">Hidraulika</option>
                  <option value="Signalizacija">Signalizacija</option>
                  <option value="Tečnost">Tečnost</option>
                  <option value="Ostalo">Ostalo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Vrsta troška
                </label>
                <select
                  value={vrstaTroska}
                  onChange={(e) => setVrstaTroska(e.target.value)}
                  className="w-full h-10 border border-slate-300 dark:border-slate-600 rounded-xl px-3 font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer text-xs"
                >
                  <option value="Eksterni dobavljač">Eksterni dobavljač</option>
                  <option value="Interni rad / servis">Interni rad / servis</option>
                  <option value="Rezervni dio">Rezervni dio</option>
                  <option value="Ostalo">Ostalo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Vrsta fakture
                </label>
                <select
                  value={vrstaFakture}
                  onChange={(e) => setVrstaFakture(e.target.value)}
                  className="w-full h-10 border border-slate-300 dark:border-slate-600 rounded-xl px-3 font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer text-xs"
                >
                  <option value="Kombinovana faktura (Dijelovi + Usluga)">
                    Kombinovana faktura (Dijelovi + Usluga)
                  </option>
                  <option value="Faktura za rezervne dijelove">Faktura za rezervne dijelove</option>
                  <option value="Faktura za rad / uslugu">Faktura za rad / uslugu</option>
                  <option value="Interni radni nalog">Interni radni nalog</option>
                </select>
              </div>
            </div>
          </div>

          {/* SEKCIJA 4: FINANSIJSKI OBRAČUN (AUTOMATSKI TOTAL) */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-emerald-950/40 p-4 sm:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/70 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-emerald-200/70 dark:border-emerald-800/60 pb-3">
              <div className="p-1.5 bg-emerald-200/70 dark:bg-emerald-900/60 rounded-lg text-emerald-800 dark:text-emerald-300">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-emerald-950 dark:text-emerald-200 tracking-wider">
                  4. Finansijski obračun (automatski total)
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Cijena rezervnog dijela (KM)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPart}
                  onChange={(e) => handleCostPartChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-10 border border-slate-300 dark:border-slate-600 rounded-xl px-3 font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Cijena usluge / rada (KM)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costService}
                  onChange={(e) => handleCostServiceChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-10 border border-slate-300 dark:border-slate-600 rounded-xl px-3 font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-emerald-950 dark:text-emerald-200 mb-1.5">
                  Total trošak (KM sa PDV) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-10 border-2 border-emerald-600 dark:border-emerald-500 rounded-xl px-3 font-black text-emerald-700 dark:text-emerald-300 outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-sm shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Footer Dugmad */}
          <div className="pt-2 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleRequestClose}
              className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-all cursor-pointer text-xs"
            >
              Odustani
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingInvoice}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Spremanje u toku...</span>
                </>
              ) : (
                <>
                  <span>💾 Sačuvaj trošak u bazu</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
