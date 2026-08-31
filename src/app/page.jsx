"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth.js";
import { useFleetData } from "@/hooks/useFleetData.js";
import { Sidebar } from "@/components/layout/Sidebar.jsx";
import { Header } from "@/components/layout/Header.jsx";

// Transport Tabovi
import { TransportKpis } from "@/components/transport/TransportKpis.jsx";
import { MaintenanceAnalysis } from "@/components/transport/MaintenanceAnalysis.jsx";
import { YoYComparison } from "@/components/transport/YoYComparison.jsx";
import { ServiceTable } from "@/components/transport/ServiceTable.jsx";
import { MasterFleetTable } from "@/components/transport/MasterFleetTable.jsx";

// Skladišni Tabovi
import { WarehouseKpis } from "@/components/warehouse/WarehouseKpis.jsx";
import { WarehouseFleet } from "@/components/warehouse/WarehouseFleet.jsx";
import { WarehouseRepairs } from "@/components/warehouse/WarehouseRepairs.jsx";
import { WarehouseSegments } from "@/components/warehouse/WarehouseSegments.jsx";
import { WarehouseSuppliers } from "@/components/warehouse/WarehouseSuppliers.jsx";

// Modali
import { LoginModal } from "@/components/modals/LoginModal.jsx";
import { VehicleCardModal } from "@/components/modals/VehicleCardModal.jsx";
import { NewCostModal } from "@/components/modals/NewCostModal.jsx";
import { EditVehicleModal } from "@/components/modals/EditVehicleModal.jsx";
import { AdminPanelModal } from "@/components/modals/AdminPanelModal.jsx";
import { EditRoleModal } from "@/components/modals/EditRoleModal.jsx";
import { EditUserModal } from "@/components/modals/EditUserModal.jsx";
import { ChangePasswordModal } from "@/components/modals/ChangePasswordModal.jsx";
import { IntExtRecapModal } from "@/components/modals/IntExtRecapModal.jsx";
import { SupplierDetailModal } from "@/components/modals/SupplierDetailModal.jsx";
import { SegmentDetailModal } from "@/components/modals/SegmentDetailModal.jsx";

// Mape za čitljive nazive stranica u URL-u
const TRANSPORT_TAB_SLUGS = {
  1: "kpi-pregled",
  2: "analiza-odrzavanja",
  3: "yoy-komparacija",
  4: "tabela-servisa",
  5: "maticna-baza-flote"
};

const TRANSPORT_SLUG_TO_TAB = {
  "kpi-pregled": 1,
  "kpi-struktura": 1,
  "1": 1,
  "analiza-odrzavanja": 2,
  "2": 2,
  "yoy-komparacija": 3,
  "3": 3,
  "tabela-servisa": 4,
  "4": 4,
  "maticna-baza-flote": 5,
  "maticna-baza": 5,
  "5": 5
};

const WAREHOUSE_TAB_SLUGS = {
  1: "analitika-finansije",
  2: "sifrarnik-flote",
  3: "pregled-svih-opravki",
  4: "segmenti-dijelovi",
  5: "serviseri-dobavljaci"
};

const WAREHOUSE_SLUG_TO_TAB = {
  "analitika-finansije": 1,
  "1": 1,
  "sifrarnik-flote": 2,
  "2": 2,
  "pregled-svih-opravki": 3,
  "3": 3,
  "segmenti-dijelovi": 4,
  "4": 4,
  "serviseri-dobavljaci": 5,
  "5": 5
};

function DashboardContent() {
  const {
    activeUser,
    users,
    roles,
    currentRole,
    isAuthReady,
    login,
    logout,
    saveUserToFirestore,
    deleteUserFromFirestore,
    saveRoleToFirestore
  } = useAuth();

  const {
    masterFleet,
    costData,
    warehouseCostData,
    warehouseMasterFleet,
    isLoading,
    loadProgress,
    addCostRecord,
    deleteCostRecord,
    saveVehicle
  } = useFleetData();

  // Stanje portala i tabova sa čitljivim URL slugovima
  const [portalMode, setPortalModeState] = useState("transport");
  const [activeTab, setActiveTabState] = useState(1);
  const [activeWhTab, setActiveWhTabState] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Funkcije za promjenu tabova sa čitljivim nazivom stranice u linku
  const setPortalMode = useCallback((mode) => {
    setPortalModeState(mode);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const portalSlug = mode === "warehouse" ? "skladisna-mehanizacija" : "transport";
      url.searchParams.set("portal", portalSlug);
      const pageSlug = mode === "warehouse" ? WAREHOUSE_TAB_SLUGS[activeWhTab] : TRANSPORT_TAB_SLUGS[activeTab];
      url.searchParams.set("stranica", pageSlug);
      url.searchParams.delete("tab");
      url.searchParams.delete("whTab");
      window.history.pushState({}, "", url.toString());
    }
  }, [activeTab, activeWhTab]);

  const setActiveTab = useCallback((tabNum) => {
    setActiveTabState(tabNum);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("portal", "transport");
      url.searchParams.set("stranica", TRANSPORT_TAB_SLUGS[tabNum] || "kpi-pregled");
      url.searchParams.delete("tab");
      url.searchParams.delete("whTab");
      window.history.pushState({}, "", url.toString());
    }
  }, []);

  const setActiveWhTab = useCallback((tabNum) => {
    setActiveWhTabState(tabNum);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("portal", "skladisna-mehanizacija");
      url.searchParams.set("stranica", WAREHOUSE_TAB_SLUGS[tabNum] || "analitika-finansije");
      url.searchParams.delete("tab");
      url.searchParams.delete("whTab");
      window.history.pushState({}, "", url.toString());
    }
  }, []);

  // Čitanje URL parametara pri učitavanju i promjeni historije (popstate)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const portalParam = params.get("portal");
      const pageParam = params.get("stranica") || params.get("tab") || params.get("whTab");

      const isWh = portalParam === "skladisna-mehanizacija" || portalParam === "skladiste" || portalParam === "warehouse";
      if (isWh) {
        setPortalModeState("warehouse");
        if (pageParam && WAREHOUSE_SLUG_TO_TAB[pageParam]) {
          setActiveWhTabState(WAREHOUSE_SLUG_TO_TAB[pageParam]);
        }
      } else {
        setPortalModeState("transport");
        if (pageParam && TRANSPORT_SLUG_TO_TAB[pageParam]) {
          setActiveTabState(TRANSPORT_SLUG_TO_TAB[pageParam]);
        }
      }
    };

    handleUrlChange();
    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, []);

  // Filteri
  const [selectedServiceYear, setSelectedServiceYear] = useState("all");

  // Stanja modala
  const [vehicleModalReg, setVehicleModalReg] = useState(null);
  const [isNewCostOpen, setIsNewCostOpen] = useState(false);
  const [isNewVehicleOpen, setIsNewVehicleOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  // Detaljni modali
  const [intExtModalTarget, setIntExtModalTarget] = useState(null);
  const [supplierModalTarget, setSupplierModalTarget] = useState(null);
  const [segmentModalTarget, setSegmentModalTarget] = useState(null);

  // Dark mode klasa na dokumentu
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Automatska dodjela početnog portala na osnovu uloge
  useEffect(() => {
    if (activeUser?.role === "warehouse_specialist") {
      setPortalModeState("warehouse");
    } else if (currentRole?.defaultPortal) {
      setPortalModeState(currentRole.defaultPortal === "warehouse" ? "warehouse" : "transport");
    }
  }, [activeUser, currentRole]);

  // Drilldown akcije
  const handleSelectYearDrilldown = useCallback((year) => {
    setSelectedServiceYear(year.toString());
    setActiveTab(4);
  }, [setActiveTab]);

  const handleSelectTypeDrilldown = useCallback((type) => {
    setActiveTab(4);
  }, [setActiveTab]);

  const handleSelectBrandDrilldown = useCallback((brand) => {
    setActiveTab(4);
  }, [setActiveTab]);

  // Čekanje inicijalizacije autentifikacije
  if (!isAuthReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white gap-4 p-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Provjera prijave...</p>
      </div>
    );
  }

  // Ako korisnik NIJE prijavljen, prikazuje se SAMO login modal i NIKAKVI podaci
  if (!activeUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <LoginModal
          isOpen={true}
          onLogin={login}
        />
      </div>
    );
  }

  // Učitavanje baze podataka za prijavljenog korisnika
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white gap-4 p-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <h2 className="text-xl font-bold tracking-tight">Analiza Transporta & Voznog Parka</h2>
        <p className="text-xs text-slate-400 font-mono">{loadProgress}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar sa navigacijom i odjavom */}
      <Sidebar
        portalMode={portalMode}
        setPortalMode={setPortalMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeWhTab={activeWhTab}
        setActiveWhTab={setActiveWhTab}
        activeUser={activeUser}
        currentRole={currentRole}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
        onLogout={logout}
      />

      {/* Glavni Kontejner - 100% širina browsera */}
      <div className="flex-1 flex flex-col min-w-0 w-full h-full overflow-hidden">
        {/* Header sa brzom pretragom i V1 dugmetom */}
        <Header
          portalMode={portalMode}
          setPortalMode={setPortalMode}
          currentRole={currentRole}
          onOpenVehicleModal={(reg) => setVehicleModalReg(reg)}
          onOpenNewCostModal={() => setIsNewCostOpen(true)}
          onOpenNewVehicleModal={() => setIsNewVehicleOpen(true)}
        />

        {/* Skrolabilni Body Dashboarda - 100% širina */}
        <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
          {portalMode === "transport" ? (
            /* Glavni Transport Tabovi */
            <>
              {activeTab === 1 && (
                <TransportKpis
                  masterFleet={masterFleet}
                  costData={costData}
                  onSelectYear={handleSelectYearDrilldown}
                  onOpenFleetTab={() => setActiveTab(5)}
                  onOpenVehicleModal={(reg) => setVehicleModalReg(reg)}
                  onOpenIntExtRecap={(t) => setIntExtModalTarget(t)}
                  onOpenSupplierDetail={(s) => setSupplierModalTarget(s)}
                  onOpenSegmentDetail={(seg) => setSegmentModalTarget(seg)}
                />
              )}

              {activeTab === 2 && (
                <MaintenanceAnalysis
                  costData={costData}
                  masterFleet={masterFleet}
                  onSelectType={handleSelectTypeDrilldown}
                  onSelectBrand={handleSelectBrandDrilldown}
                />
              )}

              {activeTab === 3 && (
                <YoYComparison
                  costData={costData}
                />
              )}

              {activeTab === 4 && (
                <ServiceTable
                  costData={costData}
                  selectedYear={selectedServiceYear}
                  setSelectedYear={setSelectedServiceYear}
                  onOpenVehicleModal={(reg) => setVehicleModalReg(reg)}
                  onDeleteCostRecord={deleteCostRecord}
                  activeUser={activeUser}
                />
              )}

              {activeTab === 5 && (
                <MasterFleetTable
                  masterFleet={masterFleet}
                  onOpenVehicleModal={(reg) => setVehicleModalReg(reg)}
                  onOpenNewVehicleModal={() => setIsNewVehicleOpen(true)}
                  activeUser={activeUser}
                  currentRole={currentRole}
                />
              )}
            </>
          ) : (
            /* Skladišna Mehanizacija Tabovi */
            <>
              {activeWhTab === 1 && (
                <WarehouseKpis
                  warehouseMasterFleet={warehouseMasterFleet}
                  warehouseCostData={warehouseCostData}
                  onSelectYear={() => setActiveWhTab(3)}
                  onOpenFleetTab={() => setActiveWhTab(2)}
                  onOpenVehicleModal={(reg) => setVehicleModalReg(reg)}
                />
              )}

              {activeWhTab === 2 && (
                <WarehouseFleet
                  warehouseMasterFleet={warehouseMasterFleet}
                  onOpenVehicleModal={(reg) => setVehicleModalReg(reg)}
                />
              )}

              {activeWhTab === 3 && (
                <WarehouseRepairs
                  warehouseCostData={warehouseCostData}
                  onOpenVehicleModal={(reg) => setVehicleModalReg(reg)}
                  onDeleteCostRecord={deleteCostRecord}
                  activeUser={activeUser}
                />
              )}

              {activeWhTab === 4 && (
                <WarehouseSegments
                  warehouseCostData={warehouseCostData}
                  onSelectSegment={(s) => setSegmentModalTarget(s)}
                />
              )}

              {activeWhTab === 5 && (
                <WarehouseSuppliers
                  warehouseCostData={warehouseCostData}
                  onSelectSupplier={(s) => setSupplierModalTarget(s)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* ================= MODALI ================= */}

      {/* Karton Vozila Modal */}
      <VehicleCardModal
        isOpen={!!vehicleModalReg}
        onClose={() => setVehicleModalReg(null)}
        reg={vehicleModalReg || ""}
        masterFleet={masterFleet}
        costData={costData}
      />

      {/* Rekapitulacija Internih / Eksternih Servisa Modal */}
      <IntExtRecapModal
        isOpen={!!intExtModalTarget}
        onClose={() => setIntExtModalTarget(null)}
        targetType={intExtModalTarget || "Interno"}
        costData={costData}
        onOpenVehicleModal={(reg) => {
          setIntExtModalTarget(null);
          setVehicleModalReg(reg);
        }}
      />

      {/* Detalji Dobavljača / Servisera Modal */}
      <SupplierDetailModal
        isOpen={!!supplierModalTarget}
        onClose={() => setSupplierModalTarget(null)}
        supplierName={supplierModalTarget || ""}
        costData={costData}
        onOpenVehicleModal={(reg) => {
          setSupplierModalTarget(null);
          setVehicleModalReg(reg);
        }}
      />

      {/* Detalji Segmenta Modal */}
      <SegmentDetailModal
        isOpen={!!segmentModalTarget}
        onClose={() => setSegmentModalTarget(null)}
        segmentName={segmentModalTarget || ""}
        costData={costData}
        onOpenVehicleModal={(reg) => {
          setSegmentModalTarget(null);
          setVehicleModalReg(reg);
        }}
      />

      {/* Unos Novog Troška */}
      <NewCostModal
        isOpen={isNewCostOpen}
        onClose={() => setIsNewCostOpen(false)}
        masterFleet={masterFleet}
        onSaveCost={addCostRecord}
        activeUser={activeUser}
      />

      {/* Unos / Nabavka Novog Vozila */}
      <EditVehicleModal
        isOpen={isNewVehicleOpen}
        onClose={() => setIsNewVehicleOpen(false)}
        onSaveVehicle={saveVehicle}
      />

      {/* Admin Panel Modal */}
      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        users={users}
        roles={roles}
        activeUser={activeUser}
        onOpenEditUser={(u) => setEditingUser(u)}
        onOpenEditRole={(r) => setEditingRole(r)}
        onSaveUser={saveUserToFirestore}
        onDeleteUser={deleteUserFromFirestore}
        onReseedRoles={async () => {
          for (const r of Object.values(roles)) {
            await saveRoleToFirestore(r);
          }
        }}
      />

      {/* Uređivanje Uloge Modal */}
      <EditRoleModal
        isOpen={!!editingRole}
        onClose={() => setEditingRole(null)}
        role={editingRole}
        onSaveRole={saveRoleToFirestore}
      />

      {/* Uređivanje Korisnika Modal */}
      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onSaveUser={saveUserToFirestore}
      />

      {/* Izmjena Lozinke Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        user={activeUser}
        onSaveUser={saveUserToFirestore}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <DashboardContent />
    </Suspense>
  );
}
