"use client";

import React, { useState } from "react";
import { X, Key } from "lucide-react";

export function ChangePasswordModal({
  isOpen,
  onClose,
  user,
  onSaveUser
}) {
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      alert("Molimo unesite novu lozinku!");
      return;
    }

    setIsSaving(true);
    try {
      await onSaveUser({
        ...user,
        password: newPassword.trim()
      });
      alert(`Lozinka za nalog "${user.username}" je uspješno izmijenjena!`);
      setNewPassword("");
      onClose();
    } catch (err) {
      alert("Greška: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 flex justify-center items-center z-[80] backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 dark:border-slate-800 p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            <span>Izmjena Lozinke</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl font-bold cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase text-slate-500 mb-1">
              Korisnički Nalog
            </label>
            <input
              type="text"
              disabled
              value={user.username}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-500 mb-1">
              Nova Lozinka <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Unesite novu lozinku..."
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-mono font-bold text-indigo-700 dark:text-indigo-400 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all cursor-pointer"
            >
              Odustani
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isSaving ? "Spremanje..." : "Sačuvaj"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
