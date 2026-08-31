"use client";

import React from "react";
import { X, Download, ExternalLink, FileText, Image as ImageIcon } from "lucide-react";

export function InvoicePreviewModal({
  isOpen,
  onClose,
  invoice
}) {
  if (!isOpen || !invoice || !invoice.url) return null;

  const isPdf = invoice.type?.includes("pdf") || invoice.url.startsWith("data:application/pdf") || invoice.url.toLowerCase().includes(".pdf");

  return (
    <div onClick={onClose} className="fixed inset-0 bg-slate-950/85 flex justify-center items-center z-[100] backdrop-blur-sm p-3 sm:p-5 animate-in fade-in duration-150 cursor-pointer">
      <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 cursor-default">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30 shrink-0">
              {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div className="overflow-hidden">
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                {invoice.name || "Priloženi Račun / Dokument"}
              </h3>
              <p className="text-[11px] text-slate-300">
                {invoice.reg ? `Vozilo: ${invoice.reg}` : "Servisni Nalog"} {invoice.datum ? `• Datum: ${invoice.datum}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={invoice.url}
              download={invoice.name || "racun"}
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Preuzmi ili Otvori u novom tabu"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Otvori</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Prikaz Dokumenta */}
        <div className="flex-1 min-h-0 bg-slate-950 flex items-center justify-center p-2 sm:p-4 overflow-auto">
          {isPdf ? (
            <iframe
              src={invoice.url}
              title={invoice.name || "Račun"}
              className="w-full h-full rounded-xl border border-slate-800 bg-white"
            />
          ) : (
            <img
              src={invoice.url}
              alt={invoice.name || "Račun"}
              className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
            />
          )}
        </div>
      </div>
    </div>
  );
}
