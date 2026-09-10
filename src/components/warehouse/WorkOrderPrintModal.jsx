"use client";

import React from "react";
import { X, Printer } from "lucide-react";
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

  // Razdvajanje 8 sklopova u 2 kolone po 4 stavke radi uštede vertikalnog prostora
  const col1Items = CHECKLIST_ITEMS.slice(0, 4);
  const col2Items = CHECKLIST_ITEMS.slice(4, 8);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex justify-center items-center z-[9995] p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:h-auto print:overflow-visible animate-in fade-in">
      {/* CSS pravila za štampu - sakriva sve osim radnog naloga i garantuje 1 A4 stranicu */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
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
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            display: block !important;
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
        <div className="bg-slate-900 text-white p-3.5 flex justify-between items-center no-print">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs sm:text-sm">
              Pregled Štampe (A4 • 1 Stranica) • {workOrder.orderNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" /> Pokreni Štampu
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ZVANIČNI A4 RADNI NALOG (TAČNO 1 STRANICA)                                  */}
        {/* ========================================================================= */}
        <div
          id="printable-work-order-wrapper"
          className="p-6 sm:p-8 overflow-y-auto flex-1 text-slate-900 bg-white font-sans text-xs print:p-0 print:m-0 print:overflow-visible"
        >
          {/* 1. Zaglavlje / Memorandum firme */}
          <div className="border-b-2 border-slate-900 pb-2.5 mb-3 flex justify-between items-start">
            <div>
              <h1 className="text-base font-black tracking-tight uppercase text-blue-900 leading-tight">
                BINGO d.o.o. Tuzla
              </h1>
              <p className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider leading-tight">
                Služba Transporta & Skladišne Mehanizacije
              </p>
              <p className="text-[9px] text-slate-500 leading-tight">
                Bosanska Poljana bb, 75000 Tuzla • Bosna i Hercegovina
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block border border-slate-900 bg-slate-100 font-mono text-xs font-black px-2.5 py-1 rounded">
                {workOrder.orderNumber}
              </span>
              <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
                Datum naloga: <strong>{formattedDate}</strong>
              </p>
              <p className="text-[9px] text-slate-500">
                Vrsta: <strong>{workOrder.type === "preventive" ? "Preventivni Pregled" : "Intervencija / Kvar"}</strong>
              </p>
            </div>
          </div>

          {/* Naslov Dokumenta */}
          <div className="text-center mb-3">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wide border-y border-slate-400 py-1 bg-slate-50">
              RADNI NALOG ZA PREVENTIVNI PREGLED I SERVIS SKLADIŠNE MEHANIZACIJE
            </h2>
          </div>

          {/* 2. Osnovni Podaci o Mehanizaciji (Kompaktna tabela) */}
          <div className="mb-3">
            <div className="text-[9px] font-black uppercase bg-slate-200 px-2 py-0.5 border border-slate-400 tracking-wider">
              1. Osnovni Podaci o Jedinici Mehanizacije
            </div>
            <table className="w-full border-collapse border border-slate-400 text-[10px]">
              <tbody>
                <tr>
                  <td className="border border-slate-400 p-1.5 font-bold bg-slate-50 w-1/4">ID Jedinice:</td>
                  <td className="border border-slate-400 p-1.5 font-black text-blue-900 w-1/4">{workOrder.vehicleId || "-"}</td>
                  <td className="border border-slate-400 p-1.5 font-bold bg-slate-50 w-1/4">Tip Mehanizacije:</td>
                  <td className="border border-slate-400 p-1.5 font-semibold w-1/4">{v.tip || "Viljuškar"}</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-1.5 font-bold bg-slate-50">Proizvođač / Model:</td>
                  <td className="border border-slate-400 p-1.5 font-semibold">{v.proizvodjac || "-"} {v.model || ""}</td>
                  <td className="border border-slate-400 p-1.5 font-bold bg-slate-50">Serijski Broj:</td>
                  <td className="border border-slate-400 p-1.5 font-mono">{v.serijskiBroj || "-"}</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-1.5 font-bold bg-slate-50">Lokacija / Skladište:</td>
                  <td className="border border-slate-400 p-1.5 font-semibold">{v.lokacija || "Centralno Skladište"}</td>
                  <td className="border border-slate-400 p-1.5 font-bold bg-slate-50 text-slate-900">Radni Sati (MTH):</td>
                  <td className="border border-slate-400 p-1.5 font-black text-blue-900">{workOrder.workHours || 0} h</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-1.5 font-bold bg-slate-50">Serviser / Izvršilac:</td>
                  <td className="border border-slate-400 p-1.5 font-bold">{workOrder.assignedTo || "Nije navedeno"}</td>
                  <td className="border border-slate-400 p-1.5 font-bold bg-slate-50">Nalogodavac:</td>
                  <td className="border border-slate-400 p-1.5 font-semibold">{workOrder.createdBy || "Dispečer"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3. Kontrolna Ček-Lista (Dvostubični prikaz 4x2 radi kompaktnosti na 1 A4 strani) */}
          <div className="mb-3">
            <div className="text-[9px] font-black uppercase bg-slate-200 px-2 py-0.5 border border-slate-400 tracking-wider">
              2. Kontrolna Lista Ispravnosti Sklopova (Ček-Lista Preventivnog Pregleda)
            </div>
            <div className="grid grid-cols-2 gap-2 border border-slate-400 border-t-0 p-2">
              {/* Lijeva kolona (stavke 1-4) */}
              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 font-extrabold text-slate-700">
                    <th className="border border-slate-300 p-1 text-left w-6">#</th>
                    <th className="border border-slate-300 p-1 text-left">Sklop</th>
                    <th className="border border-slate-300 p-1 text-center w-20">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {col1Items.map((item, idx) => {
                    const checkData = checklist[item.key] || { status: "ok" };
                    const isOk = checkData.status === "ok";
                    return (
                      <tr key={item.key} className={!isOk ? "bg-rose-50" : ""}>
                        <td className="border border-slate-300 p-1 text-center font-bold">{idx + 1}.</td>
                        <td className="border border-slate-300 p-1">
                          <strong className="block leading-tight">{item.label}</strong>
                          {checkData.note && (
                            <span className="text-[9px] text-rose-700 font-semibold block leading-tight mt-0.5">
                              Opaska: {checkData.note}
                            </span>
                          )}
                        </td>
                        <td className="border border-slate-300 p-1 text-center font-black">
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
              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 font-extrabold text-slate-700">
                    <th className="border border-slate-300 p-1 text-left w-6">#</th>
                    <th className="border border-slate-300 p-1 text-left">Sklop</th>
                    <th className="border border-slate-300 p-1 text-center w-20">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {col2Items.map((item, idx) => {
                    const checkData = checklist[item.key] || { status: "ok" };
                    const isOk = checkData.status === "ok";
                    return (
                      <tr key={item.key} className={!isOk ? "bg-rose-50" : ""}>
                        <td className="border border-slate-300 p-1 text-center font-bold">{idx + 5}.</td>
                        <td className="border border-slate-300 p-1">
                          <strong className="block leading-tight">{item.label}</strong>
                          {checkData.note && (
                            <span className="text-[9px] text-rose-700 font-semibold block leading-tight mt-0.5">
                              Opaska: {checkData.note}
                            </span>
                          )}
                        </td>
                        <td className="border border-slate-300 p-1 text-center font-black">
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

          {/* 4. Opis Posla & Utrošeni Materijal (Side-by-side u 2 kolone) */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <div className="text-[9px] font-black uppercase bg-slate-200 px-2 py-0.5 border border-slate-400 tracking-wider">
                3. Opis Izvršenih Radova i Otklonjenih Kvarova
              </div>
              <div className="border border-slate-400 border-t-0 p-2 min-h-[65px] max-h-[85px] text-[10px] leading-snug whitespace-pre-wrap overflow-hidden">
                {workOrder.workDescription || "Redovni preventivni pregled jedinice izvršen u cjelosti."}
              </div>
            </div>

            <div>
              <div className="text-[9px] font-black uppercase bg-slate-200 px-2 py-0.5 border border-slate-400 tracking-wider">
                4. Utrošeni Rezervni Dijelovi i Potrošni Materijal
              </div>
              <div className="border border-slate-400 border-t-0 p-2 min-h-[65px] max-h-[85px] text-[10px] leading-snug whitespace-pre-wrap overflow-hidden">
                {workOrder.usedMaterials || "Bez utroška rezervnih dijelova."}
              </div>
            </div>
          </div>

          {/* 5. Potpisni Blokovi (Kompaktno pri dnu) */}
          <div className="pt-4 border-t-2 border-slate-400 grid grid-cols-3 gap-6 text-[10px] text-center">
            <div>
              <div className="border-b border-slate-900 pb-1 mb-1 font-bold min-h-[26px] flex items-end justify-center">
                {workOrder.assignedTo || "Serviser"}
              </div>
              <p className="font-extrabold uppercase text-[9px]">Radove Izvršio / Serviser</p>
              <p className="text-[8px] text-slate-500">Potpis i datum završetka</p>
            </div>

            <div className="flex flex-col items-center justify-end">
              <div className="w-16 h-10 border border-dashed border-slate-400 rounded flex items-center justify-center text-[8px] text-slate-400 mb-1">
                M.P.
              </div>
              <p className="font-extrabold uppercase text-[9px]">Pečat Skladišta</p>
            </div>

            <div>
              <div className="border-b border-slate-900 pb-1 mb-1 font-bold min-h-[26px] flex items-end justify-center">
                {workOrder.reviewedBy || ""}
              </div>
              <p className="font-extrabold uppercase text-[9px]">Pregledao i Primio / Rukovodilac</p>
              <p className="text-[8px] text-slate-500">Potpis ovlaštenog lica</p>
            </div>
          </div>

          {/* Footer fusnota */}
          <div className="mt-3 pt-1 border-t border-slate-200 text-center text-[8px] text-slate-400">
            Sistem analize transporta i skladišne mehanizacije • Bingo d.o.o. Tuzla • Dok. ID: {workOrder.orderNumber}
          </div>
        </div>
      </div>
    </div>
  );
}
