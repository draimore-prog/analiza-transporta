"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export function EditUserModal({
  isOpen,
  onClose,
  user,
  onSaveUser
}) {
  const [username, setUsername] = useState("");
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("editor");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setFullname(user.fullname || "");
      setEmail(user.email || "");
      setPassword(user.password || "");
      setRole(user.role || "editor");
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !fullname.trim()) {
      alert("Korisničko ime i puno ime su obavezna polja!");
      return;
    }

    setIsSaving(true);
    try {
      const updated = {
        username: username.trim(),
        fullname: fullname.trim(),
        email: email.trim() || "",
        password: password.trim() || user.password || "",
        role: role,
        createdAt: user.createdAt || new Date().toISOString()
      };

      await onSaveUser(updated);
      alert(`Korisnički nalog "${updated.username}" je uspješno ažuriran sa ulogom "${updated.role}"!`);
      onClose();
    } catch (err) {
      alert("Greška pri ažuriranju korisnika: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-slate-900/75 flex justify-center items-center z-[80] backdrop-blur-xs p-4 cursor-pointer">
      <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800 p-6 animate-in fade-in zoom-in-95 duration-200 cursor-default">
        <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <span>✏️ Uređivanje Korisničkog Naloga</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl font-bold cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold uppercase text-slate-500 mb-1">Korisničko Ime</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-500 mb-1">Ime i Prezime</label>
            <input
              type="text"
              required
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-medium outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-500 mb-1">Email adresa</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="npr. korisnik@bingotuzla.ba"
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-500 mb-1">Lozinka</label>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-mono font-bold text-indigo-700 dark:text-indigo-400 outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-500 mb-1">Uloga / Prava Pristupa</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-bold bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            >
              <option value="editor">✍️ Admin - Unos faktura</option>
              <option value="viewer">📊 Analitičar (Samo pregled)</option>
              <option value="warehouse_specialist">🏗️ Specijalist skladišne mehanizacije</option>
              <option value="serviser">🔧 Serviser (Samo pregled kartona)</option>
              <option value="superadmin">👑 Super Administrator</option>
            </select>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 mt-4">
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isSaving ? "Spremanje..." : "💾 Sačuvaj Izmjene"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
