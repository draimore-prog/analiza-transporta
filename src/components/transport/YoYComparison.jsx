"use client";

import React, { useState, useMemo } from "react";
import { formatKM } from "@/lib/calculations.js";
import { Download, Printer, TrendingUp, Calendar, Layers, Truck } from "lucide-react";
import * as XLSX from "xlsx";

const MONTH_NAMES = [
  "Januar", "Februar", "Mart", "April", "Maj", "Juni",
  "Juli", "August", "Septembar", "Oktobar", "Novembar", "Decembar"
];

export function YoYComparison({ costData }) {
  const [yearA, setYearA] = useState(2026);
  const [yearB, setYearB] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState("all");

  const availableYears = useMemo(() => {
    const set = new Set(costData.map((c) => c.year).filter(Boolean));
    return Array.from(set).sort((a, b) => b - a);
  }, [costData]);

  // Aktivni mjeseci za godinu A
  const activeMonthsForYearA = useMemo(() => {
    const set = new Set(costData.filter((c) => c.year === yearA).map((c) => c.month).filter(Boolean));
    return Array.from(set).sort((a, b) => a - b);
  }, [costData, yearA]);

  const targetPeriodMonths = useMemo(() => {
    if (selectedMonth !== "all") return [parseInt(selectedMonth)];
    return activeMonthsForYearA.length > 0 ? activeMonthsForYearA : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }, [selectedMonth, activeMonthsForYearA]);

  const periodLabel = useMemo(() => {
    if (selectedMonth !== "all") {
      return `${MONTH_NAMES[parseInt(selectedMonth) - 1]} (${yearA}. vs ${yearB}.)`;
    }
    const startM = Math.min(...targetPeriodMonths);
    const endM = Math.max(...targetPeriodMonths);
    return `Period ${startM < 10 ? "0" + startM : startM}.-${endM < 10 ? "0" + endM : endM}. (${yearA}. vs ${yearB}.)`;
  }, [selectedMonth, targetPeriodMonths, yearA, yearB]);

  // Podaci za period A i period B
  const dataPeriodA = useMemo(() => {
    return costData.filter((c) => c.year === yearA && targetPeriodMonths.includes(c.month));
  }, [costData, yearA, targetPeriodMonths]);

  const dataPeriodB = useMemo(() => {
    return costData.filter((c) => c.year === yearB && targetPeriodMonths.includes(c.month));
  }, [costData, yearB, targetPeriodMonths]);

  // Podaci za MoM (Tekući mjesec vs Prethodni mjesec)
  const currentMonthNum = selectedMonth !== "all" ? parseInt(selectedMonth) : (activeMonthsForYearA.length > 0 ? Math.max(...activeMonthsForYearA) : 6);
  const prevMonthNum = currentMonthNum > 1 ? currentMonthNum - 1 : 12;
  const prevMonthYear = currentMonthNum > 1 ? yearA : yearA - 1;

  const dataCurrentMonth = useMemo(() => {
    return costData.filter((c) => c.year === yearA && c.month === currentMonthNum);
  }, [costData, yearA, currentMonthNum]);

  const dataPrevMonth = useMemo(() => {
    return costData.filter((c) => c.year === prevMonthYear && c.month === prevMonthNum);
  }, [costData, prevMonthYear, prevMonthNum]);

  // Funkcija za generisanje komparativne tabele
  const generateComparisonRows = (currData, prevData, groupKey, labelA, labelB) => {
    const mapA = {};
    const mapB = {};
    const allKeys = new Set();

    currData.forEach((d) => {
      const k = d[groupKey] || "Ostalo";
      mapA[k] = (mapA[k] || 0) + (d.cost || 0);
      allKeys.add(k);
    });

    prevData.forEach((d) => {
      const k = d[groupKey] || "Ostalo";
      mapB[k] = (mapB[k] || 0) + (d.cost || 0);
      allKeys.add(k);
    });

    const sorted = Array.from(allKeys).sort((a, b) => {
      const sumA = (mapA[a] || 0) + (mapB[a] || 0);
      const sumB = (mapA[b] || 0) + (mapB[b] || 0);
      return sumB - sumA;
    });

    let totalA = 0;
    let totalB = 0;

    const rows = sorted.map((k) => {
      const costA = mapA[k] || 0;
      const costB = mapB[k] || 0;
      totalA += costA;
      totalB += costB;

      const diffKM = costA - costB;
      const diffPerc = costB > 0 ? ((costA - costB) / costB) * 100 : (costA > 0 ? 100 : 0);

      let badge = <span className="text-slate-400 font-bold">0.0%</span>;
      if (diffKM > 0) {
        badge = (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            🔴 +{diffPerc.toFixed(1)}%
          </span>
        );
      } else if (diffKM < 0) {
        badge = (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            🟢 {diffPerc.toFixed(1)}%
          </span>
        );
      }

      return (
        <tr key={k} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700">
            {k}
          </td>
          <td className="py-2 px-3 text-right font-semibold text-slate-900 dark:text-white">
            {formatKM(costA)}
          </td>
          <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400">
            {formatKM(costB)}
          </td>
          <td className="py-2 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
            {diffKM >= 0 ? `+${formatKM(diffKM)}` : formatKM(diffKM)}
          </td>
          <td className="py-2 px-3 text-center">{badge}</td>
        </tr>
      );
    });

    const grandDiffKM = totalA - totalB;
    const grandDiffPerc = totalB > 0 ? ((totalA - totalB) / totalB) * 100 : (totalA > 0 ? 100 : 0);

    const grandTotalRow = (
      <tr key="total" className="bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600">
        <td className="py-2.5 px-3 uppercase border-r border-slate-300 dark:border-slate-600">Grand Total</td>
        <td className="py-2.5 px-3 text-right text-indigo-900 dark:text-indigo-300 font-black">{formatKM(totalA)}</td>
        <td className="py-2.5 px-3 text-right">{formatKM(totalB)}</td>
        <td className="py-2.5 px-3 text-right">{grandDiffKM >= 0 ? `+${formatKM(grandDiffKM)}` : formatKM(grandDiffKM)}</td>
        <td className="py-2.5 px-3 text-center">
          {grandDiffKM > 0 ? (
            <span className="px-2 py-0.5 rounded text-[11px] font-black bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300">
              🔴 +{grandDiffPerc.toFixed(1)}%
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[11px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
              🟢 {grandDiffPerc.toFixed(1)}%
            </span>
          )}
        </td>
      </tr>
    );

    return (
      <table className="min-w-full text-xs text-left border-collapse">
        <thead className="bg-slate-100 dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700">Stavka</th>
            <th className="py-2.5 px-3 text-right font-black text-indigo-700 dark:text-indigo-400">{labelA}</th>
            <th className="py-2.5 px-3 text-right">{labelB}</th>
            <th className="py-2.5 px-3 text-right">Razlika (KM)</th>
            <th className="py-2.5 px-3 text-center">YoY %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-900">
          {rows}
          {grandTotalRow}
        </tbody>
      </table>
    );
  };

  // 5. Višegodišnja mjesečna matrica troškova (2021-2026)
  const matrixYears = [2021, 2022, 2023, 2024, 2025, 2026];
  const matrixData = useMemo(() => {
    const matrix = {};
    for (let m = 1; m <= 12; m++) {
      matrix[m] = {};
      matrixYears.forEach((y) => (matrix[m][y] = 0));
    }

    costData.forEach((c) => {
      if (matrix[c.month] && matrix[c.month][c.year] !== undefined) {
        matrix[c.month][c.year] += c.cost || 0;
      }
    });

    return matrix;
  }, [costData]);

  const yearTotals = useMemo(() => {
    const totals = {};
    matrixYears.forEach((y) => (totals[y] = 0));
    for (let m = 1; m <= 12; m++) {
      matrixYears.forEach((y) => (totals[y] += matrixData[m][y] || 0));
    }
    return totals;
  }, [matrixData]);

  // Export svih komparativnih tabela u Excel
  const handleExportAllToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Matrica troškova
    const matrixRows = [];
    MONTH_NAMES.forEach((mName, idx) => {
      const row = { Mjesec: mName };
      matrixYears.forEach((y) => {
        row[`${y}. godina`] = matrixData[idx + 1][y] || 0;
      });
      matrixRows.push(row);
    });
    const wsMatrix = XLSX.utils.json_to_sheet(matrixRows);
    XLSX.utils.book_append_sheet(wb, wsMatrix, "Mjesečna_Matrica_KM");

    XLSX.writeFile(wb, `Komparativni_Izvjestaj_YoY_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Kartica za Komparativnu Analizu */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <span>📊 YoY Komparativna Analiza & KPI Mjesečni</span>
              <span className="text-xs bg-indigo-500/30 text-indigo-200 border border-indigo-400 px-3 py-0.5 rounded-full font-mono font-bold">
                {periodLabel}
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Poređenje proteklih mjeseci tekuće godine naspram istog perioda prošle godine (YoY i MoM) sa indikatorima ušteda (🟢) ili rasta (🔴)
            </p>
          </div>
        </div>
      </div>

      {/* CONTROL BAR ZA IZBOR GODINA I MJESECI */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Glavna Godina (A):</label>
            <select
              value={yearA}
              onChange={(e) => setYearA(parseInt(e.target.value))}
              className="text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer outline-none"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}. godina
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs font-bold text-slate-400">vs</span>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Usporedna Godina (B):</label>
            <select
              value={yearB}
              onChange={(e) => setYearB(parseInt(e.target.value))}
              className="text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer outline-none"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}. godina
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 ml-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Mjesec / Period:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer outline-none"
            >
              <option value="all">Svi tekući mjeseci (YTD Kumulativno)</option>
              {MONTH_NAMES.map((mName, idx) => (
                <option key={idx + 1} value={(idx + 1).toString()}>
                  {mName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAllToExcel}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-3.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF / Print</span>
          </button>
        </div>
      </div>

      {/* 1. YTD / PERIOD KOMPARACIJA (2 KARTICE: TIP MEHANIZACIJE & SEGMENTI) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Podjela po Tipu Mehanizacije */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
            <Truck className="w-4 h-4 text-blue-600" />
            <span>1. Komparacija po Tipu Mehanizacije</span>
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            {generateComparisonRows(dataPeriodA, dataPeriodB, "tipMehan", `${yearA}.`, `${yearB}.`)}
          </div>
        </div>

        {/* Podjela po Segmentima */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>2. Komparacija po Segmentima Troškova</span>
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            {generateComparisonRows(dataPeriodA, dataPeriodB, "segment", `${yearA}.`, `${yearB}.`)}
          </div>
        </div>
      </div>

      {/* 2. MJESEČNA YOY I MOM POREĐENJA (2 KARTICE) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* YoY: Mjesec na isti mjesec prošle godine */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>3. Mjesec na Isti Mjesec Prošle Godine ({MONTH_NAMES[currentMonthNum - 1]})</span>
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            {generateComparisonRows(
              costData.filter((c) => c.year === yearA && c.month === currentMonthNum),
              costData.filter((c) => c.year === yearB && c.month === currentMonthNum),
              "tipMehan",
              `${MONTH_NAMES[currentMonthNum - 1]} ${yearA}.`,
              `${MONTH_NAMES[currentMonthNum - 1]} ${yearB}.`
            )}
          </div>
        </div>

        {/* MoM: Mjesec na prethodni mjesec */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <span>4. Mjesec na Prethodni Mjesec (MoM)</span>
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            {generateComparisonRows(
              dataCurrentMonth,
              dataPrevMonth,
              "tipMehan",
              `${MONTH_NAMES[currentMonthNum - 1]} ${yearA}.`,
              `${MONTH_NAMES[prevMonthNum - 1]} ${prevMonthYear}.`
            )}
          </div>
        </div>
      </div>

      {/* 3. VIŠEGODIŠNJA MJESEČNA MATRICA TROŠKOVA (NOMINALNI IZNOSI U KM) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>📊 Višegodišnja Mjesečna Matrica Troškova (Nominalni Iznosi u KM)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Poređenje ukupnih troškova održavanja po mjesecima i godinama (2021 - 2026)
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-xs text-center border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3 text-left border-r border-slate-200 dark:border-slate-700">Mjesec</th>
                {matrixYears.map((y) => (
                  <th
                    key={y}
                    className={`py-2.5 px-3 ${y === 2026 ? "font-black text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950" : ""}`}
                  >
                    {y}. godina
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-900">
              {MONTH_NAMES.map((mName, idx) => (
                <tr key={mName} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-2 px-3 text-left font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700">
                    {mName}
                  </td>
                  {matrixYears.map((y) => {
                    const cost = matrixData[idx + 1][y] || 0;
                    return (
                      <td
                        key={y}
                        className={`py-2 px-3 ${
                          y === 2026
                            ? "font-bold text-indigo-900 dark:text-indigo-200 bg-indigo-50/30 dark:bg-indigo-950/20"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {cost > 0 ? formatKM(cost) : "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Grand Total red */}
              <tr className="bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600">
                <td className="py-2.5 px-3 text-left uppercase border-r border-slate-300 dark:border-slate-600">Grand Total</td>
                {matrixYears.map((y) => (
                  <td
                    key={y}
                    className={`py-2.5 px-3 ${y === 2026 ? "text-indigo-900 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950 font-black" : ""}`}
                  >
                    {formatKM(yearTotals[y])}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. VIŠEGODIŠNJA MATRICA POSTOTNIH RAZLIKA (YOY % RAST / PAD) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>📈 Višegodišnja Matrica Postotnih Razlika (YoY % Rast / Pad)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Postotne izmjene u odnosu na prethodnu godinu (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Zeleno = Smanjenje troškova / Ušteda 📉</span> |{" "}
            <span className="text-red-600 dark:text-red-400 font-bold">Crveno = Povećanje troškova 📈</span>)
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-xs text-center border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3 text-left border-r border-slate-200 dark:border-slate-700">Mjesec</th>
                <th className="py-2.5 px-3">21/22 %</th>
                <th className="py-2.5 px-3">22/23 %</th>
                <th className="py-2.5 px-3">23/24 %</th>
                <th className="py-2.5 px-3">24/25 %</th>
                <th className="py-2.5 px-3 font-black text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950">25/26 %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-900">
              {MONTH_NAMES.map((mName, idx) => {
                const m = idx + 1;
                const calcPerc = (yNew, yOld) => {
                  const cNew = matrixData[m][yNew] || 0;
                  const cOld = matrixData[m][yOld] || 0;
                  if (cOld === 0 && cNew === 0) return "-";
                  if (cOld === 0) return "+100%";
                  const p = ((cNew - cOld) / cOld) * 100;
                  const isPos = p > 0;
                  return (
                    <span className={`font-bold ${isPos ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {isPos ? `+${p.toFixed(1)}%` : `${p.toFixed(1)}%`}
                    </span>
                  );
                };

                return (
                  <tr key={mName} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2 px-3 text-left font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700">
                      {mName}
                    </td>
                    <td className="py-2 px-3">{calcPerc(2022, 2021)}</td>
                    <td className="py-2 px-3">{calcPerc(2023, 2022)}</td>
                    <td className="py-2 px-3">{calcPerc(2024, 2023)}</td>
                    <td className="py-2 px-3">{calcPerc(2025, 2024)}</td>
                    <td className="py-2 px-3 bg-indigo-50/30 dark:bg-indigo-950/20">{calcPerc(2026, 2025)}</td>
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
