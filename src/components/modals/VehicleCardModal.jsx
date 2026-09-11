import React, { useEffect, useRef, useMemo, useState } from "react";
import { formatKM, formatDate, cleanVehicleType, formatMileage, formatOperatingHours, getVehicleStatusBadge } from "@/lib/calculations.js";
import Chart from "@/lib/chartSetup.js";
import { InvoicePreviewModal } from "./InvoicePreviewModal.jsx";
import { ErrorBoundary } from "@/components/common/ErrorBoundary.jsx";
import {
  X,
  Printer,
  Wrench,
  BarChart2,
  Edit3,
  RotateCcw,
  FilterX,
  Calendar,
  Sparkles,
  Paperclip,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Camera,
  Download,
  Trash2,
  Star
} from "lucide-react";

export function VehicleCardModal({
  isOpen,
  onClose,
  reg,
  costData,
  masterFleet,
  onOpenEditVehicle,
  onDeleteVehicle,
  currentRole,
  activeUser
}) {
  const isServiser =
    activeUser?.role === "serviser" ||
    activeUser?.role === "mobile_serviser" ||
    currentRole?.roleId === "serviser" ||
    currentRole?.roleId === "mobile_serviser";
  const chartYearRef = useRef(null);
  const chartMonthRef = useRef(null);
  const chartYearInstance = useRef(null);
  const chartMonthInstance = useRef(null);

  // Interaktivni filteri unutar kartona vozila
  const [selectedYearFilter, setSelectedYearFilter] = useState("all");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("all");
  const [colFilterSegment, setColFilterSegment] = useState("all");
  const [colFilterOpis, setColFilterOpis] = useState("");
  const [colFilterSupplier, setColFilterSupplier] = useState("");
  const [colFilterInvoice, setColFilterInvoice] = useState("");
  const [colFilterInternalExternal, setColFilterInternalExternal] = useState("all");

  // Preview stanja za račun i multi-slike vozila
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Pronađi osnovne podatke o vozilu
  const vehicleInfo = useMemo(() => {
    if (!reg) return null;
    const cleanReg = reg.trim().toUpperCase();

    // 1. Potraži u matičnoj bazi voznog parka
    const inMaster = (masterFleet || []).find(
      (v) =>
        (v.reg || "").trim().toUpperCase() === cleanReg ||
        (v.garazniBroj && v.garazniBroj.toString().trim().toUpperCase() === cleanReg)
    );
    if (inMaster) return inMaster;

    // 2. Ako nema u bazi, potraži u troškovima
    const inCosts = (costData || []).find(
      (c) =>
        (c.reg || "").trim().toUpperCase() === cleanReg ||
        (c.garazniBroj && c.garazniBroj.toString().trim().toUpperCase() === cleanReg)
    );
    if (inCosts) {
      return {
        reg: inCosts.reg || reg,
        garazniBroj: inCosts.garazniBroj || "-",
        markaVoz: inCosts.markaVoz || "Nepoznato",
        modelVoz: inCosts.modelVoz || "-",
        tipMehan: inCosts.tipMehan || "Teretno vozilo",
        godProizvodnje: inCosts.godProizvodnje || "-",
        brojSasije: inCosts.brojSasije || "-",
        status: "Aktivno"
      };
    }

    return {
      reg: reg,
      garazniBroj: "-",
      markaVoz: "Vozilo",
      modelVoz: "-",
      tipMehan: "Teretno vozilo",
      godProizvodnje: "-",
      brojSasije: "-",
      status: "Aktivno"
    };
  }, [reg, masterFleet, costData]);

  // Normalizovani niz fotografija vozila (do 10 slika)
  const vehicleImages = useMemo(() => {
    if (!vehicleInfo) return [];
    if (Array.isArray(vehicleInfo.images) && vehicleInfo.images.length > 0) {
      return vehicleInfo.images
        .map((img) => (typeof img === "string" ? img : img.url))
        .filter(Boolean);
    }
    if (vehicleInfo.imageUrl) {
      return [vehicleInfo.imageUrl];
    }
    return [];
  }, [vehicleInfo]);

  const cleanType = cleanVehicleType(vehicleInfo?.tipMehan);
  const isPrikljucno = cleanType === "Priključna vozila" || cleanType === "Radna mašina";
  const usageColTitle = cleanType === "Skladišna mehanizacija"
    ? "Radni sati"
    : "Kilometraža";

  // Hronološka historija servisa za ovo vozilo
  const history = useMemo(() => {
    if (!reg || !costData) return [];
    const cleanReg = reg.trim().toUpperCase();

    const getSafeTime = (item) => {
      if (!item) return 0;
      const d = item.datumObj || item.datum;
      if (!d) return 0;
      if (d instanceof Date && !isNaN(d.getTime())) return d.getTime();
      if (typeof d?.toDate === 'function') return d.toDate().getTime() || 0;
      if (d.seconds !== undefined) return d.seconds * 1000;
      const parsed = new Date(d).getTime();
      return isNaN(parsed) ? 0 : parsed;
    };

    return costData
      .filter((c) => {
        const cReg = (c.reg || "").trim().toUpperCase();
        const cGb = c.garazniBroj ? c.garazniBroj.toString().trim().toUpperCase() : "";
        return cReg === cleanReg || (cGb && cGb === cleanReg);
      })
      .sort((a, b) => getSafeTime(b) - getSafeTime(a));
  }, [reg, costData]);

  // Unikatni segmenti za ovo vozilo
  const distinctSegments = useMemo(() => {
    return Array.from(new Set(history.map((c) => (c.segment || "").trim()).filter(Boolean))).sort();
  }, [history]);

  // Filtrirani servisi na osnovu klikova na grafikone ili in-table filtere
  const filteredHistory = useMemo(() => {
    const opisTerm = colFilterOpis.trim().toLowerCase();
    const supTerm = colFilterSupplier.trim().toLowerCase();
    const invoiceTerm = colFilterInvoice.trim().toLowerCase();

    return history.filter((c) => {
      const matchYear =
        selectedYearFilter === "all" || c.year === parseInt(selectedYearFilter);
      const matchMonth =
        selectedMonthFilter === "all" || c.month === parseInt(selectedMonthFilter);
      const matchSegment =
        colFilterSegment === "all" ||
        (c.segment || "").trim().toLowerCase() === colFilterSegment.toLowerCase();

      const matchOpis =
        !opisTerm ||
        (c.opisPopravke && c.opisPopravke.toLowerCase().includes(opisTerm)) ||
        (c.opisRadova && c.opisRadova.toLowerCase().includes(opisTerm)) ||
        (c.opis && c.opis.toLowerCase().includes(opisTerm));

      const matchSup =
        !supTerm ||
        (c.dobavljacOrig && c.dobavljacOrig.toLowerCase().includes(supTerm)) ||
        (c.dobavljac && c.dobavljac.toLowerCase().includes(supTerm));

      const matchInvoice =
        !invoiceTerm ||
        (c.brojRacuna && c.brojRacuna.toLowerCase().includes(invoiceTerm));

      const isItemInternal =
        c.type === "Interno" ||
        (c.fakturaTip && c.fakturaTip.toLowerCase().includes("intern"));
      const matchInternalExternal =
        colFilterInternalExternal === "all" ||
        (colFilterInternalExternal === "Interno" && isItemInternal) ||
        (colFilterInternalExternal === "Eksterno" && !isItemInternal);

      return (
        matchYear &&
        matchMonth &&
        matchSegment &&
        matchOpis &&
        matchSup &&
        matchInvoice &&
        matchInternalExternal
      );
    });
  }, [
    history,
    selectedYearFilter,
    selectedMonthFilter,
    colFilterSegment,
    colFilterOpis,
    colFilterSupplier,
    colFilterInvoice,
    colFilterInternalExternal
  ]);

  // Ukupno uloženo (ukupno i za filtrirane)
  const totalCost = useMemo(() => {
    return history.reduce((sum, item) => sum + (item.cost || 0), 0);
  }, [history]);

  const filteredTotalCost = useMemo(() => {
    return filteredHistory.reduce((sum, item) => sum + (item.cost || 0), 0);
  }, [filteredHistory]);

  // Podaci po godinama za chart
  const yearlyData = useMemo(() => {
    const years = [2021, 2022, 2023, 2024, 2025, 2026];
    const data = years.map((y) => {
      const yearCost = history
        .filter((c) => c.year === y)
        .reduce((sum, item) => sum + (item.cost || 0), 0);
      return yearCost;
    });
    return { labels: years.map((y) => `${y}.`), years, data };
  }, [history]);

  // Podaci po mjesecima za chart
  const monthlyData = useMemo(() => {
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "Maj", "Jun",
      "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"
    ];
    const data = Array(12).fill(0);

    // Ako je odabrana godina, prikaži mjesece samo za tu godinu, inače zbirno
    const relevantHistory =
      selectedYearFilter === "all"
        ? history
        : history.filter((c) => c.year === parseInt(selectedYearFilter));

    relevantHistory.forEach((c) => {
      if (c.month >= 1 && c.month <= 12) {
        data[c.month - 1] += c.cost || 0;
      }
    });

    return { labels: monthNames, data };
  }, [history, selectedYearFilter]);

  // Resetovanje filtera i slika pri otvaranju novog vozila
  useEffect(() => {
    setSelectedYearFilter("all");
    setSelectedMonthFilter("all");
    setColFilterSegment("all");
    setColFilterOpis("");
    setColFilterSupplier("");
    setSelectedPhotoIndex(0);
    setIsLightboxOpen(false);
  }, [reg]);

  // Tastaturna navigacija za galeriju preko cijelog ekrana (Lijevo, Desno, Esc)
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : vehicleImages.length - 1));
      } else if (e.key === "ArrowRight") {
        setSelectedPhotoIndex((prev) => (prev < vehicleImages.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, vehicleImages.length]);

  // Inicijalizacija i ažuriranje interaktivnih grafikona
  useEffect(() => {
    if (!isOpen || !vehicleInfo) return;

    // 1. Chart po godinama sa interaktivnim klikom
    if (chartYearRef.current) {
      if (chartYearInstance.current) chartYearInstance.current.destroy();
      const ctx = chartYearRef.current.getContext("2d");

      // Pozadinske boje - istakni selektovanu godinu
      const bgColors = yearlyData.years.map((y) => {
        if (selectedYearFilter === "all") return "rgba(79, 70, 229, 0.85)";
        return selectedYearFilter === y.toString()
          ? "rgba(245, 158, 11, 1)" // Amber za odabranu
          : "rgba(79, 70, 229, 0.25)"; // Izblijedi ostale
      });

      chartYearInstance.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: yearlyData.labels,
          datasets: [
            {
              label: "Trošak (KM)",
              data: yearlyData.data,
              backgroundColor: bgColors,
              borderColor: yearlyData.years.map((y) =>
                selectedYearFilter === y.toString() ? "#b45309" : "#4338ca"
              ),
              borderWidth: yearlyData.years.map((y) =>
                selectedYearFilter === y.toString() ? 2 : 0
              ),
              borderRadius: 6,
              hoverBackgroundColor: "rgba(245, 158, 11, 0.9)"
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cursor: "pointer",
          onClick: (event, elements) => {
            if (elements && elements.length > 0) {
              const index = elements[0].index;
              const clickedYear = yearlyData.years[index]?.toString();
              if (clickedYear) {
                setSelectedYearFilter((prev) => (prev === clickedYear ? "all" : clickedYear));
              }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                afterLabel: () => "💡 Klikni za filtriranje tabele"
              }
            },
            datalabels: {
              anchor: "end",
              align: "top",
              color: (context) => {
                const y = yearlyData.years[context.dataIndex]?.toString();
                return selectedYearFilter === y ? "#b45309" : "#4f46e5";
              },
              font: { weight: "bold", size: 9 },
              formatter: (value) => (value > 0 ? formatKM(value) : "")
            }
          },
          scales: {
            y: { beginAtZero: true, display: false },
            x: { grid: { display: false }, ticks: { font: { size: 10, weight: "bold" } } }
          }
        }
      });
    }

    // 2. Chart po mjesecima sa interaktivnim klikom
    if (chartMonthRef.current) {
      if (chartMonthInstance.current) chartMonthInstance.current.destroy();
      const ctx = chartMonthRef.current.getContext("2d");

      chartMonthInstance.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: monthlyData.labels,
          datasets: [
            {
              label: "Mjesečni Utrošak (KM)",
              data: monthlyData.data,
              backgroundColor: monthlyData.labels.map((_, idx) => {
                const m = (idx + 1).toString();
                if (selectedMonthFilter === "all") return "rgba(14, 165, 233, 0.75)";
                return selectedMonthFilter === m
                  ? "rgba(16, 185, 129, 1)" // Emerald za odabrani mjesec
                  : "rgba(14, 165, 233, 0.25)";
              }),
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onClick: (event, elements) => {
            if (elements && elements.length > 0) {
              const index = elements[0].index;
              const clickedMonth = (index + 1).toString();
              setSelectedMonthFilter((prev) => (prev === clickedMonth ? "all" : clickedMonth));
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                afterLabel: () => "💡 Klikni za filtriranje tabele"
              }
            },
            datalabels: { display: false }
          },
          scales: {
            y: { beginAtZero: true, display: false },
            x: { grid: { display: false }, ticks: { font: { size: 9, weight: "bold" } } }
          }
        }
      });
    }

    return () => {
      if (chartYearInstance.current) chartYearInstance.current.destroy();
      if (chartMonthInstance.current) chartMonthInstance.current.destroy();
    };
  }, [isOpen, vehicleInfo, yearlyData, monthlyData, selectedYearFilter, selectedMonthFilter]);

  if (!isOpen || !reg || !vehicleInfo) return null;

  const handlePrint = () => {
    window.print();
  };

  const isAnyFilterActive =
    selectedYearFilter !== "all" ||
    selectedMonthFilter !== "all" ||
    colFilterSegment !== "all" ||
    colFilterOpis !== "" ||
    colFilterSupplier !== "" ||
    colFilterInvoice !== "" ||
    colFilterInternalExternal !== "all";

  const resetAllCardFilters = () => {
    setSelectedYearFilter("all");
    setSelectedMonthFilter("all");
    setColFilterSegment("all");
    setColFilterOpis("");
    setColFilterSupplier("");
    setColFilterInvoice("");
    setColFilterInternalExternal("all");
  };

  const monthNamesFull = [
    "Januar", "Februar", "Mart", "April", "Maj", "Juni",
    "Juli", "August", "Septembar", "Oktobar", "Novembar", "Decembar"
  ];

  const canEditVehicle =
    !isServiser &&
    (currentRole?.permissions?.canRegisterVehicle ||
      currentRole?.permissions?.canEditCosts ||
      currentRole?.roleId === "superadmin");

  const isSuperadmin =
    activeUser?.role === "superadmin" ||
    currentRole?.roleId === "superadmin" ||
    activeUser?.username === "emir.durakovic";

  const statusBadge = getVehicleStatusBadge(vehicleInfo?.status);

  return (
    <ErrorBoundary title="Greška pri prikazu servisnog kartona" onClose={onClose}>
      <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/80 flex justify-center items-center z-[70] backdrop-blur-xs p-3 sm:p-5 cursor-pointer print:p-0 print:bg-white"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 cursor-default print:border-none print:shadow-none print:h-auto print:max-h-none print:w-full print:rounded-none"
      >
        {/* Print Only Header */}
        <div className="hidden print:block p-4 border-b-2 border-slate-800 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                BINGO d.o.o. Tuzla
              </h1>
              <p className="text-xs text-slate-600 font-bold">
                Služba održavanja transporta i skladišne mehanizacije
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-sm font-black text-slate-900">
                SERVISNA KARTICA VOZILA
              </h2>
              <p className="text-[10px] text-slate-500 font-mono">
                Datum štampe: {new Date().toLocaleDateString("bs-BA")}
              </p>
            </div>
          </div>
        </div>

        {/* Header Modala */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex justify-between items-start print:bg-slate-100 print:text-slate-900 print:p-4 print:rounded-lg print:border print:border-slate-300">
          <div>
            <div className="flex items-center gap-3">
              {vehicleImages.length > 0 ? (
                <div
                  onClick={() => setIsLightboxOpen(true)}
                  className="relative group cursor-pointer shrink-0 print:hidden"
                  title="Klikni za prikaz galerije slika"
                >
                  <img
                    src={vehicleImages[selectedPhotoIndex] || vehicleImages[0]}
                    alt={vehicleInfo.reg}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-white/40 shadow-md group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-[10px] font-black text-white px-1.5 py-0.2 rounded-full border border-white dark:border-slate-900 shadow leading-none">
                    📷 {vehicleImages.length}
                  </span>
                </div>
              ) : (
                <span className="p-2.5 bg-white/10 rounded-2xl border border-white/20 text-2xl print:hidden shrink-0">
                  🚛
                </span>
              )}
              <div>
                <h3 className="text-xl font-black tracking-tight flex items-center gap-2 print:text-lg">
                  <span>{vehicleInfo.reg}</span>
                  <span className="text-xs bg-indigo-500/40 text-indigo-200 border border-indigo-400/50 px-2.5 py-0.5 rounded-full font-mono print:border-slate-400 print:text-slate-800 print:bg-slate-200">
                    GB: {vehicleInfo.garazniBroj || "-"}
                  </span>
                  <span className={`text-xs border px-2.5 py-0.5 rounded-full font-bold ${statusBadge.headerBadge}`}>
                    {statusBadge.status}
                  </span>
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5 print:text-slate-700 font-semibold">
                  {vehicleInfo.markaVoz} {vehicleInfo.modelVoz} • {vehicleInfo.tipMehan} • Godište: {vehicleInfo.godProizvodnje}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            {canEditVehicle && onOpenEditVehicle && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEditVehicle(vehicleInfo);
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs shadow-xs"
                title="Uredi matične podatke vozila"
              >
                <Edit3 className="w-3.5 h-3.5" /> Uredi vozilo
              </button>
            )}
            {isSuperadmin && onDeleteVehicle && (
              <button
                onClick={async () => {
                  if (confirm(`Da li ste sigurni da želite TRAJNO obrisati vozilo "${vehicleInfo.reg}" iz baze podataka?`)) {
                    await onDeleteVehicle(vehicleInfo.reg);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs shadow-xs"
                title="Trajno obriši vozilo iz baze (samo Superadmin)"
              >
                <Trash2 className="w-3.5 h-3.5" /> Obriši vozilo
              </button>
            )}
            <button
              onClick={handlePrint}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
              title="Štampaj karton (PDF)"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sadržaj Modala - Nema outer scrollbar, baza je fiksna */}
        <div className="p-4 sm:p-5 flex flex-col flex-1 min-h-0 overflow-hidden space-y-3.5 bg-slate-50 dark:bg-slate-900/50 text-xs print:p-0 print:space-y-4 print:bg-white print:overflow-visible">
          {/* Statistika */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:grid-cols-3 shrink-0">
            {isServiser ? (
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs print:border-slate-300">
                <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">
                  Tip / kategorija mehanizacije
                </span>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-1 block truncate">
                  {vehicleInfo.tipMehan || "Vozilo"}
                </span>
                <span className="text-[10px] font-bold text-slate-500 block mt-0.5">
                  Garažni broj: {vehicleInfo.garazniBroj || "-"}
                </span>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs print:border-slate-300">
                <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">
                  Ukupno uloženo u održavanje
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block print:text-slate-900">
                  {formatKM(totalCost)}
                </span>
                {isAnyFilterActive && (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mt-0.5">
                    Odabrano: {formatKM(filteredTotalCost)}
                  </span>
                )}
              </div>
            )}
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs print:border-slate-300">
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">
                Broj evidentiranih servisa
              </span>
              <span className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5 block print:text-slate-900">
                {history.length.toLocaleString("bs-BA")} naloga
              </span>
              {isAnyFilterActive && (
                <span className="text-[10px] font-bold text-blue-500 block mt-0.5">
                  Filtrirano: {filteredHistory.length} naloga
                </span>
              )}
            </div>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs print:border-slate-300">
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">
                Broj šasije (VIN)
              </span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 block truncate print:text-slate-900">
                {vehicleInfo.brojSasije || "-"}
              </span>
            </div>
          </div>

          {/* FOTO GALERIJA VOZILA (DO 10 SLIKA) */}
          {vehicleImages.length > 0 ? (
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs print:hidden shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-extrabold uppercase text-[11px] text-slate-700 dark:text-slate-200">
                    Foto galerija vozila
                  </span>
                  <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                    {vehicleImages.length} {vehicleImages.length === 1 ? "fotografija" : "fotografija (do 10)"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Maximize2 className="w-3 h-3" /> Prikaz preko cijelog ekrana
                  </button>
                  {canEditVehicle && onOpenEditVehicle && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenEditVehicle(vehicleInfo);
                      }}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer ml-2"
                    >
                      <Edit3 className="w-3 h-3" /> Upravljaj slikama
                    </button>
                  )}
                </div>
              </div>

              {/* Prikaz slika: Hero slika + horizontalni strip thumbnaila */}
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                {/* Glavna slika preview */}
                <div
                  onClick={() => setIsLightboxOpen(true)}
                  className="relative group rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 w-full sm:w-64 h-36 shrink-0 cursor-pointer shadow-inner"
                >
                  <img
                    src={vehicleImages[selectedPhotoIndex] || vehicleImages[0]}
                    alt={`Vozilo ${vehicleInfo.reg}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/20 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-white/30">
                      <Maximize2 className="w-3.5 h-3.5" /> Uvećaj
                    </span>
                  </div>
                  <div className="absolute bottom-1.5 left-2 bg-black/80 text-white font-mono text-[10px] px-2 py-0.5 rounded-md font-bold">
                    {selectedPhotoIndex + 1} / {vehicleImages.length}
                  </div>
                  {selectedPhotoIndex === 0 && (
                    <div className="absolute top-1.5 left-2 bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-md shadow-md">
                      ★ Glavna
                    </div>
                  )}
                </div>

                {/* Thumbnail strip */}
                <div className="flex-1 w-full flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
                  {vehicleImages.map((url, idx) => (
                    <div
                      key={url + idx}
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`relative rounded-xl overflow-hidden shrink-0 cursor-pointer border-2 transition-all w-20 h-16 sm:w-24 sm:h-20 ${
                        selectedPhotoIndex === idx
                          ? "border-indigo-600 ring-2 ring-indigo-500/50 scale-102 shadow-md"
                          : "border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-black text-white bg-black/70 px-1 rounded">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : canEditVehicle && onOpenEditVehicle ? (
            <div className="bg-indigo-50/60 dark:bg-slate-800/60 p-2.5 px-3.5 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800/80 flex items-center justify-between print:hidden shrink-0">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-500" />
                <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                  Za ovo vozilo još nisu dodane fotografije u bazu.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEditVehicle(vehicleInfo);
                }}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                + Dodaj slike (do 10)
              </button>
            </div>
          ) : null}

          {/* DVA INTERAKTIVNA GRAFIKONA SA KLIKOM ZA CROSS-FILTERING (Sakriveno za servisera) */}
          {!isServiser && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:hidden shrink-0">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-extrabold uppercase text-slate-500 flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-indigo-600" /> Utrošak po godinama (klik za filter)
                  </span>
                  {selectedYearFilter !== "all" && (
                    <button
                      onClick={() => setSelectedYearFilter("all")}
                      className="text-[10px] text-amber-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <FilterX className="w-3 h-3" /> Poništi ({selectedYearFilter}.)
                    </button>
                  )}
                </div>
                <div className="h-[105px] w-full relative">
                  <canvas ref={chartYearRef} />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-extrabold uppercase text-slate-500 flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-sky-500" /> Utrošak po mjesecima (klik za filter)
                  </span>
                  {selectedMonthFilter !== "all" && (
                    <button
                      onClick={() => setSelectedMonthFilter("all")}
                      className="text-[10px] text-emerald-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <FilterX className="w-3 h-3" /> Poništi (
                      {monthNamesFull[parseInt(selectedMonthFilter) - 1]})
                    </button>
                  )}
                </div>
                <div className="h-[105px] w-full relative">
                  <canvas ref={chartMonthRef} />
                </div>
              </div>
            </div>
          )}

          {/* Tabela historije servisa sa ugrađenim in-table filterima - JEDINI SKROLABILNI DIO */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs print:border-slate-300 print:rounded-none flex-1 min-h-0 flex flex-col">
            <div className="p-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-2 print:bg-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 print:text-slate-900">
                  <Wrench className="w-4 h-4 text-blue-600 print:hidden" /> Hronološki pregled svih servisa i računa ({filteredHistory.length} / {history.length})
                </h4>
                {isAnyFilterActive && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Filtrirano ({filteredHistory.length})
                  </span>
                )}
              </div>

              {isAnyFilterActive && (
                <button
                  onClick={resetAllCardFilters}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer print:hidden"
                >
                  <FilterX className="w-3.5 h-3.5" /> Poništi sve filtere
                </button>
              )}
            </div>

            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 print:max-h-none print:overflow-visible">
              <table className="min-w-full text-xs text-center">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0 print:bg-slate-100 print:text-slate-900 z-10 shadow-xs">
                  {/* 1. RED */}
                  <tr>
                    <th className="p-2.5 text-center w-24">Datum</th>
                    {!isPrikljucno && (
                      <th className="p-2.5 text-center w-28 font-mono">{usageColTitle}</th>
                    )}
                    <th className="p-2.5 text-center w-32">Segment</th>
                    <th className="p-2.5 text-center">Opis radova / dijelovi</th>
                    <th className="p-2.5 text-center w-40">Serviser</th>
                    <th className="p-2.5 text-center w-32">Broj fakture</th>
                    <th className="p-2.5 text-center w-24">Interno / eksterno</th>
                    {!isServiser ? (
                      <th className="p-2.5 text-center w-28">Iznos (KM)</th>
                    ) : (
                      <th className="p-2.5 text-center w-20">Prilog</th>
                    )}
                  </tr>

                  {/* 2. RED: In-table Filteri (sakriveni u printu) */}
                  <tr className="bg-slate-200/90 dark:bg-slate-950 border-t border-slate-300 dark:border-slate-800 font-normal print:hidden">
                    {/* Datum / Godina filter */}
                    <th className="p-1 text-center">
                      <select
                        value={selectedYearFilter}
                        onChange={(e) => setSelectedYearFilter(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-[11px] font-bold outline-none cursor-pointer text-center"
                      >
                        <option value="all">Sve god.</option>
                        {yearlyData.years.map((y) => (
                          <option key={y} value={y.toString()}>
                            {y}.
                          </option>
                        ))}
                      </select>
                    </th>

                    {/* Kilometraža / Radni sati placeholder */}
                    {!isPrikljucno && (
                      <th className="p-1 text-center text-[10px] text-slate-400 font-mono">-</th>
                    )}

                    {/* Segment filter */}
                    <th className="p-1 text-center">
                      <select
                        value={colFilterSegment}
                        onChange={(e) => setColFilterSegment(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-[11px] font-bold outline-none cursor-pointer text-center"
                      >
                        <option value="all">Svi segmenti</option>
                        {distinctSegments.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </th>

                    {/* Opis filter */}
                    <th className="p-1 text-center">
                      <input
                        type="text"
                        value={colFilterOpis}
                        onChange={(e) => setColFilterOpis(e.target.value)}
                        placeholder="🔍 Opis radova..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 text-[11px] font-medium outline-none text-center"
                      />
                    </th>

                    {/* Serviser filter */}
                    <th className="p-1 text-center">
                      <input
                        type="text"
                        value={colFilterSupplier}
                        onChange={(e) => setColFilterSupplier(e.target.value)}
                        placeholder="🔍 Serviser..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 text-[11px] font-medium outline-none text-center"
                      />
                    </th>

                    {/* Broj Fakture filter */}
                    <th className="p-1 text-center">
                      <input
                        type="text"
                        value={colFilterInvoice}
                        onChange={(e) => setColFilterInvoice(e.target.value)}
                        placeholder="🔍 Faktura..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 text-[11px] font-medium outline-none text-center"
                      />
                    </th>

                    {/* Interno / Eksterno filter */}
                    <th className="p-1 text-center">
                      <select
                        value={colFilterInternalExternal}
                        onChange={(e) => setColFilterInternalExternal(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1 py-0.5 text-[11px] font-bold outline-none cursor-pointer text-center"
                      >
                        <option value="all">Sve</option>
                        <option value="Interno">Interno</option>
                        <option value="Eksterno">Eksterno</option>
                      </select>
                    </th>

                    {/* Reset */}
                    <th className="p-1 text-center">
                      <button
                        onClick={resetAllCardFilters}
                        title="Poništi filtere"
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 w-full"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 print:divide-slate-300">
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((c, idx) => (
                      <tr
                        key={c.id || idx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors print:hover:bg-transparent"
                      >
                        <td className="p-2.5 text-center font-medium whitespace-nowrap text-slate-700 dark:text-slate-300 print:text-slate-900">
                          {formatDate(c.datumObj || c.datum)}
                        </td>
                        {!isPrikljucno && (
                          <td className="p-2.5 text-center font-mono font-bold whitespace-nowrap">
                            {cleanType === "Skladišna mehanizacija" ? (
                              <span className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded text-[11px]">
                                {formatOperatingHours(c.radniSati ?? 0)}
                              </span>
                            ) : c.kilometraza != null ? (
                              <span className="text-blue-700 dark:text-blue-400">
                                {formatMileage(c.kilometraza)}
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">-</span>
                            )}
                          </td>
                        )}
                        <td className="p-2.5 text-center font-bold text-slate-800 dark:text-slate-200 print:text-slate-900">
                          {c.segment || "-"}
                        </td>
                        <td className="p-2.5 text-center text-slate-900 dark:text-white font-medium break-words print:text-slate-900">
                          {c.opisPopravke || c.opisRadova || c.opis || "-"}
                        </td>
                        <td
                          className="p-2.5 text-center text-slate-600 dark:text-slate-400 print:text-slate-800 truncate max-w-[140px]"
                          title={c.dobavljacOrig || c.dobavljac}
                        >
                          {c.dobavljacOrig || c.dobavljac || "-"}
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap text-xs">
                          {c.brojRacuna && c.brojRacuna !== "-" ? (
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px] inline-block">
                              {c.brojRacuna}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-600">-</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap text-xs">
                          {c.type === "Interno" || (c.fakturaTip && c.fakturaTip.toLowerCase().includes("intern")) ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              Interno
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              Eksterno
                            </span>
                          )}
                        </td>
                        {!isServiser ? (
                          <td className="p-2.5 text-center font-bold text-slate-900 dark:text-white whitespace-nowrap print:text-slate-900">
                            <div className="flex items-center justify-center gap-1.5">
                              <span>{formatKM(c.cost || 0)}</span>
                              {c.invoiceUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewInvoice({
                                      url: c.invoiceUrl,
                                      name: c.invoiceName || "Račun",
                                      type: c.invoiceType || "application/pdf",
                                      reg: vehicleInfo.reg,
                                      datum: c.datum
                                    })
                                  }
                                  className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                                  title="Pregledaj račun / prilog"
                                >
                                  <Paperclip className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        ) : (
                          <td className="p-2.5 text-center font-bold whitespace-nowrap">
                            {c.invoiceUrl ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewInvoice({
                                    url: c.invoiceUrl,
                                    name: c.invoiceName || "Radni nalog / Prilog",
                                    type: c.invoiceType || "application/pdf",
                                    reg: vehicleInfo.reg,
                                    datum: c.datum
                                  })
                                }
                                className="px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px]"
                                title="Pregledaj prilog / radni nalog"
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                                <span>Prilog</span>
                              </button>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isPrikljucno ? 7 : 8} className="p-6 text-center text-slate-400 italic">
                        Nema zabilježenih servisa za odabrane filtere.
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredHistory.length > 0 && (
                  <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                    <tr>
                      <td colSpan={isPrikljucno ? 6 : 7} className="p-2.5 text-center font-black uppercase text-xs">
                        Zbir prikazanih stavki:
                      </td>
                      <td className="p-2.5 text-center font-black text-xs whitespace-nowrap">
                        {formatKM(filteredTotalCost)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL ZA PREGLED PRILOŽENOG RAČUNA */}
      <InvoicePreviewModal
        isOpen={Boolean(previewInvoice)}
        onClose={() => setPreviewInvoice(null)}
        invoice={previewInvoice}
      />

      {/* LIGHTBOX ZA PREGLED I NAVIGACIJU KROZ SVE SLIKE VOZILA */}
      {isLightboxOpen && vehicleImages.length > 0 && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 bg-black/95 z-[120] flex flex-col items-center justify-between p-4 cursor-pointer animate-in fade-in duration-200 select-none"
        >
          {/* Lightbox Top Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl flex items-center justify-between text-white p-2 shrink-0 cursor-default"
          >
            <div>
              <h4 className="font-black text-sm tracking-wide flex items-center gap-2">
                <span>{vehicleInfo?.reg}</span>
                <span className="text-xs text-slate-400 font-normal">
                  • {vehicleInfo?.markaVoz} {vehicleInfo?.modelVoz}
                </span>
              </h4>
              <p className="text-[11px] text-indigo-400 font-mono">
                Slika {selectedPhotoIndex + 1} od {vehicleImages.length}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={vehicleImages[selectedPhotoIndex]}
                target="_blank"
                rel="noreferrer"
                download
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                title="Preuzmi sliku"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Preuzmi</span>
              </a>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
                title="Zatvori (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Main Image Display sa Strelicama */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex-1 w-full max-w-5xl flex items-center justify-center p-2 min-h-0 cursor-default"
          >
            {vehicleImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : vehicleImages.length - 1));
                }}
                className="absolute left-2 sm:left-4 z-10 p-3 bg-black/60 hover:bg-black/90 text-white rounded-full border border-white/20 shadow-xl transition-transform hover:scale-110 cursor-pointer"
                title="Prethodna slika (Lijeva strelica)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img
              src={vehicleImages[selectedPhotoIndex]}
              alt={`Vozilo slika ${selectedPhotoIndex + 1}`}
              className="max-w-full max-h-[72vh] object-contain rounded-2xl shadow-2xl border border-white/15"
            />

            {vehicleImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPhotoIndex((prev) => (prev < vehicleImages.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-2 sm:right-4 z-10 p-3 bg-black/60 hover:bg-black/90 text-white rounded-full border border-white/20 shadow-xl transition-transform hover:scale-110 cursor-pointer"
                title="Sljedeća slika (Desna strelica)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Lightbox Bottom Thumbnail Carousel */}
          {vehicleImages.length > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl flex items-center justify-center gap-2 overflow-x-auto py-2 shrink-0 cursor-default"
            >
              {vehicleImages.map((url, idx) => (
                <button
                  key={url + idx}
                  type="button"
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`relative rounded-xl overflow-hidden w-14 h-12 shrink-0 border-2 transition-all cursor-pointer ${
                    selectedPhotoIndex === idx
                      ? "border-amber-400 scale-110 ring-2 ring-amber-400/50 shadow-lg"
                      : "border-white/20 opacity-50 hover:opacity-90"
                  }`}
                >
                  <img src={url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}
