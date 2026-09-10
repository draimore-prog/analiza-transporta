"use client";

import React, { useState } from "react";
import {
  X,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Wrench,
  Package,
  Calendar,
  Eye,
  Camera,
  Check,
  Edit3,
  Save,
  ShieldCheck
} from "lucide-react";
import { WORK_ORDER_STATUSES, CHECKLIST_ITEMS } from "@/hooks/useWarehouseWorkOrders.js";

const PHOTO_SLOTS = [
  { key: "front", label: "1. Pogled Naprijed" },
  { key: "back", label: "2. Pogled Nazad" },
  { key: "left", label: "3. Lijeva Strana" },
  { key: "right", label: "4. Desna Strana" },
  { key: "interior", label: "5. Tabla / Unutrašnjost" }
];

export function WorkOrderDetailModal({
  isOpen,
  onClose,
  workOrder,
  onPrint,
  onUpdateOrder,
  onApproveOrder,
  activeUser
}) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState("");
  const [editMaterials, setEditMaterials] = useState("");
  const [editHours, setEditHours] = useState("");
  const [editNotes, setEditNotes] = useState("");

  if (!isOpen || !workOrder) return null;

  const startEdit = () => {
    setEditDesc(workOrder.workDescription || "");
    setEditMaterials(workOrder.usedMaterials || "");
    setEditHours(workOrder.workHours || 0);
    setEditNotes(workOrder.notes || "");
    setIsEditing(true);
  };

  const saveEdit = async () => {
    if (onUpdateOrder) {
      await onUpdateOrder(workOrder.id, {
        workDescription: editDesc,
        usedMaterials: editMaterials,
        workHours: Number(editHours) || 0,
        notes: editNotes
      });
    }
    setIsEditing(false);
  };

  const statusConfig = WORK_ORDER_STATUSES[workOrder.status] || WORK_ORDER_STATUSES.pending;
  const photos = workOrder.photos || {};
  const checklist = workOrder.checklist || {};
  const v = workOrder.vehicleDetails || {};

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex justify-center items-center z-[9990] p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 flex justify-between items-start border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <span className="font-mono text-xs font-black tracking-widest text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-800/80">
                {workOrder.orderNumber}
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusConfig.color}`}
              >
                {statusConfig.label}
              </span>
              {workOrder.type === "preventive" ? (
                <span className="text-[11px] font-bold bg-blue-900/60 text-blue-200 border border-blue-700 px-2 py-0.5 rounded-full">
                  🛡️ Preventivni pregled
                </span>
              ) : (
                <span className="text-[11px] font-bold bg-rose-900/60 text-rose-200 border border-rose-700 px-2 py-0.5 rounded-full">
                  ⚠️ Kvar / Intervencija
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{workOrder.vehicleId}</span>
              <span className="text-slate-400 font-normal text-base sm:text-lg">
                • {v.proizvodjac || ""} {v.model || ""}
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {workOrder.createdAt ? new Date(workOrder.createdAt).toLocaleDateString("bs-BA", { dateStyle: "medium" }) : "-"}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> Serviser:{" "}
                <strong className="text-white">{workOrder.assignedTo || "Nije dodijeljeno"}</strong>
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Radni sati: {workOrder.workHours || 0} MTH
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrint && onPrint(workOrder)}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Štampaj radni nalog"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Štampaj A4</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-slate-800 dark:text-slate-200">
          {/* Generalije Mehanizacije */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Tip Mehanizacije</span>
              <span className="font-extrabold text-slate-900 dark:text-white">{v.tip || "Viljuškar"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Serijski Broj</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{v.serijskiBroj || "-"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Lokacija / PJ</span>
              <span className="font-extrabold text-slate-900 dark:text-white">{v.lokacija || "Centralno skladište"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Kreirao / Nalogodavac</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{workOrder.createdBy || "Dispečer"}</span>
            </div>
          </div>

          {/* Kontrolna Ček-Lista (8 ključnih sklopova) */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Kontrolna Lista Preventivnog Pregleda (8 Sklopova)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CHECKLIST_ITEMS.map((item) => {
                const checkData = checklist[item.key] || { status: "ok" };
                const isOk = checkData.status === "ok";

                return (
                  <div
                    key={item.key}
                    className={`p-3 rounded-xl border flex items-start justify-between gap-2 transition-all ${
                      isOk
                        ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50"
                        : "bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {isOk ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        )}
                        <span className="text-xs font-black text-slate-900 dark:text-white">{item.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 ml-6">
                        {item.description}
                      </p>
                      {checkData.note && (
                        <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 mt-1 ml-6 bg-rose-100/70 dark:bg-rose-900/40 p-1.5 rounded-lg">
                          Napomena: {checkData.note}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                        isOk
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200"
                      }`}
                    >
                      {isOk ? "Ispravno" : "Defekt"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Opis Posla & Utrošeni Materijal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opis Posla */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-blue-600" />
                  Opis Izvršenih Radova
                </h4>
                {!isEditing && (
                  <button
                    onClick={startEdit}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" /> Uredi
                  </button>
                )}
              </div>
              {isEditing ? (
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                  {workOrder.workDescription || "Nema unesenog opisa radova."}
                </p>
              )}
            </div>

            {/* Utrošeni Materijal */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-amber-600" />
                  Utrošeni Materijal i Dijelovi
                </h4>
              </div>
              {isEditing ? (
                <textarea
                  value={editMaterials}
                  onChange={(e) => setEditMaterials(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white font-medium outline-none focus:ring-2 focus:ring-amber-500"
                />
              ) : (
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                  {workOrder.usedMaterials || "Nema evidentiranog utroška materijala."}
                </p>
              )}
            </div>
          </div>

          {/* Izmjena radnih sati i napomene ako je u edit modu */}
          {isEditing && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Radni sati (MTH):
                </label>
                <input
                  type="number"
                  value={editHours}
                  onChange={(e) => setEditHours(e.target.value)}
                  className="w-28 text-xs p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Odustani
                </button>
                <button
                  onClick={saveEdit}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Sačuvaj Izmjene
                </button>
              </div>
            </div>
          )}

          {/* Foto Dokumentacija (5 Obaveznih Slika) */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Foto Dokumentacija Sa Terena (5 Pozicija)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {PHOTO_SLOTS.map((slot) => {
                const imgUrl = photos[slot.key];

                return (
                  <div
                    key={slot.key}
                    className="group relative bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center min-h-[140px] shadow-xs"
                  >
                    {imgUrl ? (
                      <>
                        <img
                          src={imgUrl}
                          alt={slot.label}
                          className="w-full h-28 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-200"
                          onClick={() => setSelectedPhoto({ url: imgUrl, title: slot.label })}
                        />
                        <div
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                          onClick={() => setSelectedPhoto({ url: imgUrl, title: slot.label })}
                        >
                          <Eye className="w-6 h-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-3 text-slate-400 dark:text-slate-500 text-center">
                        <Camera className="w-6 h-6 mb-1 opacity-50" />
                        <span className="text-[10px] font-bold">Nema fotografije</span>
                      </div>
                    )}
                    <span className="w-full text-center text-[10px] font-extrabold uppercase py-1 bg-slate-200 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 truncate px-1">
                      {slot.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-850 p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center gap-2 flex-wrap">
          <div>
            {workOrder.reviewedBy && (
              <p className="text-xs text-slate-500 font-medium">
                Pregledao: <strong className="text-slate-800 dark:text-slate-200">{workOrder.reviewedBy}</strong> (
                {new Date(workOrder.reviewedAt).toLocaleDateString("bs-BA")})
              </p>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {workOrder.status !== "approved" && (
              <button
                onClick={() => {
                  if (onApproveOrder) onApproveOrder(workOrder.id);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" /> Označi kao Odobreno
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Zatvori
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox uvećanje fotografije */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-[9999] flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] flex flex-col items-center">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-rose-400 p-2 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.title}
              className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl object-contain border border-slate-700"
            />
            <p className="text-white font-bold text-sm mt-3">{selectedPhoto.title}</p>
          </div>
        </div>
      )}
    </div>
  );
}
