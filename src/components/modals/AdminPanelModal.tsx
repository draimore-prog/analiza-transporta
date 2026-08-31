"use client";

import React, { useState } from "react";
import { UserAccount } from "@/types/auth";
import { AppRole } from "@/types/roles";
import { Users, Shield, Plus, Edit2, Key, Trash2, RefreshCw, X } from "lucide-react";

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  roles: Record<string, AppRole>;
  activeUser: UserAccount | null;
  onOpenEditUser: (user: UserAccount) => void;
  onOpenEditRole: (role: AppRole) => void;
  onSaveUser: (user: UserAccount) => Promise<void>;
  onDeleteUser: (username: string) => Promise<void>;
  onReseedRoles: () => Promise<void>;
}

export function AdminPanelModal({
  isOpen,
  onClose,
  users,
  roles,
  activeUser,
  onOpenEditUser,
  onOpenEditRole,
  onSaveUser,
  onDeleteUser,
  onReseedRoles
}: AdminPanelModalProps) {
  const [activeAdminTab, setActiveAdminTab] = useState<"users" | "roles">("users");

  // New user form state
  const [newUsername, setNewUsername] = useState("");
  const [newFullname, setNewFullname] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("editor");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isReseeding, setIsReseeding] = useState(false);

  if (!isOpen) return null;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newFullname.trim() || !newPassword.trim()) {
      alert("Molimo popunite sva obavezna polja!");
      return;
    }

    setIsCreatingUser(true);
    try {
      const newUserObj: UserAccount = {
        username: newUsername.trim().toLowerCase(),
        fullname: newFullname.trim(),
        email: newEmail.trim() || undefined,
        password: newPassword.trim(),
        role: newRole,
        createdAt: new Date().toLocaleDateString("bs-BA")
      };

      await onSaveUser(newUserObj);
      alert(`Nalog "${newUserObj.username}" je uspješno kreiran sa ulogom "${newUserObj.role}"!`);
      setNewUsername("");
      setNewFullname("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("editor");
    } catch (err: any) {
      alert("Greška: " + err.message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleReseed = async () => {
    setIsReseeding(true);
    try {
      await onReseedRoles();
      alert("Sve sistemske uloge i permisije su uspješno sinhronizovane na Firestore kolekciju 'app_roles'!");
    } catch (err: any) {
      alert("Greška: " + err.message);
    } finally {
      setIsReseeding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 flex justify-center items-center z-[70] backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20 text-2xl">
              ⚙️
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                <span>Administracija Sistema & Korisnički Nalozi</span>
              </h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                Upravljanje pristupnim nalozima, lozinkama i dinamičkim ulogama na Firebase bazi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveAdminTab("users")}
            className={`flex items-center gap-2 px-4 py-2.5 font-extrabold text-xs rounded-t-xl transition-all cursor-pointer border-t border-x ${
              activeAdminTab === "users"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 shadow-xs"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>👥 Korisnički Nalozi</span>
            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-mono font-bold">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveAdminTab("roles")}
            className={`flex items-center gap-2 px-4 py-2.5 font-extrabold text-xs rounded-t-xl transition-all cursor-pointer border-t border-x ${
              activeAdminTab === "roles"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 shadow-xs"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>🛡️ Uloge & Navigacijski Paneli (app_roles)</span>
            <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">
              {Object.keys(roles).length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50 dark:bg-slate-900/50 text-xs">
          {activeAdminTab === "users" ? (
            <>
              {/* Add User Form */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <h4 className="font-extrabold text-slate-900 dark:text-white mb-3 text-xs flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-600" /> Kreiranje Novog Korisničkog Naloga
                </h4>

                <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Korisničko Ime <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="npr. ime.prezime"
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Ime i Prezime <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newFullname}
                      onChange={(e) => setNewFullname(e.target.value)}
                      placeholder="Ime Prezime"
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 font-medium outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="ime@bingotuzla.ba"
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 font-medium outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Lozinka <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Lozinka..."
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 font-mono font-bold text-indigo-700 dark:text-indigo-400 outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Uloga / Prava
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      <option value="editor">✍️ Admin - Unos faktura</option>
                      <option value="viewer">📊 Analitičar (Samo pregled)</option>
                      <option value="warehouse_specialist">🏗️ Specijalist skladišne mehanizacije</option>
                      <option value="serviser">🔧 Serviser (Samo pregled kartona)</option>
                      <option value="superadmin">👑 Super Administrator</option>
                    </select>
                  </div>

                  <div className="lg:col-span-5 flex justify-end">
                    <button
                      type="submit"
                      disabled={isCreatingUser}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isCreatingUser ? "Kreiranje..." : "Kreiraj Korisnički Nalog"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Users Table */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3">Korisničko Ime</th>
                        <th className="p-3">Ime i Prezime</th>
                        <th className="p-3">Uloga</th>
                        <th className="p-3">Kreiran</th>
                        <th className="p-3 text-right">Akcije</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {users.map((u) => {
                        const isSuper = u.role === "superadmin" || u.username === "emir.durakovic";
                        return (
                          <tr key={u.username} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{u.username}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{u.fullname || "-"}</td>
                            <td className="p-3">
                              {isSuper ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                                  👑 Super Administrator
                                </span>
                              ) : u.role === "warehouse_specialist" ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                  🏗️ Specijalist skladišne mehanizacije
                                </span>
                              ) : u.role === "viewer" ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                  📊 Analitičar (Pregled)
                                </span>
                              ) : u.role === "serviser" ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                                  🔧 Serviser
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                                  ✍️ Admin (Unos faktura)
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-500 dark:text-slate-400">{u.createdAt || "-"}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => onOpenEditUser(u)}
                                className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold mr-3 cursor-pointer"
                              >
                                ✏️ Uredi
                              </button>
                              {!isSuper && activeUser?.username !== u.username && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Da li ste sigurni da želite obrisati nalog "${u.username}"?`)) {
                                      onDeleteUser(u.username);
                                    }
                                  }}
                                  className="text-red-600 dark:text-red-400 hover:underline font-bold cursor-pointer"
                                >
                                  🗑️ Obriši
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* Roles Tab */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">
                    🛡️ Dinamička Matrica Uloga i Navigacijskih Dozvola (Firestore: app_roles)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Svaka uloga u realnom vremenu definiše koje tabove i gumbe korisnik može vidjeti
                  </p>
                </div>

                <button
                  onClick={handleReseed}
                  disabled={isReseeding}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isReseeding ? "Sinhronizujem..." : "🔄 Resetuj / Sinhronizuj Uloge"}</span>
                </button>
              </div>

              {/* Roles Cards Grid */}
              <div className="grid grid-cols-1 gap-4">
                {Object.values(roles).map((role) => (
                  <div
                    key={role.roleId}
                    className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                          {role.roleIcon || "🛡️"}
                        </span>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{role.roleName}</span>
                            <code className="text-[11px] font-mono text-indigo-600 bg-indigo-50 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded font-bold">
                              id: {role.roleId}
                            </code>
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{role.description || "-"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full uppercase tracking-wider">
                          Default: {role.defaultPortal}
                        </span>
                        <button
                          onClick={() => onOpenEditRole(role)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Uredi Dozvole
                        </button>
                      </div>
                    </div>

                    {/* Panels and Permissions overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                          Dozvoljeni Navigacijski Paneli:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(role.navigationPanels || []).map((p) => (
                            <span
                              key={p.id}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            >
                              {p.icon} {p.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                          Akcijske Dozvole:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(role.permissions || {}).map(([k, val]) => (
                            <span
                              key={k}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                                val
                                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                  : "bg-slate-100 dark:bg-slate-900 text-slate-400 opacity-60 line-through"
                              }`}
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
