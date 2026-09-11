"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { ConfirmDialogModal } from "@/components/common/ConfirmDialogModal.jsx";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialogConfig, setDialogConfig] = useState(null);
  const resolveRef = useRef(null);

  const closeDialog = useCallback((result) => {
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
    setDialogConfig(null);
  }, []);

  /**
   * General in-app confirmation dialog
   * @param {Object} options
   * @param {string} options.title - Dialog title
   * @param {string} options.message - Dialog message
   * @param {string} [options.itemName] - Optional item name or ID to highlight
   * @param {string} [options.confirmText] - Label for confirm button
   * @param {string} [options.cancelText] - Label for cancel button
   * @param {'danger'|'warning'|'info'|'success'} [options.variant] - Visual theme
   * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled
   */
  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialogConfig({
        title: options.title || "Potvrda radnje",
        message: options.message || "Da li ste sigurni da želite nastaviti?",
        itemName: options.itemName || null,
        confirmText: options.confirmText || (options.variant === "warning" ? "Nastavi" : (options.variant === "info" ? "U redu" : "Obriši")),
        cancelText: options.cancelText || "Odustani",
        variant: options.variant || "danger",
        isAlert: false
      });
    });
  }, []);

  /**
   * Specialized deletion confirmation dialog
   * Tailored for "Da li želite obrisati..."
   * @param {Object} options
   * @param {string} options.itemName - Name/Code of item to delete (e.g. registration plate, user name, order number)
   * @param {string} [options.itemType] - Type description (e.g. "vozilo", "radni nalog", "mašinu", "korisnika")
   * @param {string} [options.message] - Custom message if needed
   * @param {string} [options.title] - Custom title
   * @returns {Promise<boolean>}
   */
  const confirmDelete = useCallback((options) => {
    const itemType = options.itemType || "stavku";
    const itemName = options.itemName || "";
    const title = options.title || "Potvrda brisanja";
    const message =
      options.message ||
      (itemName
        ? `Da li ste sigurni da želite TRAJNO obrisati ${itemType} "${itemName}" iz baze podataka? Ova radnja se ne može poništiti.`
        : `Da li ste sigurni da želite TRAJNO obrisati ovu ${itemType}?`);

    return confirm({
      title,
      message,
      itemName,
      confirmText: "Obriši",
      cancelText: "Odustani",
      variant: "danger"
    });
  }, [confirm]);

  /**
   * In-app alert notification dialog (single button)
   * Replaces browser native window.alert()
   * @param {Object|string} options
   * @returns {Promise<void>}
   */
  const showAlert = useCallback((options) => {
    const opts = typeof options === "string" ? { message: options } : options;
    return new Promise((resolve) => {
      resolveRef.current = () => resolve();
      setDialogConfig({
        title: opts.title || (opts.variant === "danger" ? "Greška" : "Obavještenje"),
        message: opts.message || "",
        confirmText: opts.buttonText || "U redu",
        variant: opts.variant || "info",
        isAlert: true
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider
      value={{
        confirm,
        confirmDelete,
        alert: showAlert
      }}
    >
      {children}

      {dialogConfig && (
        <ConfirmDialogModal
          isOpen={true}
          onClose={() => closeDialog(false)}
          onConfirm={() => closeDialog(true)}
          title={dialogConfig.title}
          message={dialogConfig.message}
          itemName={dialogConfig.itemName}
          confirmText={dialogConfig.confirmText}
          cancelText={dialogConfig.cancelText}
          variant={dialogConfig.variant}
          isAlert={dialogConfig.isAlert}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    // Fallback if used outside provider (uses native confirm as emergency safety fallback)
    return {
      confirm: async ({ message }) => window.confirm(message || "Potvrda?"),
      confirmDelete: async ({ message, itemName }) =>
        window.confirm(message || `Da li ste sigurni da želite obrisati ${itemName || ""}?`),
      alert: async (opts) => window.alert(typeof opts === "string" ? opts : opts.message)
    };
  }
  return context;
}
