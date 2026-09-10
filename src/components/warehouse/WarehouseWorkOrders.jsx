"use client";

import React, { useState, useMemo } from "react";
import {
  ClipboardList,
  PlusCircle,
  Search,
  Filter,
  Eye,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  ShieldCheck,
  Camera,
  Trash2,
  Sparkles,
  Check
} from "lucide-react";
import { WORK_ORDER_STATUSES } from "@/hooks/useWarehouseWorkOrders.js";

export function WarehouseWorkOrders({
  workOrders = [],
  isLoading = false,
  onCreateOrderClick,
  onViewOrder,
  onPrintOrder,
  onApproveOrder,
  onDeleteOrder,
  onSeedDemoOrder
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // KPI metrike
  const kpis = useMemo(() => {
    const total = workOrders.length;
    const pendingReview = workOrders.filter((o) => o.status === "completed").length;
    const activeAssigned = workOrders.filter((o) => o.status === "pending" || o.status === "in_progress").length;
    const approved = workOrders.filter((o) => o.status === "approved").length;

    return { total, pendingReview, activeAssigned, approved };
  }, [workOrders]);

  // Filtrirani radni nalozi
  const filteredOrders = useMemo(() => {
    return workOrders.filter((o) => {
      // Filter statusa
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      // Filter tipa (preventivni ili kvar)
      if (typeFilter !== "all" && o.type !== typeFilter) return false;

      // Pretraga po terminu
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();

      const num = (o.orderNumber || "").toLowerCase();
      const vId = (o.vehicleId || "").toLowerCase();
      const srv = (o.assignedTo || "").toLowerCase();
      const lok = (o.vehicleDetails?.lokacija || "").toLowerCase();
      const model = (o.vehicleDetails?.model || "").toLowerCase();
      const desc = (o.workDescription || "").toLowerCase();

      return (
        num.includes(term) ||
        vId.includes(term) ||
        srv.includes(term) ||
        lok.includes(term) ||
        model.includes(term) ||
        desc.includes(term)
      );
    });
  }, [workOrders, statusFilter, typeFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Gornja traka: Naslov i Dugme za Kreiranje */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 rounded-xl">
              <ClipboardList className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Radni Nalozi & Preventivni Pregledi Mehanizacije
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Evidencija i kontrola redovnih preventivnih pregleda, terenskih servisa i radnih sati viljuškara (594 jedinice)
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {workOrders.length === 0 && (
            <button
              onClick={onSeedDemoOrder}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Kreiraj ogledni primjer naloga sa 5 fotografija i ček-listom"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Generiši Primjer Naloga</span>
            </button>
          )}

          <button
            onClick={onCreateOrderClick}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novi Radni Nalog</span>
          </button>
        </div>
      </div>

      {/* KPI Kartice */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ukupno Naloga */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Ukupno Naloga</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{kpis.total}</span>
            <span className="text-xs text-slate-400 font-bold">Arhiva</span>
          </div>
        </div>

        {/* Čeka na Pregled (Completed) */}
        <div
          onClick={() => setStatusFilter("completed")}
          className={`p-5 rounded-2xl border shadow-sm cursor-pointer transition-all ${
            kpis.pendingReview > 0
              ? "bg-purple-50/80 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800 hover:shadow-md"
              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300">
              Čeka Pregled Voditelja
            </span>
            {kpis.pendingReview > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping" />
            )}
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-700 dark:text-purple-300">{kpis.pendingReview}</span>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Za verifikaciju</span>
          </div>
        </div>

        {/* Zadano / U Toku */}
        <div
          onClick={() => setStatusFilter("pending")}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-amber-400 transition-all"
        >
          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block mb-1">
            Zadano / U Toku
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{kpis.activeAssigned}</span>
            <span className="text-xs text-slate-400 font-bold">Na terenu</span>
          </div>
        </div>

        {/* Odobreno */}
        <div
          onClick={() => setStatusFilter("approved")}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-emerald-400 transition-all"
        >
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
            Pregledano & Odobreno
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{kpis.approved}</span>
            <span className="text-xs text-slate-400 font-bold">Završeno</span>
          </div>
        </div>
      </div>

      {/* Filteri i Pretraga */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Pretraga */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pretraži po broju naloga, ID mašine, lokaciji..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Filteri po statusu */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "all"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            Svi Statusi ({workOrders.length})
          </button>
          <button
            onClick={() => setStatusFilter("completed")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "completed"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
            }`}
          >
            Čeka Pregled ({kpis.pendingReview})
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "pending"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
            }`}
          >
            Zadano ({kpis.activeAssigned})
          </button>
          <button
            onClick={() => setStatusFilter("approved")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "approved"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
            }`}
          >
            Odobreno ({kpis.approved})
          </button>
        </div>
      </div>

      {/* Tabela / Lista Radnih Naloga */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Nema pronađenih radnih naloga</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Nijedan radni nalog ne odgovara odabranim kriterijima pretrage ili još uvijek nije kreiran nalog u sistemu.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-3.5 pl-5">Broj Naloga & Datum</th>
                  <th className="p-3.5">Mehanizacija (ID / Model)</th>
                  <th className="p-3.5">Lokacija (PJ)</th>
                  <th className="p-3.5">Serviser / Izvršilac</th>
                  <th className="p-3.5 text-center">Radni Sati</th>
                  <th className="p-3.5 text-center">Ček-Lista</th>
                  <th className="p-3.5 text-center">Slike</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 pr-5 text-right">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-200 font-medium">
                {filteredOrders.map((order) => {
                  const statusConf = WORK_ORDER_STATUSES[order.status] || WORK_ORDER_STATUSES.pending;
                  const v = order.vehicleDetails || {};
                  const checklist = order.checklist || {};
                  const checkKeys = Object.keys(checklist);
                  const issueCount = checkKeys.filter((k) => checklist[k]?.status === "issue").length;
                  const photoCount = Object.keys(order.photos || {}).filter((k) => order.photos[k]).length;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                    >
                      {/* Broj Naloga & Datum */}
                      <td className="p-3.5 pl-5">
                        <span className="font-mono font-black text-slate-900 dark:text-white block">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString("bs-BA", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric"
                              })
                            : "-"}
                        </span>
                      </td>

                      {/* Mehanizacija */}
                      <td className="p-3.5">
                        <span className="font-black text-blue-700 dark:text-blue-400 block font-mono">
                          {order.vehicleId}
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 block truncate max-w-[200px]">
                          {v.proizvodjac} {v.model} ({v.tip || "Viljuškar"})
                        </span>
                      </td>

                      {/* Lokacija */}
                      <td className="p-3.5">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[160px]">
                          {v.lokacija || "Centralno skladište"}
                        </span>
                      </td>

                      {/* Serviser */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {order.assignedTo || "Nije dodijeljeno"}
                          </span>
                        </div>
                      </td>

                      {/* Radni Sati */}
                      <td className="p-3.5 text-center font-bold font-mono text-amber-600 dark:text-amber-400">
                        {order.workHours ? `${order.workHours} h` : "-"}
                      </td>

                      {/* Ček-Lista */}
                      <td className="p-3.5 text-center">
                        {checkKeys.length > 0 ? (
                          issueCount === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 8/8 OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> {issueCount} Defekt
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Čeka pregled</span>
                        )}
                      </td>

                      {/* Slike */}
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          <Camera className="w-3.5 h-3.5 text-indigo-500" />
                          {photoCount}/5
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${statusConf.color}`}
                        >
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Akcije */}
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewOrder(order)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                            title="Detaljan pregled naloga"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onPrintOrder(order)}
                            className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                            title="Štampaj A4 radni nalog"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {order.status === "completed" && (
                            <button
                              onClick={() => onApproveOrder(order.id)}
                              className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors cursor-pointer"
                              title="Odobri radni nalog"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`Sigurno želite obrisati radni nalog ${order.orderNumber}?`)) {
                                onDeleteOrder(order.id);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                            title="Obriši radni nalog"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
