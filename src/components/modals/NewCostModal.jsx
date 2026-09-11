"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
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
  AlertTriangle,
  Truck,
  Wrench,
  Tag,
  DollarSign,
  Search,
  ChevronDown,
  AlertCircle,
  Check
} from "lucide-react";
import { uploadMediaFile } from "@/lib/fileUpload.js";
import { cleanVehicleType, formatDate, normalizeVehicleStatus } from "@/lib/calculations.js";
import { useConfirm } from "@/context/ConfirmContext.jsx";

export function NewCostModal({
  isOpen,
  onClose,
  masterFleet = [],
  onSaveCost,
  activeUser
}) {
  const { confirm, alert: showAlert } = useConfirm();

  // Filtriraj SAMO aktivna vozila iz šifrarnika (isključi rashodovana, prodata i neaktivna)
  const activeFleet = useMemo(() => {
    return (masterFleet || []).filter((v) => {
      if (!v) return false;
      const hasIdentifier = !!(v.reg && v.reg.trim()) || !!(v.garazniBroj && v.garazniBroj !== "-");
      if (!hasIdentifier) return false;
      return normalizeVehicleStatus(v.status) === "Aktivno";
    });
  }, [masterFleet]);

  // Stanja za pretragu i odabir aktivnog vozila
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const dropdownRef = useRef(null);

  // Osnovni podaci o vozilu (autofill iz šifrarnika - trajno zaključani)
  const [reg, setReg] = useState("");
  const [garazniBroj, setGarazniBroj] = useState("");
  const [godProizvodnje, setGodProizvodnje] = useState("");
  const [tipMehan, setTipMehan] = useState("Teretna vozila");
  const [markaVoz, setMarkaVoz] = useState("");
  const [modelVoz, setModelVoz] = useState("");

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

  // Prilog računa / fakture (opcionalno)
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [invoiceName, setInvoiceName] = useState("");
  const [invoiceType, setInvoiceType] = useState("");
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // Reset forme pri otvaranju modala
  useEffect(() => {
    if (isOpen) {
      setReg("");
      setSelectedVehicle(null);
      setVehicleSearch("");
      setIsDropdownOpen(false);
      setGarazniBroj("");
      setGodProizvodnje("");
      setTipMehan("Teretna vozila");
      setMarkaVoz("");
      setModelVoz("");
      setDatum(new Date().toISOString().split("T")[0]);
      setBrojRacuna("");
      setDobavljac("");
      setOpis("");
      setSegment("Redovan servis");
      setVrstaTroska("Eksterni dobavljač");
      setVrstaFakture("Kombinovana faktura (Dijelovi + Usluga)");
      setCostPart("");
      setCostService("");
      setCost("");
      setKilometraza("");
      setRadniSati("0");
      setInvoiceUrl("");
      setInvoiceName("");
      setInvoiceType("");
      setMatchMessage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [isOpen]);

  // Zatvori padajući meni na klik izvan
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lista jedinstvenih dobavljača za predlaganje
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

  // Detektuj ako korisnik pretražuje vozilo koje postoji ali NIJE aktivno (npr. rashodovano ili prodato)
  const inactiveFleetMatch = useMemo(() => {
    if (!vehicleSearch.trim() || selectedVehicle) return null;
    const raw = vehicleSearch.trim().toLowerCase();
    const term = raw.replace(/[\s-]/g, "");
    if (term.length < 3) return null;

    return (masterFleet || []).find((v) => {
      if (normalizeVehicleStatus(v.status) === "Aktivno") return false;
      const regNorm = (v.reg || "").toLowerCase().replace(/[\s-]/g, "");
      const gbNorm = (v.garazniBroj || "").toString().toLowerCase().replace(/[\s-]/g, "");
      return (regNorm && regNorm === term) || (gbNorm && gbNorm !== "-" && gbNorm === term);
    });
  }, [masterFleet, vehicleSearch, selectedVehicle]);

  // Filtrirana lista aktivnih vozila za prikaz u padajućem meniju
  const filteredActiveFleet = useMemo(() => {
    const raw = (vehicleSearch || "").trim().toLowerCase();
    if (!raw) return activeFleet.slice(0, 60);

    const term = raw.replace(/[\s-]/g, "");
    return activeFleet
      .filter((v) => {
        const regNorm = (v.reg || "").toLowerCase().replace(/[\s-]/g, "");
        const gbNorm = (v.garazniBroj || "").toString().toLowerCase().replace(/[\s-]/g, "");
        const marka = (v.markaVoz || "").toLowerCase();
        const model = (v.modelVoz || "").toLowerCase();
        const tip = (v.tipMehan || "").toLowerCase();
        const pj = (v.poslovnaJedinica || "").toLowerCase();

        return (
          regNorm.includes(term) ||
          gbNorm.includes(term) ||
          marka.includes(raw) ||
          model.includes(raw) ||
          tip.includes(raw) ||
          pj.includes(raw)
        );
      })
      .slice(0, 60);
  }, [activeFleet, vehicleSearch]);

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

  // Izbor vozila iz padajućeg menija šifrarnika
  const handleSelectVehicle = (vehicle) => {
    if (!vehicle) return;
    setSelectedVehicle(vehicle);
    const chosenReg = (vehicle.reg || vehicle.garazniBroj || "").trim().toUpperCase();
    setReg(chosenReg);
    setVehicleSearch(chosenReg);
    setIsDropdownOpen(false);

    // Autofill i striktno zaključavanje podataka iz šifrarnika
    setGarazniBroj(vehicle.garazniBroj && vehicle.garazniBroj !== "-" ? vehicle.garazniBroj : "-");
    setGodProizvodnje(vehicle.godProizvodnje && vehicle.godProizvodnje !== "-" ? vehicle.godProizvodnje : "-");
    const cleanT = cleanVehicleType(vehicle.tipMehan || vehicle.tip || "Teretna vozila");
    setTipMehan(cleanT);
    setMarkaVoz(vehicle.markaVoz || "-");
    setModelVoz(vehicle.modelVoz || "-");

    setMatchMessage(null);
    if (cleanT === "Priključna vozila" || cleanT === "Radna mašina") {
      setKilometraza("");
      setRadniSati("");
    } else if (cleanT === "Skladišna mehanizacija") {
      setRadniSati("0");
      setKilometraza("");
    } else {
      triggerOdometerMatch(chosenReg, vehicle.garazniBroj, datum);
    }
  };

  // Uklanjanje / promjena odabranog vozila
  const handleClearVehicle = () => {
    setSelectedVehicle(null);
    setReg("");
    setVehicleSearch("");
    setGarazniBroj("");
    setGodProizvodnje("");
    setTipMehan("Teretna vozila");
    setMarkaVoz("");
    setModelVoz("");
    setMatchMessage(null);
    setKilometraza("");
    setRadniSati("0");
    setIsDropdownOpen(true);
  };

  // Promjena teksta u polju za pretragu vozila
  const handleSearchChange = (val) => {
    setVehicleSearch(val);
    setIsDropdownOpen(true);

    if (selectedVehicle && val !== selectedVehicle.reg) {
      setSelectedVehicle(null);
      setReg("");
      setGarazniBroj("");
      setGodProizvodnje("");
      setTipMehan("Teretna vozila");
      setMarkaVoz("");
      setModelVoz("");
      setMatchMessage(null);
      setKilometraza("");
      setRadniSati("0");
    }

    // Ako unos tačno odgovara aktivnom vozilu, automatski ga odaberi
    const cleanTerm = val.trim().toUpperCase().replace(/[\s-]/g, "");
    if (cleanTerm) {
      const exactMatch = activeFleet.find((v) => {
        const rNorm = (v.reg || "").toUpperCase().replace(/[\s-]/g, "");
        const gNorm = (v.garazniBroj || "").toString().toUpperCase().replace(/[\s-]/g, "");
        return (rNorm && rNorm === cleanTerm) || (gNorm && gNorm !== "-" && gNorm === cleanTerm);
      });
      if (exactMatch) {
        handleSelectVehicle(exactMatch);
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

  const isKmApplicable =
    cleanVehicleType(tipMehan) !== "Priključna vozila" &&
    cleanVehicleType(tipMehan) !== "Radna mašina" &&
    cleanVehicleType(tipMehan) !== "Skladišna mehanizacija";

  const isHoursApplicable = cleanVehicleType(tipMehan) === "Skladišna mehanizacija";

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validacija vozila: mora postojati u šifrarniku i imati status "Aktivno"
    if (!selectedVehicle || !reg.trim()) {
      await showAlert({
        title: "Obavezno polje: Vozilo",
        message: "Molimo odaberite postojeće aktivno vozilo iz padajućeg menija! Unos nepostojećih ili neaktivnih vozila nije dozvoljen.",
        variant: "warning"
      });
      return;
    }

    const isActive = activeFleet.some(
      (v) =>
        (v.reg || "").toUpperCase() === reg.trim().toUpperCase() ||
        (v.garazniBroj && v.garazniBroj !== "-" && v.garazniBroj.toString().toUpperCase() === reg.trim().toUpperCase())
    );
    if (!isActive) {
      await showAlert({
        title: "Nedozvoljeno vozilo",
        message: `Vozilo "${reg}" ne postoji u bazi aktivnih vozila ili ima status koji nije "Aktivno"! Odaberite vozilo iz padajućeg menija šifrarnika.`,
        variant: "danger"
      });
      return;
    }

    // 2. Datum intervencije
    if (!datum) {
      await showAlert({
        title: "Obavezno polje: Datum",
        message: "Molimo odaberite datum intervencije / servisa!",
        variant: "warning"
      });
      return;
    }

    // 3. Broj računa / RN
    if (!brojRacuna.trim()) {
      await showAlert({
        title: "Obavezno polje: Broj računa",
        message: "Molimo unesite broj računa ili radnog naloga (RN)!",
        variant: "warning"
      });
      return;
    }

    // 4. Serviser / Dobavljač
    if (!dobavljac.trim()) {
      await showAlert({
        title: "Obavezno polje: Serviser / Dobavljač",
        message: "Molimo unesite ili odaberite servisera / izvođača radova!",
        variant: "warning"
      });
      return;
    }

    // 5. Opis kvara / servisnih radova
    if (!opis.trim()) {
      await showAlert({
        title: "Obavezno polje: Opis radova",
        message: "Molimo unesite detaljan opis kvara ili izvršenih servisnih radova!",
        variant: "warning"
      });
      return;
    }

    // 6. Segment troška
    if (!segment || !segment.trim()) {
      await showAlert({
        title: "Obavezno polje: Segment troška",
        message: "Molimo odaberite segment troška!",
        variant: "warning"
      });
      return;
    }

    // 7. Vrsta troška
    if (!vrstaTroska || !vrstaTroska.trim()) {
      await showAlert({
        title: "Obavezno polje: Vrsta troška",
        message: "Molimo odaberite vrstu troška!",
        variant: "warning"
      });
      return;
    }

    // 8. Vrsta fakture
    if (!vrstaFakture || !vrstaFakture.trim()) {
      await showAlert({
        title: "Obavezno polje: Vrsta fakture",
        message: "Molimo odaberite vrstu fakture!",
        variant: "warning"
      });
      return;
    }

    // 9. Kilometraža (obavezna za cestovna vozila)
    if (isKmApplicable) {
      if (!kilometraza || kilometraza.trim() === "" || isNaN(Number(kilometraza)) || Number(kilometraza) < 0) {
        await showAlert({
          title: "Obavezno polje: Kilometraža",
          message: "Molimo unesite kilometražu na datum servisa za odabrano vozilo (ili kliknite 'Poklopi sa točenjem')!",
          variant: "warning"
        });
        return;
      }
    }

    // 10. Radni sati (obavezni za skladišnu mehanizaciju)
    if (isHoursApplicable) {
      if (radniSati === "" || isNaN(Number(radniSati)) || Number(radniSati) < 0) {
        await showAlert({
          title: "Obavezno polje: Radni sati",
          message: "Molimo unesite radne sate skladišne mehanizacije na datum servisa!",
          variant: "warning"
        });
        return;
      }
    }

    // 11. Total trošak
    const totalCostNum = parseFloat(cost);
    if (isNaN(totalCostNum) || totalCostNum <= 0) {
      await showAlert({
        title: "Obavezno polje: Total trošak",
        message: "Molimo unesite ispravan ukupni iznos troška u KM (veći od 0 KM)!",
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
        brojRacuna: brojRacuna.trim(),
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

  return (
    <div className="fixed inset-0 bg-slate-900/80 flex justify-center items-center z-[70] backdrop-blur-xs p-3 sm:p-5">
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
                    Dozvoljen je odabir isključivo postojećih aktivnih vozila iz šifrarnika flote
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Šifrarnik: Zaključano</span>
                </span>
              </div>
            </div>

            {/* Odabir aktivnog vozila iz baze (Searchable Dropdown & Autofill) */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                  Odabir vozila iz baze <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  {activeFleet.length} aktivnih jedinica
                </span>
              </div>

              {selectedVehicle ? (
                /* Prikaz odabranog vozila sa potvrdom i dugmetom za promjenu */
                <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border-2 border-emerald-500/60 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black font-mono tracking-wide text-emerald-900 dark:text-emerald-200">
                          {selectedVehicle.reg}
                        </span>
                        {selectedVehicle.garazniBroj && selectedVehicle.garazniBroj !== "-" && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                            GB: {selectedVehicle.garazniBroj}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                          {cleanVehicleType(selectedVehicle.tipMehan || selectedVehicle.tip || "Teretna vozila")}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aktivno
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                        {selectedVehicle.markaVoz || ""} {selectedVehicle.modelVoz || ""}
                        {selectedVehicle.poslovnaJedinica ? ` • ${selectedVehicle.poslovnaJedinica}` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearVehicle}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 shrink-0"
                    title="Odaberi drugo vozilo"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Promijeni vozilo</span>
                  </button>
                </div>
              ) : (
                /* Input za pretragu i padajući meni */
                <div className="relative">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={vehicleSearch}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => setIsDropdownOpen(true)}
                      placeholder="🔍 Kliknite ili unesite registraciju, garažni broj, marku ili model..."
                      className="w-full h-11 border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-10 font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="absolute right-2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Upozorenje ako je vozilo pronađeno ali nije aktivno */}
                  {inactiveFleetMatch && (
                    <div className="mt-2 p-2.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center gap-2 text-amber-900 dark:text-amber-200 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>
                        Vozilo "{inactiveFleetMatch.reg}" u šifrarniku ima status "{inactiveFleetMatch.status || 'Neaktivno'}". Unos troška je dozvoljen isključivo za vozila sa statusom "Aktivno"!
                      </span>
                    </div>
                  )}

                  {/* Padajući meni / Dropdown sa aktivnim vozilima */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                        <span>Prikazano: {filteredActiveFleet.length} aktivnih vozila</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          ✓ Samo aktivna vozila
                        </span>
                      </div>

                      <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 p-1">
                        {filteredActiveFleet.length > 0 ? (
                          filteredActiveFleet.map((v) => {
                            const gbText =
                              v.garazniBroj && v.garazniBroj !== "-" ? `GB: ${v.garazniBroj}` : null;
                            const typeText = cleanVehicleType(v.tipMehan || v.tip || "Teretna vozila");
                            return (
                              <div
                                key={`${v.reg}_${v.garazniBroj || ""}`}
                                onClick={() => handleSelectVehicle(v)}
                                className="p-2.5 rounded-xl flex items-center justify-between gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer transition-colors group text-xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="font-mono font-black text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                                    {v.reg}
                                  </span>
                                  {gbText && (
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold shrink-0">
                                      {gbText}
                                    </span>
                                  )}
                                  <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                                    {v.markaVoz || ""} {v.modelVoz || ""}
                                  </span>
                                  {v.poslovnaJedinica && (
                                    <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                                      ({v.poslovnaJedinica})
                                    </span>
                                  )}
                                </div>
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold shrink-0">
                                  {typeText}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                            <AlertCircle className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                            <p className="font-bold">Nema pronađenih aktivnih vozila.</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Neaktivna, prodata i rashodovana vozila nisu dozvoljena za unos troška.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Podaci o vozilu iz šifrarnika - automatski popunjeni i trajno zaključani */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {/* Garažni broj */}
              <div>
                <div className="flex items-center justify-between mb-1.5 h-4">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    Garažni broj (MT)
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                    🔒 Šifrarnik
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={garazniBroj}
                  placeholder="Garažni broj..."
                  className="w-full h-10 border rounded-xl px-3 font-bold outline-none text-xs bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed select-none"
                />
              </div>

              {/* Tip mehanizacije */}
              <div>
                <div className="flex items-center justify-between mb-1.5 h-4">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    Tip mehanizacije
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                    🔒 Šifrarnik
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={tipMehan}
                  placeholder="Tip mehanizacije..."
                  className="w-full h-10 border rounded-xl px-3 font-bold outline-none text-xs bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed select-none"
                />
              </div>

              {/* Godište */}
              <div>
                <div className="flex items-center justify-between mb-1.5 h-4">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    Godište
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                    🔒 Šifrarnik
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={godProizvodnje}
                  placeholder="Godište..."
                  className="w-full h-10 border rounded-xl px-3 font-semibold outline-none text-xs bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed select-none"
                />
              </div>

              {/* Marka vozila */}
              <div>
                <div className="flex items-center justify-between mb-1.5 h-4">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    Marka vozila
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                    🔒 Šifrarnik
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={markaVoz}
                  placeholder="Marka..."
                  className="w-full h-10 border rounded-xl px-3 font-semibold outline-none text-xs bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed select-none"
                />
              </div>

              {/* Model vozila */}
              <div>
                <div className="flex items-center justify-between mb-1.5 h-4">
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                    Model vozila
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                    🔒 Šifrarnik
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={modelVoz}
                  placeholder="Model..."
                  className="w-full h-10 border rounded-xl px-3 font-semibold outline-none text-xs bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed select-none"
                />
              </div>

              {/* Dinamičko polje Kilometraža / Radni sati (raspon 3 kolone na većim ekranima) */}
              <div className="sm:col-span-2 lg:col-span-3">
                {isKmApplicable ? (
                  <div>
                    <div className="flex items-center justify-between mb-1.5 h-4">
                      <label className="block text-xs font-bold uppercase text-indigo-900 dark:text-indigo-300">
                        🛣️ Kilometraža na datum servisa (km) <span className="text-red-500">*</span>
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
                      required
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
                        ⏱️ Radni sati na datum servisa (h) <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-extrabold bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                        🚜 Skladišna mehanizacija
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      required
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
                  Broj računa / RN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={brojRacuna}
                  onChange={(e) => setBrojRacuna(e.target.value)}
                  placeholder="Npr. RN-2026/014"
                  className="w-full h-10 border border-slate-300 dark:border-slate-600 rounded-xl px-3 font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                  Serviser / izvođač <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
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

            {/* Cloud Prilog / Upload računa (Opcionalno) */}
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-2">
              <label className="block font-extrabold uppercase text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Slika / skenirana faktura ili račun{" "}
                    <span className="text-slate-500 dark:text-slate-400 font-normal lowercase">
                      (opcionalno)
                    </span>
                  </span>
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
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-normal">
                    ☁️ Cloud prilog
                  </span>
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
                        Opcionalno prilaganje: PDF, JPG, PNG. Račun se trajno veže za ovaj servisni unos.
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
                  required
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
                  Vrsta troška <span className="text-red-500">*</span>
                </label>
                <select
                  required
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
                  Vrsta fakture <span className="text-red-500">*</span>
                </label>
                <select
                  required
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
