"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { formatKM, formatDate } from "@/lib/calculations.js";
import { Chart, registerables } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { X, Printer, Wrench, BarChart2, Edit3, Building2 } from "lucide-react";

Chart.register(...registerables, ChartDataLabels);

export function VehicleCardModal({
  isOpen,
  onClose,
  reg,
  costData,
  masterFleet,
  onOpenEditVehicle,
  currentRole
}) {
  const chartYearRef = useRef(null);
  const chartMonthRef = useRef(null);
  const chartYearInstance = useRef(null);
  const chartMonthInstance = useRef(null);

  // Pronađi osnovne podatke o vozilu
  const vehicleInfo = useMemo(() => {
    if (!reg) return null;
    const cleanReg = reg.trim().toUpperCase();

    // 1. Potraži u matičnoj bazi voznog parka
    const inMaster = masterFleet.find(
      (v) => (v.reg || "").trim().toUpperCase() === cleanReg || (v.garazniBroj && v.garazniBroj.toString().trim() === cleanReg)
    );
    if (inMaster) return inMaster;

    // 2. Ako nema u bazi, potraži u troškovima
    const inCosts = costData.find((c) => (c.reg || "").trim().toUpperCase() === cleanReg);
    if (inCosts) {
      return {
        reg: inCosts.reg,
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

  // Hronološka historija servisa za ovo vozilo
  const history = useMemo(() => {
    if (!reg) return [];
    const cleanReg = reg.trim().toUpperCase();

    return costData
      .filter((c) => (c.reg || "").trim().toUpperCase() === cleanReg)
      .sort((a, b) => {
        const timeB = a.datumObj ? a.datumObj.getTime() : 0;
        const timeA = b.datumObj ? b.datumObj.getTime() : 0;
        return timeA - timeB;
      });
  }, [reg, costData]);

  // Ukupno uloženo
  const totalCost = useMemo(() => {
    return history.reduce((sum, item) => sum + (item.cost || 0), 0);
  }, [history]);

  // Podaci po godinama za chart
  const yearlyData = useMemo(() => {
    const years = [2021, 2022, 2023, 2024, 2025, 2026];
    const data = years.map((y) => {
      const yearCost = history
        .filter((c) => c.year === y)
        .reduce((sum, item) => sum + (item.cost || 0), 0);
      return yearCost;
    });
    return { labels: years.map((y) => `${y}.`), data };
  }, [history]);

  // Podaci po mjesecima za chart (za sve godine zbirno ili po dinamici)
  const monthlyData = useMemo(() => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "Maj", "Jun",
      "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"
    ];
    const data = Array(12).fill(0);

    history.forEach((c) => {
      if (c.month >= 1 && c.month <= 12) {
        data[c.month - 1] += c.cost || 0;
      }
    });

    return { labels: months, data };
  }, [history]);

  // Inicijalizacija grafikona
  useEffect(() => {
    if (!isOpen || !vehicleInfo) return;

    // Chart po godinama
    if (chartYearRef.current) {
      if (chartYearInstance.current) chartYearInstance.current.destroy();
      const ctx = chartYearRef.current.getContext("2d");

      chartYearInstance.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: yearlyData.labels,
          datasets: [
            {
              label: "Trošak (KM)",
              data: yearlyData.data,
              backgroundColor: "rgba(79, 70, 229, 0.85)",
              hoverBackgroundColor: "rgba(99, 102, 241, 1)",
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            datalabels: {
              anchor: "end",
              align: "top",
              color: "#4f46e5",
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

    // Chart po mjesecima
    if (chartMonthRef.current) {
      if (chartMonthInstance.current) chartMonthInstance.current.destroy();
      const ctx = chartMonthRef.current.getContext("2d");

      chartMonthInstance.current = new Chart(ctx, {
        type: "line",
        data: {
          labels: monthlyData.labels,
          datasets: [
            {
              label: "Mjesečni Utrošak (KM)",
              data: monthlyData.data,
              borderColor: "rgba(14, 165, 233, 1)",
              backgroundColor: "rgba(14, 165, 233, 0.15)",
              borderWidth: 2,
              fill: true,
              tension: 0.35,
              pointBackgroundColor: "rgba(14, 165, 233, 1)",
              pointRadius: 3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            datalabels: { display: false }
          },
          scales: {
            y: { beginAtZero: true, display: false },
            x: { grid: { display: false }, ticks: { font: { size: 9 } } }
          }
        }
      });
    }

    return () => {
      if (chartYearInstance.current) chartYearInstance.current.destroy();
      if (chartMonthInstance.current) chartMonthInstance.current.destroy();
    };
  }, [isOpen, vehicleInfo, yearlyData, monthlyData]);

  if (!isOpen || !reg || !vehicleInfo) return null;

  const handlePrint = () => {
    window.print();
  };

  const canEditVehicle =
    currentRole?.permissions?.canRegisterVehicle ||
    currentRole?.permissions?.canEditCosts ||
    currentRole?.roleId === "superadmin";

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/80 flex justify-center items-center z-[70] backdrop-blur-xs p-4 cursor-pointer print:p-0 print:bg-white"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 cursor-default print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none"
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
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex justify-between items-start print:bg-slate-100 print:text-slate-900 print:p-4 print:rounded-lg print:border print:border-slate-300">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-white/10 rounded-2xl border border-white/20 text-2xl print:hidden">
                🚛
              </span>
              <div>
                <h3 className="text-2xl font-black tracking-tight flex items-center gap-2 print:text-xl">
                  <span>{vehicleInfo.reg}</span>
                  <span className="text-xs bg-indigo-500/40 text-indigo-200 border border-indigo-400/50 px-2.5 py-0.5 rounded-full font-mono print:border-slate-400 print:text-slate-800 print:bg-slate-200">
                    GB: {vehicleInfo.garazniBroj || "-"}
                  </span>
                  <span className="text-xs bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 px-2.5 py-0.5 rounded-full font-bold print:border-emerald-600 print:text-emerald-800 print:bg-emerald-100">
                    {vehicleInfo.status || "Aktivno"}
                  </span>
                </h3>
                <p className="text-xs text-indigo-200 mt-1 print:text-slate-700 font-semibold">
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
                <Edit3 className="w-3.5 h-3.5" /> Uredi Vozilo
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

        {/* Sadržaj */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50 dark:bg-slate-900/50 text-xs print:p-0 print:space-y-4 print:bg-white print:overflow-visible">
          {/* Statistika */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:grid-cols-3">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs print:border-slate-300 print:p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">
                Ukupno Uloženo u Održavanje
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block print:text-slate-900 print:text-lg">
                {formatKM(totalCost)}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs print:border-slate-300 print:p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">
                Broj Evidentiranih Servisa
              </span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5 block print:text-slate-900 print:text-lg">
                {history.length.toLocaleString("bs-BA")} naloga
              </span>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs print:border-slate-300 print:p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">
                Broj Šasije (VIN)
              </span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 block truncate print:text-slate-900">
                {vehicleInfo.brojSasije || "-"}
              </span>
            </div>
          </div>

          {/* DVA GRAFIKONA ZA KARTON VOZILA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[11px] font-extrabold uppercase text-slate-500 mb-2 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-indigo-600" /> Utrošak po Godinama
              </span>
              <div className="h-[140px] w-full relative">
                <canvas ref={chartYearRef} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-[11px] font-extrabold uppercase text-slate-500 mb-2 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-sky-500" /> Utrošak po Mjesecima
              </span>
              <div className="h-[140px] w-full relative">
                <canvas ref={chartMonthRef} />
              </div>
            </div>
          </div>

          {/* Tabela historije servisa */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs print:border-slate-300 print:rounded-none">
            <div className="p-3.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center print:bg-slate-100">
              <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 print:text-slate-900">
                <Wrench className="w-4 h-4 text-blue-600 print:hidden" /> Hronološki Pregled Svih Servisa & Računa ({history.length})
              </h4>
            </div>

            <div className="overflow-x-auto max-h-[350px] print:max-h-none print:overflow-visible">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0 print:bg-slate-100 print:text-slate-900">
                  <tr>
                    <th className="p-2.5 w-24">Datum</th>
                    <th className="p-2.5 w-32">Segment</th>
                    <th className="p-2.5">Opis Radova / Dijelovi</th>
                    <th className="p-2.5 w-40">Serviser</th>
                    <th className="p-2.5 text-right w-28">Iznos (KM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 print:divide-slate-300">
                  {history.length > 0 ? (
                    history.map((c, idx) => (
                      <tr
                        key={c.id || idx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors print:hover:bg-transparent"
                      >
                        <td className="p-2.5 font-medium whitespace-nowrap text-slate-700 dark:text-slate-300 print:text-slate-900">
                          {formatDate(c.datumObj || c.datum)}
                        </td>
                        <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200 print:text-slate-900">
                          {c.segment || "-"}
                        </td>
                        <td className="p-2.5 text-slate-900 dark:text-white font-medium break-words print:text-slate-900">
                          {c.opisPopravke || c.opisRadova || c.opis || "-"}
                        </td>
                        <td
                          className="p-2.5 text-slate-600 dark:text-slate-400 print:text-slate-800 truncate max-w-[140px]"
                          title={c.dobavljacOrig || c.dobavljac}
                        >
                          {c.dobavljacOrig || c.dobavljac || "-"}
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap print:text-slate-900">
                          {formatKM(c.cost || 0)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                        Nema zabilježenih servisa za ovo vozilo.
                      </td>
                    </tr>
                  )}
                </tbody>
                {history.length > 0 && (
                  <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={4} className="p-2.5 text-right font-black uppercase text-xs">
                        Ukupan zbir svih intervencija:
                      </td>
                      <td className="p-2.5 text-right font-black text-xs whitespace-nowrap">
                        {formatKM(totalCost)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
