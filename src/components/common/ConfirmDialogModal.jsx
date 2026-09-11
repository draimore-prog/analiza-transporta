"use client";

import React, { useEffect } from "react";
import { Trash2, AlertTriangle, AlertCircle, Info, CheckCircle2, X } from "lucide-react";

/**
 * Modern In-App Confirmation / Alert Dialog Component
 * Replaces ugly browser native confirm() and alert() popups.
 */
export function ConfirmDialogModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Potvrda radnje",
  message = "Da li ste sigurni da želite nastaviti?",
  itemName = null,
  confirmText = "Potvrdi",
  cancelText = "Odustani",
  variant = "danger", // 'danger' | 'warning' | 'info' | 'success'
  isAlert = false, // if true, single button (U redu)
  isLoading = false
}) {
  // ESC and Enter key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter" && !isLoading) {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onConfirm, isLoading]);

  if (!isOpen) return null;

  // Icon & color theme configuration
  const themes = {
    danger: {
      iconBg: "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50",
      buttonBg: "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 focus:ring-rose-500",
      icon: <Trash2 className="w-6 h-6 animate-pulse" />
    },
    warning: {
      iconBg: "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50",
      buttonBg: "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20 focus:ring-amber-500",
      icon: <AlertTriangle className="w-6 h-6" />
    },
    info: {
      iconBg: "bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-900/50",
      buttonBg: "bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-600/20 focus:ring-sky-500",
      icon: <Info className="w-6 h-6" />
    },
    success: {
      iconBg: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50",
      buttonBg: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 focus:ring-emerald-500",
      icon: <CheckCircle2 className="w-6 h-6" />
    }
  };

  const currentTheme = themes[variant] || themes.danger;
  const displayConfirmText = confirmText || (variant === "danger" ? "Obriši" : "Potvrdi");

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-200 p-6 space-y-4 text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close X button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Zatvori"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Section */}
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl shrink-0 ${currentTheme.iconBg}`}>
            {currentTheme.icon}
          </div>

          <div className="space-y-1.5 flex-1 pr-6">
            <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              {message}
            </p>

            {/* Highlighted item badge if provided */}
            {itemName && (
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 shadow-xs">
                  {variant === "danger" && <Trash2 className="w-3.5 h-3.5 text-rose-500 inline" />}
                  {itemName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800/80">
          {!isAlert && (
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 ${currentTheme.buttonBg}`}
          >
            {isLoading ? "Obrada..." : (isAlert ? (confirmText || "U redu") : displayConfirmText)}
          </button>
        </div>
      </div>
    </div>
  );
}
