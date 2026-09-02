"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import ChartJS from "@/lib/chartSetup.js";
import { formatKM, cleanVehicleType, cleanBrandName } from "@/lib/calculations.js";
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Calendar,
  Truck,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Filter,
  Download,
  Info,
  ShieldAlert,
  ArrowDownRight,
  RotateCcw,
  Sliders,
  ExternalLink,
  ChevronRight
} from "lucide-react";

export function TcoCalculator({
  masterFleet = [],
  costData = [],
  onOpenVehicleModal
}) {
  // Stanja filtera za rang listu
  const [filterTip, setFilterTip] = useState("all");
  const [filterRecommendation, setFilterRecommendation] = useState("all"); // 'all', 'replace', 'monitor', 'keep'
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("tcoScore"); // 'tcoScore', 'totalCost', 'age', 'annualRecent'
  const [sortDirection, setSortDirection] = useState("desc");

  // Stanje kalkulatora zamjene ("What-if" scenarij)
  const [selectedReg, setSelectedReg] = useState("");
  const [newVehiclePrice, setNewVehiclePrice] = useState(85000); // Cijena novog vozila u KM
  const [salvageValue, setSalvageValue] = useState(12000); // Otkupna / prodajna vrijednost starog u KM
  const [financingYears, setFinancingYears] = useState(5); // Period amortizacije / otplate u godinama
  const [monthlyFuelSavings, setMonthlyFuelSavings] = useState(250); // Mjesečna ušteda goriva i manjeg zastoja u KM
  const [customMaintenanceNew, setCustomMaintenanceNew] = useState(60); // Očekivano mjesečno održavanje novog vozila u KM (garancija)

  // Chart ref za komparaciju
  const tcoChartRef = useRef(null);
  const chartInstance = useRef(null);

  // 1. Agregacija troškova po vozilu
  const vehicleCostStats = useMemo(() => {
    const map = new Map();

    costData.forEach((c) => {
      const reg = (c.reg || "").trim().toUpperCase();
      if (!reg || reg === "-") return;

      if (!map.has(reg)) {
        map.set(reg, {
          totalCost: 0,
          totalInterventions: 0,
          costsByYear: { 2021: 0, 2022: 0, 2023: 0, 2024: 0, 2025: 0, 2026: 0 },
          countsByYear: { 2021: 0, 2022: 0, 2023: 0, 2024: 0, 2025: 0, 2026: 0 },
          lastServiceDate: null,
          mainSegments: {}
        });
      }

      const st = map.get(reg);
      const cost = c.cost || 0;
      st.totalCost += cost;
      st.totalInterventions += 1;

      if (c.year && st.costsByYear[c.year] !== undefined) {
        st.costsByYear[c.year] += cost;
        st.countsByYear[c.year] += 1;
      }

      const seg = c.segment || "Ostalo";
      st.mainSegments[seg] = (st.mainSegments[seg] || 0) + cost;
    });

    return map;
  }, [costData]);

  // 2. Evaluacija TCO algoritma za sva vozila iz master baze
  const evaluatedVehicles = useMemo(() => {
    const currentYear = 2026;

    return masterFleet
      .filter((v) => {
        const status = (v.status || "Aktivno").toLowerCase();
        // Uzimamo prvenstveno aktivna vozila, ili vozila sa servisnom istorijom
        return !status.includes("prodat") && !status.includes("rashod");
      })
      .map((v) => {
        const reg = (v.reg || "").trim().toUpperCase();
        const stats = vehicleCostStats.get(reg) || {
          totalCost: 0,
          totalInterventions: 0,
          costsByYear: { 2021: 0, 2022: 0, 2023: 0, 2024: 0, 2025: 0, 2026: 0 },
          countsByYear: { 2021: 0, 2022: 0, 2023: 0, 2024: 0, 2025: 0, 2026: 0 },
          mainSegments: {}
        };

        const prodYear = parseInt(v.godProizvodnje) || 2015;
        const age = Math.max(1, currentYear - prodYear);

        // Troškovi u novijem periodu (2025 + godišnja projekcija za 2026)
        const cost2025 = stats.costsByYear[2025] || 0;
        const cost2026 = stats.costsByYear[2026] || 0;
        // Godišnja ekstrapolacija za 2026 (7 mjeseci realizovano)
        const cost2026Annualized = cost2026 > 0 ? (cost2026 / 7) * 12 : 0;
        const recentAnnualCost = (cost2025 + cost2026Annualized) / 2;

        // Bazični raniji trošak (2021-2023)
        const baselineCost =
          ((stats.costsByYear[2021] || 0) +
            (stats.costsByYear[2022] || 0) +
            (stats.costsByYear[2023] || 0)) /
          3;

        // Faktor rasta troškova (Cost Velocity)
        let costGrowthFactor = 1;
        if (baselineCost > 0) {
          costGrowthFactor = recentAnnualCost / baselineCost;
        } else if (recentAnnualCost > 2000) {
          costGrowthFactor = 2.5;
        }

        // Procijenjena preostala vrijednost vozila (procjena na osnovu starosti i tipa)
        const cleanType = cleanVehicleType(v.tipMehan);
        let estimatedNewBasePrice = 90000;
        if (cleanType === "Putnička vozila") estimatedNewBasePrice = 42000;
        else if (cleanType === "Skladišna mehanizacija") estimatedNewBasePrice = 65000;
        else if (cleanType === "Priključna vozila") estimatedNewBasePrice = 55000;
        else if (cleanType === "Radna mašina") estimatedNewBasePrice = 120000;

        // Amortizacija preostale vrijednosti
        const residualValue = Math.max(
          estimatedNewBasePrice * 0.08,
          estimatedNewBasePrice * Math.pow(0.85, age)
        );

        // Odnos troškova novijeg održavanja naspram preostale vrijednosti
        const maintenanceToValueRatio =
          residualValue > 0 ? recentAnnualCost / residualValue : 1;

        // ALGORITAM TCO SCORE (0 - 100)
        // 1. Težina starosti (maks 30 bodova za vozila starija od 12 godina)
        const ageScore = Math.min(30, (age / 14) * 30);
        // 2. Težina kumulativnih troškova (maks 30 bodova ako je uloženo > 25.000 KM)
        const cumulativeScore = Math.min(30, (stats.totalCost / 25000) * 30);
        // 3. Težina akceleracije troškova zadnje 2 godine (maks 25 bodova)
        const trendScore = Math.min(25, (recentAnnualCost / 6000) * 25);
        // 4. Težina odnosa trošak/vrijednost (maks 15 bodova ako godišnji servis prelazi 40% vrijednosti auta)
        const ratioScore = Math.min(15, (maintenanceToValueRatio / 0.4) * 15);

        const rawScore = Math.round(ageScore + cumulativeScore + trendScore + ratioScore);
        const tcoScore = Math.min(100, Math.max(5, rawScore));

        // Klasifikacija i preporuka
        let category = "keep"; // 'replace', 'monitor', 'keep'
        let recommendationText = "";
        let badgeColor = "";

        if (tcoScore >= 70 || recentAnnualCost > residualValue * 0.7) {
          category = "replace";
          badgeColor = "rose";
          recommendationText = "Prešao prag rentabilnosti – preporučuje se rashod/prodaja i hitna nabavka novog";
        } else if (tcoScore >= 46) {
          category = "monitor";
          badgeColor = "amber";
          recommendationText = "Granična rentabilnost – pojačan nadzor, planirati zamjenu u budžetu 2027.";
        } else {
          category = "keep";
          badgeColor = "emerald";
          recommendationText = "Ekonomično vozilo – troškovi stabilni, zadržati u redovnoj eksploataciji";
        }

        return {
          ...v,
          cleanType,
          cleanBrand: cleanBrandName(v.markaVoz),
          age,
          totalCost: stats.totalCost,
          totalInterventions: stats.totalInterventions,
          costsByYear: stats.costsByYear,
          recentAnnualCost,
          residualValue,
          tcoScore,
          category,
          badgeColor,
          recommendationText,
          estimatedNewBasePrice
        };
      });
  }, [masterFleet, vehicleCostStats]);

  // Odabir podrazumijevanog vozila za kalkulator (prvo vozilo sa najvećim rizikom)
  useEffect(() => {
    if (!selectedReg && evaluatedVehicles.length > 0) {
      const topCritical = [...evaluatedVehicles].sort((a, b) => b.tcoScore - a.tcoScore)[0];
      if (topCritical) {
        setSelectedReg(topCritical.reg);
        setSalvageValue(Math.round(topCritical.residualValue));
        setNewVehiclePrice(Math.round(topCritical.estimatedNewBasePrice));
      }
    }
  }, [evaluatedVehicles, selectedReg]);

  // Trenutno odabrano vozilo za detaljni kalkulator
  const activeVehicle = useMemo(() => {
    return (
      evaluatedVehicles.find((v) => v.reg.toUpperCase() === selectedReg.toUpperCase()) ||
      evaluatedVehicles[0] ||
      null
    );
  }, [evaluatedVehicles, selectedReg]);

  // Kada korisnik izabere drugo vozilo u kalkulatoru
  const handleSelectVehicle = (reg) => {
    setSelectedReg(reg);
    const v = evaluatedVehicles.find((item) => item.reg === reg);
    if (v) {
      setSalvageValue(Math.round(v.residualValue));
      setNewVehiclePrice(Math.round(v.estimatedNewBasePrice));
    }
  };

  // 3. Proračun isplativosti zamjene za odabrano vozilo ("What-if" kalkulacija)
  const calculationResults = useMemo(() => {
    if (!activeVehicle) return null;

    // Staro vozilo:
    // Mjesečni trošak popravki i održavanja (na bazi zadnje 2 godine)
    const oldMonthlyMaintenance = activeVehicle.recentAnnualCost / 12;
    // Indirektni rizik neplaniranih kvarova, šlepanja i zastoja (procjena 20% troška popravke)
    const oldMonthlyDowntimeRisk = oldMonthlyMaintenance * 0.22;
    const oldTotalMonthlyCost = oldMonthlyMaintenance + oldMonthlyDowntimeRisk;

    // Novo vozilo:
    // Neto investicija = Cijena novog - Otkup starog
    const netInvestment = Math.max(5000, newVehiclePrice - salvageValue);
    const totalMonths = financingYears * 12;
    // Mjesečna amortizacija / rata investicije
    const newMonthlyCapitalCost = netInvestment / totalMonths;
    // Mjesečni trošak održavanja novog (garantni rok, samo redovni servisi)
    const newMonthlyMaintenance = customMaintenanceNew;
    // Mjesečni operativni trošak novog umanjen za uštede na gorivu/efikasnosti
    const newTotalMonthlyCost =
      newMonthlyCapitalCost + newMonthlyMaintenance - monthlyFuelSavings;

    // Mjesečna razlika (ušteda ili doplata)
    const monthlyDifference = oldTotalMonthlyCost - newTotalMonthlyCost;

    // Break-even tačka (Povrat investicije):
    // Kada se neto doplata isplati kroz uštede na popravkama i gorivu
    const annualMaintenanceSavings = Math.max(
      1000,
      activeVehicle.recentAnnualCost - customMaintenanceNew * 12
    );
    const annualFuelSavings = monthlyFuelSavings * 12;
    const totalAnnualSavings = annualMaintenanceSavings + annualFuelSavings;
    const breakEvenMonths =
      totalAnnualSavings > 0 ? Math.round((netInvestment / totalAnnualSavings) * 12) : 999;

    // 5-godišnji kumulativni trošak (Staro vs Novo)
    const fiveYearOldCost = oldTotalMonthlyCost * 60;
    const fiveYearNewCost = netInvestment + (newMonthlyMaintenance - monthlyFuelSavings) * 60;
    const fiveYearNetBenefit = fiveYearOldCost - fiveYearNewCost;

    return {
      oldMonthlyMaintenance,
      oldMonthlyDowntimeRisk,
      oldTotalMonthlyCost,
      netInvestment,
      newMonthlyCapitalCost,
      newMonthlyMaintenance,
      newTotalMonthlyCost,
      monthlyDifference,
      breakEvenMonths,
      fiveYearOldCost,
      fiveYearNewCost,
      fiveYearNetBenefit
    };
  }, [
    activeVehicle,
    newVehiclePrice,
    salvageValue,
    financingYears,
    monthlyFuelSavings,
    customMaintenanceNew
  ]);

  // Crtanje 5-godišnjeg grafikona kumulativnih troškova
  useEffect(() => {
    if (!tcoChartRef.current || !calculationResults || !activeVehicle) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = tcoChartRef.current.getContext("2d");
    const months = [12, 24, 36, 48, 60];
    const labels = ["1. Godina", "2. Godina", "3. Godina", "4. Godina", "5. Godina"];

    const oldCumulative = months.map(
      (m) => Math.round(calculationResults.oldTotalMonthlyCost * m)
    );
    const newCumulative = months.map((m) => {
      // Investicija se amortizuje linearno, plus operativni troškovi
      const capFraction = Math.min(1, m / (financingYears * 12));
      return Math.round(
        calculationResults.netInvestment * capFraction +
          (calculationResults.newMonthlyMaintenance - monthlyFuelSavings) * m
      );
    });

    chartInstance.current = new ChartJS(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Kumulativni trošak ZADRŽAVANJA starog vozila",
            data: oldCumulative,
            borderColor: "#ef4444",
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            fill: true,
            tension: 0.3,
            borderWidth: 3,
            pointBackgroundColor: "#ef4444",
            pointRadius: 4
          },
          {
            label: "Kumulativni trošak NABAVKE novog zamjenskog vozila",
            data: newCumulative,
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            fill: true,
            tension: 0.3,
            borderWidth: 3,
            pointBackgroundColor: "#10b981",
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: { display: false },
          legend: { position: "bottom", labels: { font: { weight: "bold", size: 11 } } },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${formatKM(ctx.raw)}`
            }
          }
        },
        scales: {
          y: {
            ticks: {
              callback: (val) => `${(val / 1000).toFixed(0)}k KM`
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [calculationResults, activeVehicle, financingYears, monthlyFuelSavings]);

  // 4. Filtriranje i sortiranje tabele flote
  const filteredVehicles = useMemo(() => {
    return evaluatedVehicles
      .filter((v) => {
        // Filter tip
        if (filterTip !== "all" && v.cleanType !== filterTip) return false;
        // Filter preporuka
        if (filterRecommendation !== "all" && v.category !== filterRecommendation) return false;
        // Pretraga
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const reg = (v.reg || "").toLowerCase();
          const gb = (v.garazniBroj || "").toLowerCase();
          const marka = (v.markaVoz || "").toLowerCase();
          const model = (v.modelVoz || "").toLowerCase();
          if (!reg.includes(q) && !gb.includes(q) && !marka.includes(q) && !model.includes(q)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (sortDirection === "asc") return valA > valB ? 1 : -1;
        return valA < valB ? 1 : -1;
      });
  }, [evaluatedVehicles, filterTip, filterRecommendation, searchQuery, sortField, sortDirection]);

  // 5. Agregatne statistike za vršne KPI kartice
  const summaryKpis = useMemo(() => {
    const totalActive = evaluatedVehicles.length;
    const replaceCandidates = evaluatedVehicles.filter((v) => v.category === "replace");
    const monitorCandidates = evaluatedVehicles.filter((v) => v.category === "monitor");
    const keepVehicles = evaluatedVehicles.filter((v) => v.category === "keep");

    const totalAnnualSpentOnReplace = replaceCandidates.reduce(
      (acc, v) => acc + v.recentAnnualCost,
      0
    );

    const avgAgeReplace =
      replaceCandidates.length > 0
        ? (
            replaceCandidates.reduce((acc, v) => acc + v.age, 0) /
            replaceCandidates.length
          ).toFixed(1)
        : "0";

    // Procijenjena godišnja ušteda zamjenom top kandidata (smanjenje popravki za 80% + ušteda goriva)
    const estimatedYearlySavingsAll =
      totalAnnualSpentOnReplace * 0.75 + replaceCandidates.length * 250 * 12;

    return {
      totalActive,
      replaceCount: replaceCandidates.length,
      monitorCount: monitorCandidates.length,
      keepCount: keepVehicles.length,
      totalAnnualSpentOnReplace,
      avgAgeReplace,
      estimatedYearlySavingsAll
    };
  }, [evaluatedVehicles]);

  // Unikatni tipovi vozila za filter
  const distinctTypes = useMemo(() => {
    const set = new Set(evaluatedVehicles.map((v) => v.cleanType).filter(Boolean));
    return Array.from(set).sort();
  }, [evaluatedVehicles]);

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ZAGLAVLJE MODULA SA OZNAKOM TESTNOG PREGLEDA */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 rounded-3xl border border-indigo-800/40 shadow-xl text-white flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/80 border border-indigo-400/30 flex items-center justify-center text-white shadow-lg">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-black tracking-tight text-white">
                TCO & Kalkulator Isplativosti Zamjene Vozila
              </h2>
              <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                🧪 Testni Pregled / Algoritam
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Finansijski model za detekciju vozila koja su prešla prag rentabilnosti i simulaciju
              isplativosti nabavke novih zamjenskih vozila na osnovu stvarnih troškova popravki.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              Ukupno analizirano
            </p>
            <p className="text-lg font-black text-white">{summaryKpis.totalActive} vozila</p>
          </div>
        </div>
      </div>

      {/* 4 SUMMARY KPI KARTICE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kartica 1: Kandidati za hitnu zamjenu */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-rose-500 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Prešli Prag Rentabilnosti
            </span>
            <span className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400">
              {summaryKpis.replaceCount}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Vozila sa TCO indeksom &gt; 70 (preporučena hitna zamjena)
            </p>
          </div>
        </div>

        {/* Kartica 2: Godišnji trošak kritične flote */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-amber-500 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Godišnje Održavanje Rizičnih
            </span>
            <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {formatKM(summaryKpis.totalAnnualSpentOnReplace)}
            </h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
              Godišnji odliv za popravke {summaryKpis.replaceCount} kritičnih vozila
            </p>
          </div>
        </div>

        {/* Kartica 3: Prosječna starost kritične grupe */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-blue-500 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Prosječna Starost Kritičnih
            </span>
            <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              {summaryKpis.avgAgeReplace} god.
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Prosječna starost rizičnih vozila u floti
            </p>
          </div>
        </div>

        {/* Kartica 4: Potencijalna godišnja ušteda */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-emerald-500 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Potencijal Godišnje Uštede
            </span>
            <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatKM(summaryKpis.estimatedYearlySavingsAll)}
            </h3>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-500 font-semibold mt-1">
              Ušteda na popravkama i gorivu zamjenom rizičnih
            </p>
          </div>
        </div>
      </div>

      {/* GLAVNI INTERAKTIVNI BLOK: DETALJNI KALKULATOR ZAMJENE ("WHAT-IF" SIMULATOR) */}
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-700 pb-5">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <span>Interaktivni Kalkulator Isplativosti Zamjene ("What-if" Scenario)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Izaberite vozilo i prilagodite uslove nabavke kako biste vidjeli tačan datum povrata
              investicije i generisanu preporuku.
            </p>
          </div>

          {/* Brzi birač vozila za kalkulator */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase text-slate-400">Odabrano vozilo:</label>
            <select
              value={selectedReg}
              onChange={(e) => handleSelectVehicle(e.target.value)}
              className="text-xs font-bold border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              {evaluatedVehicles
                .slice()
                .sort((a, b) => b.tcoScore - a.tcoScore)
                .slice(0, 50)
                .map((v) => (
                  <option key={v.reg} value={v.reg}>
                    {v.reg} • {v.cleanBrand} {v.modelVoz || ""} (TCO: {v.tcoScore}/100)
                  </option>
                ))}
            </select>
          </div>
        </div>

        {activeVehicle && calculationResults && (
          <div className="space-y-6">
            {/* GENERISANA PREPORUKA SISTEMA U CRVENOM/ZELENOM BANERU */}
            <div
              className={`p-4 md:p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                activeVehicle.category === "replace"
                  ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-950 dark:text-rose-200"
                  : activeVehicle.category === "monitor"
                  ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-950 dark:text-amber-200"
                  : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-950 dark:text-emerald-200"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    activeVehicle.category === "replace"
                      ? "bg-rose-600 text-white"
                      : activeVehicle.category === "monitor"
                      ? "bg-amber-500 text-white"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  {activeVehicle.category === "replace" ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : activeVehicle.category === "monitor" ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider">
                      Strateška preporuka sistema:
                    </span>
                    <span className="text-xs font-mono font-bold bg-white/60 dark:bg-slate-900/60 px-2 py-0.5 rounded">
                      TCO Score: {activeVehicle.tcoScore} / 100
                    </span>
                  </div>
                  <p className="text-sm font-black mt-1 leading-snug">
                    Vozilo <span className="underline">{activeVehicle.reg}</span> (
                    {activeVehicle.cleanBrand} {activeVehicle.modelVoz}, {activeVehicle.godProizvodnje}
                    . god.) {activeVehicle.category === "replace" ? "je prešlo prag rentabilnosti – preporučuje se rashod/prodaja i zamjena novim vozilom." : activeVehicle.category === "monitor" ? "se nalazi u zoni granične rentabilnosti. Potreban pojačan nadzor." : "je ekonomski stabilno i preporučuje se ostanak u redovnoj eksploataciji."}
                  </p>
                  <p className="text-xs opacity-80 mt-1">
                    Ukupno uloženo u popravke (2021–2026):{" "}
                    <strong>{formatKM(activeVehicle.totalCost)}</strong> • Prosjek zadnjih godina:{" "}
                    <strong>{formatKM(activeVehicle.recentAnnualCost)}/god.</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
                <button
                  onClick={() => onOpenVehicleModal && onOpenVehicleModal(activeVehicle.reg)}
                  className="text-xs font-bold px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span>Karton vozila</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* DVIJE KOLONE: PARAMETRI KALKULATORA & FINANSIJSKI REZULTAT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LIJEVA KOLONA: KONTROLE I PARAMETRI (5 kolona) */}
              <div className="lg:col-span-5 space-y-4 bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-500" />
                  <span>Parametri nove investicije</span>
                </h4>

                {/* Parametar 1: Cijena novog vozila */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Nabavna cijena novog vozila:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-black">
                      {formatKM(newVehiclePrice)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20000"
                    max="250000"
                    step="5000"
                    value={newVehiclePrice}
                    onChange={(e) => setNewVehiclePrice(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>20.000 KM</span>
                    <span>120.000 KM</span>
                    <span>250.000 KM</span>
                  </div>
                </div>

                {/* Parametar 2: Otkupna / prodajna vrijednost starog vozila */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600 dark:text-slate-400">
                      Otkupna vrijednost starog vozila ({activeVehicle.reg}):
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">
                      {formatKM(salvageValue)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="60000"
                    step="1000"
                    value={salvageValue}
                    onChange={(e) => setSalvageValue(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>1.000 KM</span>
                    <span>Procjena: {formatKM(activeVehicle.residualValue)}</span>
                    <span>60.000 KM</span>
                  </div>
                </div>

                {/* Parametar 3: Period otplate / amortizacije */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Period amortizacije:</span>
                    <span className="text-slate-900 dark:text-white font-black">
                      {financingYears} godina ({financingYears * 12} mj.)
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-1.5">
                    {[3, 4, 5, 6].map((yr) => (
                      <button
                        key={yr}
                        onClick={() => setFinancingYears(yr)}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          financingYears === yr
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {yr} god.
                      </button>
                    ))}
                  </div>
                </div>

                {/* Parametar 4: Mjesečna ušteda goriva i zastoja */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600 dark:text-slate-400">
                      Očekivana mjesečna ušteda goriva & zastoja:
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">
                      {formatKM(monthlyFuelSavings)} / mj.
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="50"
                    value={monthlyFuelSavings}
                    onChange={(e) => setMonthlyFuelSavings(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>0 KM</span>
                    <span>250 KM/mj</span>
                    <span>1.000 KM/mj</span>
                  </div>
                </div>

                {/* Neto doplata info box */}
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold block">Neto doplata za novo:</span>
                    <span className="text-slate-400 text-[10px]">
                      (Cijena novog umanjena za prodaju starog)
                    </span>
                  </div>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {formatKM(calculationResults.netInvestment)}
                  </span>
                </div>
              </div>

              {/* DESNA KOLONA: REZULTAT KALKULACIJE I GRAFIKON (7 kolona) */}
              <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
                {/* 3 Glavna KPI rezultata kalkulacije */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* KPI 1: Mjesečni trošak starog */}
                  <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                      Trošak starog ({activeVehicle.reg})
                    </p>
                    <p className="text-xl font-black text-rose-700 dark:text-rose-400 mt-1">
                      {formatKM(calculationResults.oldTotalMonthlyCost)} / mj.
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Popravke: {formatKM(calculationResults.oldMonthlyMaintenance)} + zastoje
                    </p>
                  </div>

                  {/* KPI 2: Mjesečni trošak novog */}
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      Trošak novog vozila
                    </p>
                    <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                      {formatKM(calculationResults.newTotalMonthlyCost)} / mj.
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Rata: {formatKM(calculationResults.newMonthlyCapitalCost)} - ušteda goriva
                    </p>
                  </div>

                  {/* KPI 3: Tačka povrata (Break-even) */}
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                      Povrat investicije
                    </p>
                    <p className="text-xl font-black text-indigo-700 dark:text-indigo-400 mt-1">
                      {calculationResults.breakEvenMonths <= 60
                        ? `${calculationResults.breakEvenMonths} mjeseci`
                        : "Preko 5 god."}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      5-god. neto ušteda: {formatKM(calculationResults.fiveYearNetBenefit)}
                    </p>
                  </div>
                </div>

                {/* Grafikon poređenja kumulativnih troškova */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      <span>5-godišnja projekcija kumulativnih troškova (Staro vs Novo)</span>
                    </h5>
                    <span className="text-[10px] font-mono text-slate-400">KM kumulativno</span>
                  </div>
                  <div className="h-[210px] w-full relative">
                    <canvas ref={tcoChartRef} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RANG LISTA FLOTE PO TCO INDEKSU RIZIKA */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              <span>Rang Lista Rentabilnosti Flote (Kandidati za Zamjenu)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Klikom na dugme &quot;Kalkulator&quot; pored bilo kojeg vozila učitavate njegove podatke u gornji model.
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Prikazano: <strong className="text-slate-900 dark:text-white">{filteredVehicles.length}</strong> od{" "}
            {evaluatedVehicles.length} vozila
          </div>
        </div>

        {/* TRAKA SA FILTERIMA ZA TABELU */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/70 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Pretraga po reg / GB */}
            <div className="relative min-w-[220px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pretraži reg. ili gar. broj..."
                className="w-full text-xs font-medium border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>

            {/* Filter po preporuci / kategoriji */}
            <select
              value={filterRecommendation}
              onChange={(e) => setFilterRecommendation(e.target.value)}
              className="text-xs font-bold border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="all">Sve preporuke</option>
              <option value="replace">🔴 Samo Hitna zamjena (Score &gt; 70)</option>
              <option value="monitor">🟡 Samo Pojačan nadzor (Score 46-70)</option>
              <option value="keep">🟢 Samo Rentabilna (Score &lt; 46)</option>
            </select>

            {/* Filter po tipu vozila */}
            <select
              value={filterTip}
              onChange={(e) => setFilterTip(e.target.value)}
              className="text-xs font-bold border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="all">Svi tipovi vozila</option>
              {distinctTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Reset filtera */}
          {(filterRecommendation !== "all" || filterTip !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setFilterRecommendation("all");
                setFilterTip("all");
                setSearchQuery("");
              }}
              className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-1 cursor-pointer transition-all"
            >
              <RotateCcw className="w-3 h-3" />
              Poništi filtere
            </button>
          )}
        </div>

        {/* TABELA PODATAKA */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-extrabold border-b border-slate-200 dark:border-slate-700">
                <th className="p-3.5">Vozilo / Registracija</th>
                <th className="p-3.5">Garažni Br.</th>
                <th className="p-3.5">Marka & Model</th>
                <th className="p-3.5">Tip</th>
                <th className="p-3.5">Godište / Starost</th>
                <th className="p-3.5 text-right">Uloženo (2021-2026)</th>
                <th className="p-3.5 text-right">Godišnje (2025/26)</th>
                <th className="p-3.5 text-center">TCO Indeks Rizika</th>
                <th className="p-3.5">Status Preporuke</th>
                <th className="p-3.5 text-center">Akcija</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredVehicles.slice(0, 100).map((v) => {
                const isSelected = v.reg === selectedReg;
                return (
                  <tr
                    key={v.reg}
                    className={`transition-colors ${
                      isSelected
                        ? "bg-indigo-50/80 dark:bg-indigo-950/40 font-semibold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{v.reg}</span>
                      {isSelected && (
                        <span className="text-[9px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded">
                          Aktivno
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400 font-mono">
                      {v.garazniBroj || "-"}
                    </td>
                    <td className="p-3.5 text-slate-800 dark:text-slate-200">
                      {v.cleanBrand} <span className="text-slate-400">{v.modelVoz || ""}</span>
                    </td>
                    <td className="p-3.5 text-slate-500 dark:text-slate-400">{v.cleanType}</td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">
                      {v.godProizvodnje} ({v.age} god.)
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900 dark:text-white">
                      {formatKM(v.totalCost)}
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-700 dark:text-slate-300">
                      {formatKM(v.recentAnnualCost)}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              v.tcoScore >= 70
                                ? "bg-rose-500"
                                : v.tcoScore >= 46
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${v.tcoScore}%` }}
                          />
                        </div>
                        <span
                          className={`font-black text-xs ${
                            v.tcoScore >= 70
                              ? "text-rose-600 dark:text-rose-400"
                              : v.tcoScore >= 46
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {v.tcoScore}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      {v.category === "replace" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                          🔴 Hitna zamjena
                        </span>
                      ) : v.category === "monitor" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                          🟡 Nadzor (2027)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                          🟢 Rentabilno
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleSelectVehicle(v.reg)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50"
                        }`}
                        title="Učitaj u kalkulator isplativosti"
                      >
                        Kalkulator
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
