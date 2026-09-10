"use client";

import React from "react";
import { X, Printer } from "lucide-react";
import { CHECKLIST_ITEMS, WORK_ORDER_STATUSES } from "@/hooks/useWarehouseWorkOrders.js";

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

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex justify-center items-center z-[9995] p-2 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:h-auto print:overflow-visible animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden border border-slate-200 print:shadow-none print:border-none print:max-w-none print:max-h-none print:overflow-visible">
        {/* Kontrole iznad dokumenta (skrivene pri printu) */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Pregled Štampe A4 • {workOrder.orderNumber}</span>
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
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* A4 Format Stranica za Print */}
        <div className="p-8 sm:p-12 overflow-y-auto flex-1 text-slate-900 bg-white font-sans print:p-6 print:m-0 print:overflow-visible">
          {/* Memorandum i Zaglavlje */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-black tracking-tight uppercase text-blue-900">BINGO d.o.o. Tuzla</span>
              </div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Služba Transporta & Skladišne Mehanizacije
              </p>
              <p className="text-[11px] text-slate-500">Bosanska Poljana bb, 75000 Tuzla • Bosna i Hercegovina</p>
            </div>
            <div className="text-right">
              <span className="inline-block border-2 border-slate-900 bg-slate-100 font-mono text-xs font-black px-3 py-1.5 rounded-lg mb-1">
                {workOrder.orderNumber}
              </span>
              <p className="text-xs text-slate-600 font-semibold">Datum: <strong>{formattedDate}</strong></p>
              <p className="text-[11px] text-slate-500">
                Tip: <strong>{workOrder.type === "preventive" ? "Preventivni Pregled" : "Servisna Intervencija"}</strong>
              </p>
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-base sm:text-lg font-black uppercase tracking-wide border-y border-slate-300 py-2">
              RADNI NALOG ZA PREVENTIVNI PREGLED I SERVIS SKLADIŠNE MEHANIZACIJE
            </h1>
          </div>

          {/* Osnovni Podaci o Mehanizaciji */}
          <div className="mb-6">
            <h3 className="text-xs font-black uppercase bg-slate-100 p-2 border border-slate-300 tracking-wider mb-0">
              1. Osnovni Podaci o Jedinici Mehanizacije
            </h3>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2 font-bold bg-slate-50 w-1/4">ID Jedinice:</td>
                  <td className="border border-slate-300 p-2 font-black w-1/4 text-blue-900">{workOrder.vehicleId || "-"}</td>
                  <td className="border border-slate-300 p-2 font-bold bg-slate-50 w-1/4">Tip Mehanizacije:</td>
                  <td className="border border-slate-300 p-2 font-semibold w-1/4">{v.tip || "Viljuškar"}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 font-bold bg-slate-50">Proizvođač / Model:</td>
                  <td className="border border-slate-300 p-2 font-semibold">{v.proizvodjac || "-"} {v.model || ""}</td>
                  <td className="border border-slate-300 p-2 font-bold bg-slate-50">Serijski Broj:</td>
                  <td className="border border-slate-300 p-2 font-mono">{v.serijskiBroj || "-"}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 font-bold bg-slate-50">Lokacija / Skladište:</td>
                  <td className="border border-slate-300 p-2 font-semibold">{v.lokacija || "Centralno Skladište"}</td>
                  <td className="border border-slate-300 p-2 font-bold bg-slate-50 text-slate-900">Radni Sati (MTH):</td>
                  <td className="border border-slate-300 p-2 font-black text-blue-900">{workOrder.workHours || 0} h</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 font-bold bg-slate-50">Serviser / Izvršilac:</td>
                  <td className="border border-slate-300 p-2 font-bold">{workOrder.assignedTo || "Nije navedeno"}</td>
                  <td className="border border-slate-300 p-2 font-bold bg-slate-50">Nalogodavac:</td>
                  <td className="border border-slate-300 p-2 font-semibold">{workOrder.createdBy || "Dispečer"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Kontrolna Ček-Lista (8 Sklopova) */}
          <div className="mb-6">
            <h3 className="text-xs font-black uppercase bg-slate-100 p-2 border border-slate-300 tracking-wider mb-0">
              2. Kontrolna Lista Ispravnosti Sklopova (Ček-Lista)
            </h3>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-50 font-black text-slate-700">
                  <th className="border border-slate-300 p-2 text-left w-12">R.br.</th>
                  <th className="border border-slate-300 p-2 text-left">Sklop / Kontrolna Tačka</th>
                  <th className="border border-slate-300 p-2 text-center w-24">Status</th>
                  <th className="border border-slate-300 p-2 text-left">Uočeno Stanje / Napomena</th>
                </tr>
              </thead>
              <tbody>
                {CHECKLIST_ITEMS.map((item, idx) => {
                  const checkData = checklist[item.key] || { status: "ok" };
                  const isOk = checkData.status === "ok";

                  return (
                    <tr key={item.key} className={!isOk ? "bg-rose-50/50" : ""}>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">{idx + 1}.</td>
                      <td className="border border-slate-300 p-1.5 font-bold">{item.label}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-black">
                        {isOk ? (
                          <span className="text-emerald-700">[X] ISPRAVNO</span>
                        ) : (
                          <span className="text-rose-700">[ ! ] NEISPRAVNO</span>
                        )}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-[11px] text-slate-700">
                        {checkData.note || (isOk ? "Uredno, bez vidljivih oštećenja" : "-")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Opis Radova & Utrošeni Materijal */}
          <div className="mb-6 space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase bg-slate-100 p-2 border border-slate-300 tracking-wider mb-0">
                3. Opis Izvršenih Radova i Otklonjenih Kvarova
              </h3>
              <div className="border border-slate-300 p-3 min-h-[70px] text-xs font-medium leading-relaxed whitespace-pre-wrap">
                {workOrder.workDescription || "Redovni preventivni pregled jedinice izvršen u cjelosti."}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase bg-slate-100 p-2 border border-slate-300 tracking-wider mb-0">
                4. Utrošeni Rezervni Dijelovi i Potrošni Materijal
              </h3>
              <div className="border border-slate-300 p-3 min-h-[50px] text-xs font-medium leading-relaxed whitespace-pre-wrap">
                {workOrder.usedMaterials || "Bez utroška rezervnih dijelova."}
              </div>
            </div>
          </div>

          {/* Potpisni Blokovi */}
          <div className="pt-8 border-t-2 border-slate-300 grid grid-cols-2 gap-12 text-xs">
            <div className="text-center">
              <div className="border-b border-slate-900 pb-1 mb-2 font-bold min-h-[30px] flex items-end justify-center">
                {workOrder.assignedTo || "Serviser"}
              </div>
              <p className="font-extrabold uppercase text-[11px]">Radove Izvršio / Serviser</p>
              <p className="text-[10px] text-slate-500 mt-1">Potpis i datum završetka</p>
            </div>

            <div className="text-center">
              <div className="border-b border-slate-900 pb-1 mb-2 font-bold min-h-[30px] flex items-end justify-center">
                {workOrder.reviewedBy || ""}
              </div>
              <p className="font-extrabold uppercase text-[11px]">Pregledao i Primio / Rukovodilac</p>
              <p className="text-[10px] text-slate-500 mt-1">Potpis ovlaštenog lica i pečat</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
