"use client";

import React from "react";
import { X, Printer, Info } from "lucide-react";
import { CHECKLIST_ITEMS } from "@/hooks/useWarehouseWorkOrders.js";

export function WorkOrderPrintModal({ isOpen, onClose, workOrder }) {
  if (!isOpen || !workOrder) return null;

  const handlePrint = () => {
    window.print();
  };

  const v = workOrder.vehicleDetails || {};
  const checklist = workOrder.checklist || {};
  const formattedDate = workOrder.createdAt
    ? new Date(workOrder.createdAt).toLocaleDateString("bs-BA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      })
    : new Date().toLocaleDateString("bs-BA");

  // Razdvajanje 8 sklopova u 2 kolone po 4 stavke
  const col1Items = CHECKLIST_ITEMS.slice(0, 4);
  const col2Items = CHECKLIST_ITEMS.slice(4, 8);

  return (
    <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-md flex justify-center items-center z-[9995] p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:h-auto print:overflow-visible animate-in fade-in">
      {/* CSS pravila za štampu - uklanja browser URL i popunjava cijeli A4 list */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important; /* Uklanja browser https:// zaglavlje i datum */
          }
          html, body {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-work-order-wrapper,
          #printable-work-order-wrapper * {
            visibility: visible !important;
          }
          #printable-work-order-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 14mm 16mm 12mm 16mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `
        }}
      />

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden border border-slate-200 print:shadow-none print:border-none print:max-w-none print:max-h-none print:overflow-visible">
        {/* Kontrolna traka iznad dokumenta (skrivena pri štampi) */}
        <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row justify-between items-center gap-3 no-print border-b border-slate-800">
          <div>
            <span className="font-black text-sm block">
              Zvanični Radni Nalog A4 (1 Stranica) • {workOrder.orderNumber}
            </span>
            <span className="text-[11px] text-amber-300 flex items-center gap-1 mt-0.5">
              <Info className="w-3.5 h-3.5" /> U postavkama printanja isključite opciju &quot;Zaglavlja i podnožja&quot; (Headers and footers) da sakrijete link stranice.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" /> Pokreni Štampu
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ZVANIČNI A4 RADNI NALOG (PUN FORMAT A4 LISTA)                              */}
        {/* ========================================================================= */}
        <div
          id="printable-work-order-wrapper"
          className="p-8 sm:p-12 overflow-y-auto flex-1 text-slate-900 bg-white font-sans text-xs print:p-0 print:m-0 print:overflow-visible flex flex-col justify-between"
        >
          <div>
            {/* 1. Zaglavlje / Memorandum firme */}
            <div className="border-b-2 border-slate-900 pb-3 mb-3 flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black tracking-tight uppercase text-blue-900 leading-tight">
                  BINGO d.o.o. Tuzla
                </h1>
                <p className="text-xs font-black text-slate-800 uppercase tracking-wider leading-tight mt-0.5">
                  Služba Transporta & Skladišne Mehanizacije
                </p>
                <p className="text-[10px] text-slate-600 leading-tight mt-0.5">
                  Bosanska Poljana bb, 75000 Tuzla • Bosna i Hercegovina
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block border-2 border-slate-900 bg-slate-100 font-mono text-sm font-black px-3 py-1.5 rounded-lg shadow-2xs">
                  {workOrder.orderNumber}
                </span>
                <p className="text-xs text-slate-700 font-bold mt-1">
                  Datum naloga: <strong>{formattedDate}</strong>
                </p>
                <p className="text-[10px] text-slate-600 font-semibold">
                  Vrsta: <strong>{workOrder.type === "preventive" ? "Preventivni Pregled" : "Intervencija / Kvar"}</strong>
                </p>
              </div>
            </div>

            {/* Naslov Dokumenta */}
            <div className="text-center mb-3">
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wide border-y-2 border-slate-900 py-1.5 bg-slate-100">
                RADNI NALOG ZA PREVENTIVNI PREGLED I SERVIS SKLADIŠNE MEHANIZACIJE
              </h2>
            </div>

            {/* 2. Osnovni Podaci o Mehanizaciji */}
            <div className="mb-3.5">
              <div className="text-[10px] font-black uppercase bg-slate-200 px-3 py-1 border border-slate-400 tracking-wider">
                1. Osnovni Podaci o Jedinici Mehanizacije
              </div>
              <table className="w-full border-collapse border border-slate-400 text-xs">
                <tbody>
                  <tr>
                    <td className="border border-slate-400 p-2 font-bold bg-slate-50 w-1/4">ID Jedinice:</td>
                    <td className="border border-slate-400 p-2 font-black text-blue-900 w-1/4 text-sm">{workOrder.vehicleId || "-"}</td>
                    <td className="border border-slate-400 p-2 font-bold bg-slate-50 w-1/4">Tip Mehanizacije:</td>
                    <td className="border border-slate-400 p-2 font-bold w-1/4">{v.tip || "Viljuškar"}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-2 font-bold bg-slate-50">Proizvođač / Model:</td>
                    <td className="border border-slate-400 p-2 font-semibold">{v.proizvodjac || "-"} {v.model || ""}</td>
                    <td className="border border-slate-400 p-2 font-bold bg-slate-50">Serijski Broj:</td>
                    <td className="border border-slate-400 p-2 font-mono font-bold">{v.serijskiBroj || "-"}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-2 font-bold bg-slate-50">Lokacija / Skladište:</td>
                    <td className="border border-slate-400 p-2 font-semibold">{v.lokacija || "Centralno Skladište"}</td>
                    <td className="border border-slate-400 p-2 font-bold bg-slate-50 text-slate-900">Radni Sati (MTH):</td>
                    <td className="border border-slate-400 p-2 font-black text-blue-900 text-sm">{workOrder.workHours || 0} h</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-2 font-bold bg-slate-50">Serviser / Izvršilac:</td>
                    <td className="border border-slate-400 p-2 font-bold">{workOrder.assignedTo || "Nije navedeno"}</td>
                    <td className="border border-slate-400 p-2 font-bold bg-slate-50">Nalogodavac:</td>
                    <td className="border border-slate-400 p-2 font-semibold">{workOrder.createdBy || "Dispečer"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 3. Kontrolna Ček-Lista (Dvostubični prikaz 4x2) */}
            <div className="mb-3.5">
              <div className="text-[10px] font-black uppercase bg-slate-200 px-3 py-1 border border-slate-400 tracking-wider">
                2. Kontrolna Lista Ispravnosti Sklopova (Ček-Lista Preventivnog Pregleda)
              </div>
              <div className="grid grid-cols-2 gap-3 border border-slate-400 border-t-0 p-2.5 bg-white">
                {/* Lijeva kolona (stavke 1-4) */}
                <table className="w-full border-collapse border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-800">
                      <th className="border border-slate-300 p-1.5 text-left w-7">#</th>
                      <th className="border border-slate-300 p-1.5 text-left">Sklop</th>
                      <th className="border border-slate-300 p-1.5 text-center w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {col1Items.map((item, idx) => {
                      const checkData = checklist[item.key] || { status: "ok" };
                      const isOk = checkData.status === "ok";
                      return (
                        <tr key={item.key} className={!isOk ? "bg-rose-50/70" : ""}>
                          <td className="border border-slate-300 p-1.5 text-center font-bold">{idx + 1}.</td>
                          <td className="border border-slate-300 p-1.5">
                            <strong className="block leading-tight text-slate-900">{item.label}</strong>
                            {checkData.note && (
                              <span className="text-[10px] text-rose-700 font-semibold block leading-tight mt-0.5">
                                Opaska: {checkData.note}
                              </span>
                            )}
                          </td>
                          <td className="border border-slate-300 p-1.5 text-center font-black">
                            {isOk ? (
                              <span className="text-emerald-800">[X] ISPRAVNO</span>
                            ) : (
                              <span className="text-rose-700">[ ! ] DEFEKT</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Desna kolona (stavke 5-8) */}
                <table className="w-full border-collapse border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-800">
                      <th className="border border-slate-300 p-1.5 text-left w-7">#</th>
                      <th className="border border-slate-300 p-1.5 text-left">Sklop</th>
                      <th className="border border-slate-300 p-1.5 text-center w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {col2Items.map((item, idx) => {
                      const checkData = checklist[item.key] || { status: "ok" };
                      const isOk = checkData.status === "ok";
                      return (
                        <tr key={item.key} className={!isOk ? "bg-rose-50/70" : ""}>
                          <td className="border border-slate-300 p-1.5 text-center font-bold">{idx + 5}.</td>
                          <td className="border border-slate-300 p-1.5">
                            <strong className="block leading-tight text-slate-900">{item.label}</strong>
                            {checkData.note && (
                              <span className="text-[10px] text-rose-700 font-semibold block leading-tight mt-0.5">
                                Opaska: {checkData.note}
                              </span>
                            )}
                          </td>
                          <td className="border border-slate-300 p-1.5 text-center font-black">
                            {isOk ? (
                              <span className="text-emerald-800">[X] ISPRAVNO</span>
                            ) : (
                              <span className="text-rose-700">[ ! ] DEFEKT</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Opis Posla & Utrošeni Materijal (Side-by-side u 2 veće kolone) */}
            <div className="grid grid-cols-2 gap-3.5 mb-4">
              <div>
                <div className="text-[10px] font-black uppercase bg-slate-200 px-3 py-1 border border-slate-400 tracking-wider">
                  3. Opis Izvršenih Radova i Otklonjenih Kvarova
                </div>
                <div className="border border-slate-400 border-t-0 p-3 min-h-[105px] max-h-[125px] text-xs leading-relaxed whitespace-pre-wrap overflow-hidden font-medium bg-white">
                  {workOrder.workDescription || "Redovni preventivni pregled jedinice izvršen u cjelosti."}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-black uppercase bg-slate-200 px-3 py-1 border border-slate-400 tracking-wider">
                  4. Utrošeni Rezervni Dijelovi i Potrošni Materijal
                </div>
                <div className="border border-slate-400 border-t-0 p-3 min-h-[105px] max-h-[125px] text-xs leading-relaxed whitespace-pre-wrap overflow-hidden font-medium bg-white">
                  {workOrder.usedMaterials || "Bez utroška rezervnih dijelova."}
                </div>
              </div>
            </div>
          </div>

          {/* 5. Potpisni Blokovi (Stabilno pri dnu A4 stranice) */}
          <div className="pt-5 border-t-2 border-slate-800 grid grid-cols-3 gap-6 text-xs text-center mt-auto">
            <div>
              <div className="border-b-2 border-slate-900 pb-1 mb-1.5 font-bold min-h-[32px] flex items-end justify-center text-sm">
                {workOrder.assignedTo || "Serviser"}
              </div>
              <p className="font-black uppercase text-[10px] text-slate-800">Radove Izvršio / Serviser</p>
              <p className="text-[9px] text-slate-500">Potpis i datum završetka</p>
            </div>

            <div className="flex flex-col items-center justify-end">
              <div className="w-20 h-12 border-2 border-dashed border-slate-400 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400 mb-1">
                M.P.
              </div>
              <p className="font-black uppercase text-[10px] text-slate-800">Pečat Skladišta</p>
            </div>

            <div>
              <div className="border-b-2 border-slate-900 pb-1 mb-1.5 font-bold min-h-[32px] flex items-end justify-center text-sm">
                {workOrder.reviewedBy || ""}
              </div>
              <p className="font-black uppercase text-[10px] text-slate-800">Pregledao i Primio / Rukovodilac</p>
              <p className="text-[9px] text-slate-500">Potpis ovlaštenog lica</p>
            </div>
          </div>

          {/* Fusnota pri samom dnu */}
          <div className="mt-3 pt-1 border-t border-slate-200 text-center text-[9px] text-slate-400">
            Sistem analize transporta i skladišne mehanizacije • Bingo d.o.o. Tuzla • Broj dokumenta: <strong>{workOrder.orderNumber}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
