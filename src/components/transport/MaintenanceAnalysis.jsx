"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import ChartJS from "@/lib/chartSetup.js";
import { formatKM } from "@/lib/calculations.js";
import { Wrench, TrendingUp, Layers, Calendar, ChevronRight } from "lucide-react";

// Pomoćna funkcija za robusno prepoznavanje tipa mehanizacije bez obzira na kvačice (č, ć, š, ž)
function normalizeVehicleType(rawType) {
  if (!rawType) return "Ostalo";
  const str = rawType
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (str.includes("putnick") || str.includes("putnic") || str.includes("putn")) return "Putničko";
  if (str.includes("teret")) return "Teretno";
  if (str.includes("prikljuc") || str.includes("priklj")) return "Priključno";
  if (str.includes("radn")) return "Radna mašina";
  if (str.includes("skladis") || str.includes("viljusk")) return "Skladišna mehanizacija";
  if (str.includes("servis")) return "Servis motornih vozila";
  return "Putničko";
}

// Fiksni podaci za Dugoročni KPI (2021-2025)
const LT_KPI_FIXED_DATA = {
  units: {
    "Priključno": { 2021: 37, 2022: 37, 2023: 38, 2024: 46, 2025: 45 },
    "Putničko": { 2021: 107, 2022: 103, 2023: 103, 2024: 125, 2025: 124 },
    "Radna mašina": { 2021: 10, 2022: 5, 2023: 5, 2024: 8, 2025: 8 },
    "Servis motornih vozila": { 2021: 0, 2022: 0, 2023: 0, 2024: 0, 2025: 0 },
    "Skladišna mehanizacija": { 2021: 312, 2022: 291, 2023: 352, 2024: 419, 2025: 595 },
    "Teretno": { 2021: 195, 2022: 187, 2023: 154, 2024: 149, 2025: 167 }
  },
  typeCost: {
    "Priključno": { 2021: 59951, 2022: 106260, 2023: 121657, 2024: 139402, 2025: 192401 },
    "Putničko": { 2021: 120143, 2022: 153293, 2023: 150136, 2024: 176374, 2025: 195374 },
    "Radna mašina": { 2021: 39347, 2022: 26708, 2023: 22241, 2024: 17495, 2025: 32042 },
    "Servis motornih vozila": { 2021: 1600, 2022: 2678, 2023: 710, 2024: 1293, 2025: 5758 },
    "Skladišna mehanizacija": { 2021: 154418, 2022: 235373, 2023: 346204, 2024: 349736, 2025: 344124 },
    "Teretno": { 2021: 488188, 2022: 564491, 2023: 645022, 2024: 740553, 2025: 923258 }
  },
  segmentCost: {
    "Elektronika": { 2021: 29343, 2022: 37993, 2023: 92690, 2024: 149442, 2025: 239326 },
    "Guma": { 2021: 196055, 2022: 245246, 2023: 225779, 2024: 308978, 2025: 312199 },
    "Hidraulika": { 2021: 30628, 2022: 38606, 2023: 48020, 2024: 43939, 2025: 53812 },
    "Mehanika": { 2021: 393351, 2022: 489953, 2023: 603653, 2024: 621966, 2025: 752912 },
    "Redovan servis": { 2021: 177335, 2022: 191940, 2023: 208986, 2024: 230467, 2025: 260221 },
    "Signalizacija": { 2021: 22744, 2022: 29974, 2023: 39624, 2024: 29610, 2025: 50984 },
    "Tečnost": { 2021: 14192, 2022: 55092, 2023: 67218, 2024: 40451, 2025: 23502 }
  },
  interventions: {
    "Priključno": { 2021: 316, 2022: 383, 2023: 478, 2024: 461, 2025: 501 },
    "Putničko": { 2021: 593, 2022: 707, 2023: 1034, 2024: 937, 2025: 932 },
    "Radna mašina": { 2021: 167, 2022: 140, 2023: 133, 2024: 100, 2025: 113 },
    "Servis motornih vozila": { 2021: 1, 2022: 3, 2023: 5, 2024: 11, 2025: 21 },
    "Skladišna mehanizacija": { 2021: 858, 2022: 1259, 2023: 1441, 2024: 1737, 2025: 1471 },
    "Teretno": { 2021: 2574, 2022: 3148, 2023: 3432, 2024: 2535, 2025: 2641 }
  }
};

const LT_KPI_FIXED_PERCS = {
  units: {
    "Priključno": { "21/22": 0, "22/23": 3, "23/24": 21, "24/25": -2 },
    "Putničko": { "21/22": -4, "22/23": 0, "23/24": 21, "24/25": -1 },
    "Radna mašina": { "21/22": -50, "22/23": 0, "23/24": 60, "24/25": 0 },
    "Servis motornih vozila": { "21/22": 0, "22/23": 0, "23/24": 0, "24/25": 0 },
    "Skladišna mehanizacija": { "21/22": -7, "22/23": 21, "23/24": 19, "24/25": 42 },
    "Teretno": { "21/22": -4, "22/23": -18, "23/24": -3, "24/25": 12 },
    "Grand Total": { "21/22": -6, "22/23": 5, "23/24": 15, "24/25": 26 }
  },
  typeCost: {
    "Priključno": { "21/22": 77, "22/23": 14, "23/24": 15, "24/25": 38 },
    "Putničko": { "21/22": 28, "22/23": -2, "23/24": 17, "24/25": 11 },
    "Radna mašina": { "21/22": -32, "22/23": -17, "23/24": -21, "24/25": 83 },
    "Servis motornih vozila": { "21/22": 67, "22/23": -73, "23/24": 82, "24/25": 345 },
    "Skladišna mehanizacija": { "21/22": 52, "22/23": 47, "23/24": 1, "24/25": -2 },
    "Teretno": { "21/22": 16, "22/23": 14, "23/24": 15, "24/25": 25 },
    "Grand Total": { "21/22": 26, "22/23": 18, "23/24": 7, "24/25": 23 }
  },
  segmentCost: {
    "Elektronika": { "21/22": 29, "22/23": 144, "23/24": 61, "24/25": 60 },
    "Guma": { "21/22": 25, "22/23": -8, "23/24": 37, "24/25": 1 },
    "Hidraulika": { "21/22": 26, "22/23": 24, "23/24": -8, "24/25": 22 },
    "Mehanika": { "21/22": 25, "22/23": 23, "23/24": 3, "24/25": 21 },
    "Redovan servis": { "21/22": 8, "22/23": 9, "23/24": 10, "24/25": 13 },
    "Signalizacija": { "21/22": 32, "22/23": 32, "23/24": -25, "24/25": 72 },
    "Tečnost": { "21/22": 288, "22/23": 22, "23/24": -40, "24/25": -42 },
    "Grand Total": { "21/22": 26, "22/23": 18, "23/24": 7, "24/25": 23 }
  },
  interventions: {
    "Priključno": { "21/22": 21, "22/23": 25, "23/24": -4, "24/25": 9 },
    "Putničko": { "21/22": 19, "22/23": 46, "23/24": -9, "24/25": -1 },
    "Radna mašina": { "21/22": -16, "22/23": -5, "23/24": -25, "24/25": 13 },
    "Servis motornih vozila": { "21/22": 200, "22/23": 67, "23/24": 120, "24/25": 91 },
    "Skladišna mehanizacija": { "21/22": 47, "22/23": 14, "23/24": 21, "24/25": -15 },
    "Teretno": { "21/22": 22, "22/23": 9, "23/24": -26, "24/25": 4 },
    "Grand Total": { "21/22": 25, "22/23": 16, "23/24": -11, "24/25": -2 }
  }
};

const KPI_TOTAL_FLEET_BY_YEAR = {
  2021: { Total: 661, "Putničko": 107, "Radna mašina": 10, "Servis motornih vozila": 0, "Skladišna mehanizacija": 312, "Teretno": 195, "Priključno": 37 },
  2022: { Total: 623, "Putničko": 103, "Radna mašina": 5, "Servis motornih vozila": 0, "Skladišna mehanizacija": 291, "Teretno": 187, "Priključno": 37 },
  2023: { Total: 652, "Putničko": 103, "Radna mašina": 5, "Servis motornih vozila": 0, "Skladišna mehanizacija": 352, "Teretno": 154, "Priključno": 38 },
  2024: { Total: 747, "Putničko": 125, "Radna mašina": 8, "Servis motornih vozila": 0, "Skladišna mehanizacija": 419, "Teretno": 149, "Priključno": 46 },
  2025: { Total: 939, "Putničko": 124, "Radna mašina": 8, "Servis motornih vozila": 0, "Skladišna mehanizacija": 595, "Teretno": 167, "Priključno": 45 },
  2026: { Total: 938, "Putničko": 119, "Radna mašina": 8, "Servis motornih vozila": 0, "Skladišna mehanizacija": 594, "Teretno": 166, "Priključno": 51 }
};

export function MaintenanceAnalysis({
  costData,
  masterFleet,
  onSelectType,
  onSelectBrand
}) {
  const [fleetMode, setFleetMode] = useState("master"); // 'master' or 'active'
  const [selectedYear, setSelectedYear] = useState("2026");

  // Chart canvas refs
  const ltUnitsRef = useRef(null);
  const ltTypeRef = useRef(null);
  const ltSegmentRef = useRef(null);
  const ltIntRef = useRef(null);
  const chartInstances = useRef({});

  // Dinamički podaci za 2026. godinu (Egzaktno sabiranje troškova i bez dupliranja jedinica)
  const dynamic2026 = useMemo(() => {
    const data26 = {
      units: { "Priključno": 0, "Putničko": 0, "Radna mašina": 0, "Servis motornih vozila": 0, "Skladišna mehanizacija": 0, "Teretno": 0 },
      typeCost: { "Priključno": 0, "Putničko": 0, "Radna mašina": 0, "Servis motornih vozila": 0, "Skladišna mehanizacija": 0, "Teretno": 0 },
      segmentCost: { "Elektronika": 0, "Guma": 0, "Hidraulika": 0, "Mehanika": 0, "Redovan servis": 0, "Signalizacija": 0, "Tečnost": 0 },
      interventions: { "Priključno": 0, "Putničko": 0, "Radna mašina": 0, "Servis motornih vozila": 0, "Skladišna mehanizacija": 0, "Teretno": 0 }
    };

    // 1. Broj aktivnih jedinica u 2026.
    if (masterFleet && masterFleet.length > 0) {
      let activeCount = 0;
      masterFleet.forEach((v) => {
        const st = (v.status || "").toLowerCase().trim();
        if (st && st !== "aktivno") return;
        const normType = normalizeVehicleType(v.tipMehan || v.tipMehanizacije);
        if (data26.units[normType] !== undefined) {
          data26.units[normType]++;
          activeCount++;
        }
      });
      if (activeCount === 0) {
        // Fallback ako masterFleet nema status polje
        data26.units = { "Priključno": 51, "Putničko": 119, "Radna mašina": 8, "Servis motornih vozila": 0, "Skladišna mehanizacija": 594, "Teretno": 166 };
      }
    } else {
      data26.units = { "Priključno": 51, "Putničko": 119, "Radna mašina": 8, "Servis motornih vozila": 0, "Skladišna mehanizacija": 594, "Teretno": 166 };
    }

    // 2. Troškovi i intervencije u 2026.
    costData.forEach((item) => {
      if (item.year === 2026) {
        const normType = normalizeVehicleType(item.tipMehan);
        const cost = item.cost || 0;
        let segment = (item.segment || "").trim();

        if (segment === "Tecnost" || segment.toLowerCase().includes("tecnost")) segment = "Tečnost";

        if (data26.typeCost[normType] !== undefined) {
          data26.typeCost[normType] += cost;
          data26.interventions[normType]++;
        }
        if (data26.segmentCost[segment] !== undefined) {
          data26.segmentCost[segment] += cost;
        } else {
          data26.segmentCost["Redovan servis"] += cost;
        }
      }
    });

    return data26;
  }, [masterFleet, costData]);

  // Izračun 6 KPI kartica za gornji grid sa egzaktnom normalizacijom tipova
  const kpiCardsData = useMemo(() => {
    const targetY = selectedYear === "all" ? 2026 : parseInt(selectedYear);
    const dailyDataYear = costData.filter((c) => (selectedYear === "all" ? true : c.year === targetY));

    // Broj dana i mjeseci u periodu
    const monthsSet = new Set(dailyDataYear.map((c) => c.month).filter(Boolean));
    const monthsCount = monthsSet.size > 0 ? monthsSet.size : 6;
    const daysCount = monthsCount * 30.4;

    const yearKpiFleet = KPI_TOTAL_FLEET_BY_YEAR[targetY] || KPI_TOTAL_FLEET_BY_YEAR[2026];

    const typeYearTotals = {
      "Teretno": 0,
      "Putničko": 0,
      "Skladišna mehanizacija": 0,
      "Priključno": 0,
      "Radna mašina": 0,
      "Servis motornih vozila": 0
    };

    const typeVehicleSets = {
      "Teretno": new Set(),
      "Putničko": new Set(),
      "Skladišna mehanizacija": new Set(),
      "Priključno": new Set(),
      "Radna mašina": new Set(),
      "Servis motornih vozila": new Set()
    };

    dailyDataYear.forEach((item) => {
      const norm = normalizeVehicleType(item.tipMehan);
      if (typeYearTotals[norm] !== undefined) {
        typeYearTotals[norm] += item.cost || 0;
        if (item.reg && item.reg !== "-") {
          typeVehicleSets[norm].add(item.reg.trim().toUpperCase());
        }
      }
    });

    const standardTypes = [
      { name: "Teretna vozila", key: "Teretno", icon: "🚛" },
      { name: "Putnička vozila", key: "Putničko", icon: "🚗" },
      { name: "Skladišna mehanizacija", key: "Skladišna mehanizacija", icon: "🚜" },
      { name: "Priključna vozila", key: "Priključno", icon: "🚚" },
      { name: "Radna mašina", key: "Radna mašina", icon: "🏗️" },
      { name: "Servis motornih vozila", key: "Servis motornih vozila", icon: "🔧" }
    ];

    return standardTypes.map((t) => {
      const cost = typeYearTotals[t.key] || 0;
      let vehCount = 0;

      if (fleetMode === "master") {
        vehCount = yearKpiFleet[t.key] || 0;
      } else {
        vehCount = typeVehicleSets[t.key]?.size || 0;
      }

      const dailyPerVehicle = vehCount > 0 && daysCount > 0 ? cost / (vehCount * daysCount) : 0;
      const monthlyPerVehicle = vehCount > 0 && monthsCount > 0 ? cost / (vehCount * monthsCount) : 0;

      return {
        ...t,
        cost,
        vehCount,
        dailyPerVehicle,
        monthlyPerVehicle,
        targetY
      };
    });
  }, [costData, selectedYear, fleetMode]);

  // Crtanje 4 mini grafikona za dugoročni KPI
  useEffect(() => {
    const renderMiniChart = (canvasRef, chartKey, totals, label, barColor) => {
      if (!canvasRef.current) return;
      if (chartInstances.current[chartKey]) chartInstances.current[chartKey].destroy();

      const ctx = canvasRef.current.getContext("2d");
      const dataArray = [totals[2021], totals[2022], totals[2023], totals[2024], totals[2025], totals[2026]];

      chartInstances.current[chartKey] = new ChartJS(ctx, {
        type: "bar",
        data: {
          labels: ["2021", "2022", "2023", "2024", "2025", "2026"],
          datasets: [
            {
              label,
              data: dataArray,
              backgroundColor: ["#94a3b8", "#94a3b8", "#94a3b8", "#94a3b8", "#94a3b8", barColor],
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            datalabels: { display: false },
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true, display: false },
            x: { grid: { display: false }, ticks: { font: { size: 9, weight: "bold" } } }
          }
        }
      });
    };

    // 1. Units Totals
    const tUnits = { 2021: 0, 2022: 0, 2023: 0, 2024: 0, 2025: 0, 2026: 0 };
    Object.keys(LT_KPI_FIXED_DATA.units).forEach((k) => {
      for (let y = 2021; y <= 2025; y++) tUnits[y] += LT_KPI_FIXED_DATA.units[k][y];
      tUnits[2026] += dynamic2026.units[k] || 0;
    });
    renderMiniChart(ltUnitsRef, "units", tUnits, "Broj jedinica", "#4f46e5");

    // 2. Type Cost Totals
    const tType = { 2021: 0, 2022: 0, 2023: 0, 2024: 0, 2025: 0, 2026: 0 };
    Object.keys(LT_KPI_FIXED_DATA.typeCost).forEach((k) => {
      for (let y = 2021; y <= 2025; y++) tType[y] += LT_KPI_FIXED_DATA.typeCost[k][y];
      tType[2026] += dynamic2026.typeCost[k] || 0;
    });
    renderMiniChart(ltTypeRef, "typeCost", tType, "Trošak (Tip)", "#2563eb");

    // 3. Segment Cost Totals
    const tSeg = { 2021: 0, 2022: 0, 2023: 0, 2024: 0, 2025: 0, 2026: 0 };
    Object.keys(LT_KPI_FIXED_DATA.segmentCost).forEach((k) => {
      for (let y = 2021; y <= 2025; y++) tSeg[y] += LT_KPI_FIXED_DATA.segmentCost[k][y];
      tSeg[2026] += dynamic2026.segmentCost[k] || 0;
    });
    renderMiniChart(ltSegmentRef, "segmentCost", tSeg, "Trošak (Segment)", "#059669");

    // 4. Interventions Totals
    const tInt = { 2021: 0, 2022: 0, 2023: 0, 2024: 0, 2025: 0, 2026: 0 };
    Object.keys(LT_KPI_FIXED_DATA.interventions).forEach((k) => {
      for (let y = 2021; y <= 2025; y++) tInt[y] += LT_KPI_FIXED_DATA.interventions[k][y];
      tInt[2026] += dynamic2026.interventions[k] || 0;
    });
    renderMiniChart(ltIntRef, "interventions", tInt, "Broj opravki", "#d97706");

    return () => {
      Object.values(chartInstances.current).forEach((inst) => inst?.destroy());
    };
  }, [dynamic2026]);

  const renderTableRows = (fixedData, fixedPercs, dynamicData, isCost) => {
    const keys = Object.keys(fixedData);
    const totals = { 2021: 0, 2022: 0, 2023: 0, 2024: 0, 2025: 0, 2026: 0 };

    const rows = keys.map((k) => {
      const v21 = fixedData[k][2021];
      const v22 = fixedData[k][2022];
      const v23 = fixedData[k][2023];
      const v24 = fixedData[k][2024];
      const v25 = fixedData[k][2025];
      const v26 = dynamicData[k] || 0;

      totals[2021] += v21;
      totals[2022] += v22;
      totals[2023] += v23;
      totals[2024] += v24;
      totals[2025] += v25;
      totals[2026] += v26;

      const p21_22 = fixedPercs[k]["21/22"];
      const p22_23 = fixedPercs[k]["22/23"];
      const p23_24 = fixedPercs[k]["23/24"];
      const p24_25 = fixedPercs[k]["24/25"];
      const p25_26 = v25 === 0 ? 0 : Math.round(((v26 - v25) / v25) * 100);
      const p21_26 = v21 === 0 ? 0 : Math.round(((v26 - v21) / v21) * 100);

      const formatLtYoy = (val) => {
        if (val === undefined || val === null || val === "-") return "-";
        const num = parseFloat(val);
        if (isNaN(num)) return "-";
        const isPos = num > 0;
        let color = "text-slate-500";
        if (num !== 0) {
          color = isCost ? (isPos ? "text-red-600 font-bold" : "text-emerald-600 font-bold") : (isPos ? "text-emerald-600 font-bold" : "text-red-600 font-bold");
        }
        return <span className={color}>{num}%</span>;
      };

      return (
        <tr key={k} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <td className="py-2 px-2.5 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700">
            {k}
          </td>
          <td className={`py-2 px-2 ${isCost ? "text-right" : "text-center"}`}>{isCost ? formatKM(v21) : v21}</td>
          <td className={`py-2 px-2 ${isCost ? "text-right" : "text-center"}`}>{isCost ? formatKM(v22) : v22}</td>
          <td className={`py-2 px-2 ${isCost ? "text-right" : "text-center"}`}>{isCost ? formatKM(v23) : v23}</td>
          <td className={`py-2 px-2 ${isCost ? "text-right" : "text-center"}`}>{isCost ? formatKM(v24) : v24}</td>
          <td className={`py-2 px-2 ${isCost ? "text-right" : "text-center"}`}>{isCost ? formatKM(v25) : v25}</td>
          <td className={`py-2 px-2 font-black text-indigo-700 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/30 ${isCost ? "text-right" : "text-center"}`}>
            {isCost ? formatKM(v26) : v26}
          </td>
          <td className="py-2 px-1 text-center bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">{formatLtYoy(p21_22)}</td>
          <td className="py-2 px-1 text-center bg-slate-50 dark:bg-slate-900">{formatLtYoy(p22_23)}</td>
          <td className="py-2 px-1 text-center bg-slate-50 dark:bg-slate-900">{formatLtYoy(p23_24)}</td>
          <td className="py-2 px-1 text-center bg-slate-50 dark:bg-slate-900">{formatLtYoy(p24_25)}</td>
          <td className="py-2 px-1 text-center bg-indigo-50/50 dark:bg-indigo-950/50">{formatLtYoy(p25_26)}</td>
          <td className="py-2 px-1 text-center bg-indigo-100/60 dark:bg-indigo-900/40 font-black border-l border-indigo-200 dark:border-indigo-800">{formatLtYoy(p21_26)}</td>
        </tr>
      );
    });

    const tp21_22 = fixedPercs["Grand Total"]?.["21/22"] || 0;
    const tp22_23 = fixedPercs["Grand Total"]?.["22/23"] || 0;
    const tp23_24 = fixedPercs["Grand Total"]?.["23/24"] || 0;
    const tp24_25 = fixedPercs["Grand Total"]?.["24/25"] || 0;
    const tp25_26 = totals[2025] === 0 ? 0 : Math.round(((totals[2026] - totals[2025]) / totals[2025]) * 100);
    const tp21_26 = totals[2021] === 0 ? 0 : Math.round(((totals[2026] - totals[2021]) / totals[2021]) * 100);

    const grandTotalRow = (
      <tr key="grand_total" className="bg-slate-200/80 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600">
        <td className="py-2.5 px-2.5 uppercase border-r border-slate-300 dark:border-slate-600">Grand Total</td>
        <td className={`py-2.5 px-2 ${isCost ? "text-right" : "text-center"}`}>{isCost ? formatKM(totals[2021]) : totals[2021]}</td>
        <td className={`py-2.5 px-2 ${isCost ? "text-right" : "text-center"}`}>{isCost ? formatKM(totals[2022]) : totals[2022]}</td>
        <td className={`py-2.5 px-2 ${isCost ? "text-right" : "text-center"}`}>{isCost ? formatKM(totals[2023]) : totals[2023]}</td>
        <td className={`py-2.5 px-2 ${isCost ? "text-right" : "text-center"}`}>{isCost ? formatKM(totals[2024]) : totals[2024]}</td>
        <td className={`py-2.5 px-2 ${isCost ? "text-right" : "text-center"}`}>{isCost ? formatKM(totals[2025]) : totals[2025]}</td>
        <td className={`py-2.5 px-2 text-indigo-900 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950 font-black ${isCost ? "text-right" : "text-center"}`}>
          {isCost ? formatKM(totals[2026]) : totals[2026]}
        </td>
        <td className="py-2.5 px-1 text-center bg-slate-300/40 dark:bg-slate-700/50 border-l border-slate-300 dark:border-slate-600">{tp21_22}%</td>
        <td className="py-2.5 px-1 text-center bg-slate-300/40 dark:bg-slate-700/50">{tp22_23}%</td>
        <td className="py-2.5 px-1 text-center bg-slate-300/40 dark:bg-slate-700/50">{tp23_24}%</td>
        <td className="py-2.5 px-1 text-center bg-slate-300/40 dark:bg-slate-700/50">{tp24_25}%</td>
        <td className="py-2.5 px-1 text-center bg-indigo-200/60 dark:bg-indigo-900/60 font-black">{tp25_26}%</td>
        <td className="py-2.5 px-1 text-center bg-indigo-300/60 dark:bg-indigo-900/80 font-black border-l border-indigo-400 dark:border-indigo-700">{tp21_26}%</td>
      </tr>
    );

    return [...rows, grandTotalRow];
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Prosječan Trošak PO JEDINICI (Vozilu) - Kontrolna Traka & 6 KPI Kartica */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-black flex items-center gap-2">
            <span>Prosječan Trošak PO JEDINICI (Vozilu)</span>
          </h3>
          <p className="text-xs text-blue-200 mt-0.5">
            Egzaktna struktura flote iz "KPI Total" (938 aktivnih vozila u 2026.)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Prekidač Flote */}
          <div className="bg-white/10 p-1 rounded-xl border border-white/20 flex items-center text-xs font-bold">
            <button
              onClick={() => setFleetMode("master")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                fleetMode === "master"
                  ? "bg-white text-blue-950 shadow-md font-black"
                  : "text-blue-100 hover:text-white"
              }`}
            >
              Flota iz KPI Total (938)
            </button>
            <button
              onClick={() => setFleetMode("active")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                fleetMode === "active"
                  ? "bg-white text-blue-950 shadow-md font-black"
                  : "text-blue-100 hover:text-white"
              }`}
            >
              Samo Servisirana Vozila
            </button>
          </div>

          {/* Birač Godine */}
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 text-xs">
            <span className="font-semibold text-blue-200">Godina:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white text-slate-800 font-bold rounded-lg px-2 py-1 text-xs outline-none cursor-pointer"
            >
              <option value="2026">2026. godina</option>
              <option value="2025">2025. godina</option>
              <option value="2024">2024. godina</option>
              <option value="2023">2023. godina</option>
              <option value="2022">2022. godina</option>
              <option value="2021">2021. godina</option>
              <option value="all">Sve godine (Zbirno)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 6 DOKAZANIH SUMMARY KARTICA IZ V1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCardsData.map((item) => (
          <div
            key={item.name}
            className="bg-white dark:bg-slate-800 p-4 rounded-2xl border-l-4 border-indigo-600 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-extrabold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider truncate">
                  {item.icon} {item.name}
                </span>
                <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {item.vehCount} voz.
                </span>
              </div>

              <h4 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {item.dailyPerVehicle.toLocaleString("bs-BA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM
                <span className="text-[10px] font-semibold text-slate-400 ml-1">/ dan</span>
              </h4>

              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                🗓️ {item.monthlyPerVehicle.toLocaleString("bs-BA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM
                <span className="font-normal text-slate-400 text-[10px]"> / mj.</span>
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-[10px]">
              <span className="text-slate-400">Trošak ({item.targetY}.):</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {formatKM(item.cost)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 2. DUGOROČNI KPI TRETMAN (2021-2026) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 border-indigo-100/50 dark:border-slate-700 shadow-sm space-y-8">
        <div className="pb-3 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            <span>Dugoročni KPI (Pregled trendova kroz godine 2021 - 2026)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Strateški pregled promjena od 2021. do 2026. godine na osnovu cjelokupne baze (fiksne vrijednosti do 2025., dinamičke za 2026.).
          </p>
        </div>

        {/* Tabela 1: Broj jedinica */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <table className="min-w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Broj jedinica</th>
                  <th className="py-2.5 px-2 text-center">2021</th>
                  <th className="py-2.5 px-2 text-center">2022</th>
                  <th className="py-2.5 px-2 text-center">2023</th>
                  <th className="py-2.5 px-2 text-center">2024</th>
                  <th className="py-2.5 px-2 text-center">2025</th>
                  <th className="py-2.5 px-2 text-center font-black text-indigo-700 dark:text-indigo-400">2026</th>
                  <th className="py-2.5 px-1 text-center bg-slate-200/50 dark:bg-slate-800">21/22 %</th>
                  <th className="py-2.5 px-1 text-center bg-slate-200/50 dark:bg-slate-800">22/23 %</th>
                  <th className="py-2.5 px-1 text-center bg-slate-200/50 dark:bg-slate-800">23/24 %</th>
                  <th className="py-2.5 px-1 text-center bg-slate-200/50 dark:bg-slate-800">24/25 %</th>
                  <th className="py-2.5 px-1 text-center bg-indigo-50 dark:bg-indigo-950 font-bold text-indigo-700 dark:text-indigo-400">25/26 %</th>
                  <th className="py-2.5 px-1 text-center bg-indigo-100 dark:bg-indigo-900/60 font-black text-indigo-900 dark:text-indigo-200 border-l border-indigo-200 dark:border-indigo-800">21/26 %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-900">
                {renderTableRows(LT_KPI_FIXED_DATA.units, LT_KPI_FIXED_PERCS.units, dynamic2026.units, false)}
              </tbody>
            </table>
          </div>
          <div className="h-[200px] xl:col-span-1 flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/40">
            <span className="text-xs font-bold text-slate-500 mb-2">Trend: Ukupan broj jedinica</span>
            <div className="w-full h-full relative">
              <canvas ref={ltUnitsRef} />
            </div>
          </div>
        </div>

        {/* Tabela 2: Tip Mehanizacije (Trošak KM) */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <table className="min-w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Tip mehanizacije</th>
                  <th className="py-2.5 px-2 text-right">2021</th>
                  <th className="py-2.5 px-2 text-right">2022</th>
                  <th className="py-2.5 px-2 text-right">2023</th>
                  <th className="py-2.5 px-2 text-right">2024</th>
                  <th className="py-2.5 px-2 text-right">2025</th>
                  <th className="py-2.5 px-2 text-right font-black text-indigo-700 dark:text-indigo-400">2026</th>
                  <th className="py-2.5 px-1 text-right bg-slate-200/50 dark:bg-slate-800">21/22 %</th>
                  <th className="py-2.5 px-1 text-right bg-slate-200/50 dark:bg-slate-800">22/23 %</th>
                  <th className="py-2.5 px-1 text-right bg-slate-200/50 dark:bg-slate-800">23/24 %</th>
                  <th className="py-2.5 px-1 text-right bg-slate-200/50 dark:bg-slate-800">24/25 %</th>
                  <th className="py-2.5 px-1 text-right bg-indigo-50 dark:bg-indigo-950 font-bold text-indigo-700 dark:text-indigo-400">25/26 %</th>
                  <th className="py-2.5 px-1 text-right bg-indigo-100 dark:bg-indigo-900/60 font-black text-indigo-900 dark:text-indigo-200 border-l border-indigo-200 dark:border-indigo-800">21/26 %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-900">
                {renderTableRows(LT_KPI_FIXED_DATA.typeCost, LT_KPI_FIXED_PERCS.typeCost, dynamic2026.typeCost, true)}
              </tbody>
            </table>
          </div>
          <div className="h-[200px] xl:col-span-1 flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/40">
            <span className="text-xs font-bold text-slate-500 mb-2">Trend: Ukupan trošak (KM)</span>
            <div className="w-full h-full relative">
              <canvas ref={ltTypeRef} />
            </div>
          </div>
        </div>

        {/* Tabela 3: Segment (Trošak KM) */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <table className="min-w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Segment</th>
                  <th className="py-2.5 px-2 text-right">2021</th>
                  <th className="py-2.5 px-2 text-right">2022</th>
                  <th className="py-2.5 px-2 text-right">2023</th>
                  <th className="py-2.5 px-2 text-right">2024</th>
                  <th className="py-2.5 px-2 text-right">2025</th>
                  <th className="py-2.5 px-2 text-right font-black text-indigo-700 dark:text-indigo-400">2026</th>
                  <th className="py-2.5 px-1 text-right bg-slate-200/50 dark:bg-slate-800">21/22 %</th>
                  <th className="py-2.5 px-1 text-right bg-slate-200/50 dark:bg-slate-800">22/23 %</th>
                  <th className="py-2.5 px-1 text-right bg-slate-200/50 dark:bg-slate-800">23/24 %</th>
                  <th className="py-2.5 px-1 text-right bg-slate-200/50 dark:bg-slate-800">24/25 %</th>
                  <th className="py-2.5 px-1 text-right bg-indigo-50 dark:bg-indigo-950 font-bold text-indigo-700 dark:text-indigo-400">25/26 %</th>
                  <th className="py-2.5 px-1 text-right bg-indigo-100 dark:bg-indigo-900/60 font-black text-indigo-900 dark:text-indigo-200 border-l border-indigo-200 dark:border-indigo-800">21/26 %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-900">
                {renderTableRows(LT_KPI_FIXED_DATA.segmentCost, LT_KPI_FIXED_PERCS.segmentCost, dynamic2026.segmentCost, true)}
              </tbody>
            </table>
          </div>
          <div className="h-[200px] xl:col-span-1 flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/40">
            <span className="text-xs font-bold text-slate-500 mb-2">Trend: Trošak po segmentima</span>
            <div className="w-full h-full relative">
              <canvas ref={ltSegmentRef} />
            </div>
          </div>
        </div>

        {/* Tabela 4: Broj opravki */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <table className="min-w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Broj opravki</th>
                  <th className="py-2.5 px-2 text-center">2021</th>
                  <th className="py-2.5 px-2 text-center">2022</th>
                  <th className="py-2.5 px-2 text-center">2023</th>
                  <th className="py-2.5 px-2 text-center">2024</th>
                  <th className="py-2.5 px-2 text-center">2025</th>
                  <th className="py-2.5 px-2 text-center font-black text-indigo-700 dark:text-indigo-400">2026</th>
                  <th className="py-2.5 px-1 text-center bg-slate-200/50 dark:bg-slate-800">21/22 %</th>
                  <th className="py-2.5 px-1 text-center bg-slate-200/50 dark:bg-slate-800">22/23 %</th>
                  <th className="py-2.5 px-1 text-center bg-slate-200/50 dark:bg-slate-800">23/24 %</th>
                  <th className="py-2.5 px-1 text-center bg-slate-200/50 dark:bg-slate-800">24/25 %</th>
                  <th className="py-2.5 px-1 text-center bg-indigo-50 dark:bg-indigo-950 font-bold text-indigo-700 dark:text-indigo-400">25/26 %</th>
                  <th className="py-2.5 px-1 text-center bg-indigo-100 dark:bg-indigo-900/60 font-black text-indigo-900 dark:text-indigo-200 border-l border-indigo-200 dark:border-indigo-800">21/26 %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-900">
                {renderTableRows(LT_KPI_FIXED_DATA.interventions, LT_KPI_FIXED_PERCS.interventions, dynamic2026.interventions, false)}
              </tbody>
            </table>
          </div>
          <div className="h-[200px] xl:col-span-1 flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/40">
            <span className="text-xs font-bold text-slate-500 mb-2">Trend: Ukupan broj opravki</span>
            <div className="w-full h-full relative">
              <canvas ref={ltIntRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
