"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth.js";
import { useFleetData } from "@/hooks/useFleetData.js";
import { Sidebar } from "@/components/layout/Sidebar.jsx";
import { Header } from "@/components/layout/Header.jsx";
import { ErrorBoundary } from "@/components/common/ErrorBoundary.jsx";

// Transport Tabovi
import { TransportKpis } from "@/components/transport/TransportKpis.jsx";
import { MaintenanceAnalysis } from "@/components/transport/MaintenanceAnalysis.jsx";
import { YoYComparison } from "@/components/transport/YoYComparison.jsx";
import { ServiceTable } from "@/components/transport/ServiceTable.jsx";
import { MasterFleetTable } from "@/components/transport/MasterFleetTable.jsx";
import { TcoCalculator } from "@/components/transport/TcoCalculator.jsx";

// Skladišni Tabovi
import { WarehouseKpis } from "@/components/warehouse/WarehouseKpis.jsx";
import { WarehouseFleet } from "@/components/warehouse/WarehouseFleet.jsx";
import { WarehouseRepairs } from "@/components/warehouse/WarehouseRepairs.jsx";
import { WarehouseSegments } from "@/components/warehouse/WarehouseSegments.jsx";
import { WarehouseSuppliers } from "@/components/warehouse/WarehouseSuppliers.jsx";
import { WarehouseWorkOrders } from "@/components/warehouse/WarehouseWorkOrders.jsx";

// Serviser Portal
import { ServiserDashboard } from "@/components/serviser/ServiserDashboard.jsx";

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
import { WorkOrderDetailModal } from "@/components/warehouse/WorkOrderDetailModal.jsx";
import { WorkOrderPrintModal } from "@/components/warehouse/WorkOrderPrintModal.jsx";
import { CreateWorkOrderModal } from "@/components/warehouse/CreateWorkOrderModal.jsx";
import { FieldWorkOrderForm } from "@/components/serviser/FieldWorkOrderForm.jsx";
import { useWarehouseWorkOrders } from "@/hooks/useWarehouseWorkOrders.js";

// Mape za čitljive nazive stranica u URL-u
const TRANSPORT_TAB_SLUGS = {
  1: "kpi-pregled",
  2: "analiza-odrzavanja",
  3: "yoy-komparacija",
  4: "tabela-servisa",
  5: "maticna-baza-flote",
  6: "tco-zamjena"
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
  "5": 5,
  "tco-zamjena": 6,
  "tco-kalkulator": 6,
  "6": 6
};

const WAREHOUSE_TAB_SLUGS = {
  1: "analitika-finansije",
  2: "sifrarnik-flote",
  3: "pregled-svih-opravki",
  4: "segmenti-dijelovi",
  5: "serviseri-dobavljaci",
  6: "radni-nalozi"
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
  "5": 5,
  "radni-nalozi": 6,
  "6": 6
};

function DashboardContent() {
  const {
    activeUser,
    users,
    roles,
    currentRole,
    isAuthReady,
    sessionTimeoutMessage,
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

  const {
    workOrders,
    isLoading: isWorkOrdersLoading,
    createWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
    setOrderStatus,
    pendingReviewCount
  } = useWarehouseWorkOrders();

  // Stanja modala za radne naloge skladišne mehanizacije
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [printingWorkOrder, setPrintingWorkOrder] = useState(null);
  const [isCreateWorkOrderOpen, setIsCreateWorkOrderOpen] = useState(false);
  const [isFieldFormOpen, setIsFieldFormOpen] = useState(false);
  const [fieldFormInitialOrder, setFieldFormInitialOrder] = useState(null);

  const handleFieldFormSubmit = useCallback(
    async (orderPayload) => {
      if (orderPayload.id) {
        await updateWorkOrder(orderPayload.id, orderPayload);
        return { success: true, orderNumber: orderPayload.orderNumber };
      } else {
        return await createWorkOrder(orderPayload);
      }
    },
    [createWorkOrder, updateWorkOrder]
  );

  const pendingWorkOrders = useMemo(() => {
    return workOrders.filter((o) => o.status === "completed");
  }, [workOrders]);

  const handleSeedDemoWorkOrder = useCallback(async () => {
    try {
      await createWorkOrder({
        orderNumber: "RN-SM-2026-0001",
        status: "completed",
        type: "preventive",
        priority: "normal",
        assignedTo: "Mirnes Hasić",
        createdBy: "Emir Duraković",
        vehicleId: "SM-042",
        vehicleDetails: {
          tip: "Regalni viljuškar",
          proizvodjac: "Jungheinrich",
          model: "ETV 214",
          serijskiBroj: "91045231",
          lokacija: "PJ Centralno Skladište Sarajevo"
        },
        workHours: 4820,
        checklist: {
          wheels: { status: "ok", label: "Točkovi i gume" },
          mast_forks: { status: "ok", label: "Kran, viljuške i lanci" },
          battery: { status: "ok", label: "Baterija i punjač" },
          hydraulics: { status: "issue", label: "Hidraulika i ulje", note: "Uočeno blago vlaženje na gornjem spoju crijeva podizanja krana. Crijevo dotegnuto." },
          brakes: { status: "ok", label: "Kočioni sistem" },
          steering_electronics: { status: "ok", label: "Ruda i elektronika" },
          chassis_seat: { status: "ok", label: "Šasija i sjedište" },
          safety_signals: { status: "ok", label: "Signalizacija i sigurnost" }
        },
        workDescription: "Izvršen kompletan redovni preventivni pregled jedinice. Zamijenjen prednji desni vodeći točkić krana (85mm), očišćeni terminali baterije, dotočena 2 litra hidrauličnog ulja HD46.",
        usedMaterials: "1x Vodeći točkić krana 85mm poliuretan, 2L Hidraulično ulje HD46, 1x Sprej za odmašćivanje",
        photos: {
          front: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80",
          back: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80",
          left: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80",
          right: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80",
          interior: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80"
        },
        notes: "Jedinica vraćena u operativan i siguran rad."
      });
    } catch (e) {
      console.warn("Seed demo error:", e);
    }
  }, [createWorkOrder]);

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
      const portalSlug =
        mode === "warehouse"
          ? "skladisna-mehanizacija"
          : mode === "serviser"
          ? "servisna-radionica"
          : "transport";
      url.searchParams.set("portal", portalSlug);
      const pageSlug =
        mode === "warehouse"
          ? WAREHOUSE_TAB_SLUGS[activeWhTab]
          : mode === "serviser"
          ? "karton-pretraga"
          : TRANSPORT_TAB_SLUGS[activeTab];
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
      const isServ = portalParam === "servisna-radionica" || portalParam === "serviser";
      if (isServ) {
        setPortalModeState("serviser");
      } else if (isWh) {
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
  const [selectedWarehouseYear, setSelectedWarehouseYear] = useState("all");

  // Perzistentno stanje posjećenih tabova skladišne mehanizacije za instantnu navigaciju
  const [visitedWhTabs, setVisitedWhTabs] = useState(() => new Set([1]));

  useEffect(() => {
    if (portalMode === "warehouse") {
      setVisitedWhTabs((prev) => {
        if (prev.has(activeWhTab)) return prev;
        const next = new Set(prev);
        next.add(activeWhTab);
        return next;
      });
    }
  }, [portalMode, activeWhTab]);

  // Stanja modala
  const [vehicleModalReg, setVehicleModalReg] = useState(null);
  const [isNewCostOpen, setIsNewCostOpen] = useState(false);
  const [isNewVehicleOpen, setIsNewVehicleOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  // Detaljni modali
  const [intExtModalTarget, setIntExtModalTarget] = useState(null);
  const [supplierModalTarget, setSupplierModalTarget] = useState(null);
  const [segmentModalTarget, setSegmentModalTarget] = useState(null);

  // Inicijalizacija i sinhronizacija Dark Mode teme
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") {
        setIsDarkMode(true);
        document.documentElement.classList.add("dark");
      } else if (savedTheme === "light") {
        setIsDarkMode(false);
        document.documentElement.classList.remove("dark");
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setIsDarkMode(true);
        document.documentElement.classList.add("dark");
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      try { localStorage.setItem("theme", "dark"); } catch (e) {}
    } else {
      document.documentElement.classList.remove("dark");
      try { localStorage.setItem("theme", "light"); } catch (e) {}
    }
  }, [isDarkMode]);

  // Automatska dodjela početnog portala na osnovu uloge
  useEffect(() => {
    if (activeUser?.role === "warehouse_specialist") {
      setPortalModeState("warehouse");
    } else if (activeUser?.role === "serviser" || activeUser?.role === "mobile_serviser") {
      setPortalModeState("serviser");
    } else if (currentRole?.defaultPortal) {
      setPortalModeState(
        currentRole.defaultPortal === "warehouse"
          ? "warehouse"
          : currentRole.defaultPortal === "serviser"
          ? "serviser"
          : "transport"
      );
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

  // Stabilni warehouse handler-i
  const handleWhSelectYear = useCallback((year) => {
    setSelectedWarehouseYear(year ? String(year) : "all");
    setActiveWhTab(3);
  }, [setActiveWhTab]);

  const handleWhOpenFleetTab = useCallback(() => {
    setActiveWhTab(2);
  }, [setActiveWhTab]);

  const handleWhOpenVehicleModal = useCallback((reg) => {
    setVehicleModalReg(reg);
  }, []);

  const handleWhOpenEditVehicle = useCallback((v) => {
    setEditingVehicle(v);
  }, []);

  const handleWhOpenIntExtRecap = useCallback((type) => {
    setIntExtModalTarget(type);
  }, []);

  const handleWhOpenSupplierDetail = useCallback((s) => {
    setSupplierModalTarget(s);
  }, []);

  const handleWhOpenSegmentDetail = useCallback((seg) => {
    setSegmentModalTarget(seg);
  }, []);

  // Zaključavanje pozadinskog skrola kada je bilo koji modal otvoren
  const isAnyModalOpen = Boolean(
    vehicleModalReg ||
    isNewCostOpen ||
    isNewVehicleOpen ||
    editingVehicle ||
    isAdminPanelOpen ||
    isPasswordModalOpen ||
    editingRole ||
    editingUser ||
    intExtModalTarget ||
    supplierModalTarget ||
    segmentModalTarget
  );

  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isAnyModalOpen]);

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
          sessionTimeoutMessage={sessionTimeoutMessage}
        />
      </div>
    );
  }

  // Učitavanje baze podataka za prijavljenog korisnika
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white gap-4 p-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <h2 className="text-xl font-bold tracking-tight">Logistika - Servis motornih vozila</h2>
        <p className="text-xs text-slate-400 font-mono">{loadProgress}</p>
      </div>
    );
  }

  // Serviserski namjenski portal (čista radionica bez teških finansijskih menija)
  if (portalMode === "serviser") {
    return (
      <div className="min-h-screen w-full overflow-y-auto bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <ServiserDashboard
          masterFleet={masterFleet}
          costData={costData}
          warehouseMasterFleet={warehouseMasterFleet}
          warehouseCostData={warehouseCostData}
          workOrders={workOrders}
          activeUser={activeUser}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onOpenVehicleModal={(reg) => setVehicleModalReg(reg)}
          onOpenFieldForm={(initialOrder = null) => {
            setFieldFormInitialOrder(initialOrder);
            setIsFieldFormOpen(true);
          }}
          onViewWorkOrder={(o) => setSelectedWorkOrder(o)}
          onPrintWorkOrder={(o) => setPrintingWorkOrder(o)}
          onLogout={logout}
          onSwitchPortal={
            currentRole?.permissions?.canSwitchPortal || activeUser?.role === "superadmin"
              ? () => setPortalMode("transport")
              : null
          }
        />

        {/* Terenski Radni Nalog Modal za Servisere */}
        <FieldWorkOrderForm
          isOpen={isFieldFormOpen}
          onClose={() => {
            setIsFieldFormOpen(false);
            setFieldFormInitialOrder(null);
          }}
          warehouseMasterFleet={warehouseMasterFleet}
          onSubmitOrder={handleFieldFormSubmit}
          activeUser={activeUser}
          initialOrder={fieldFormInitialOrder}
        />

        {/* Detaljan Pregled Radnog Naloga Modal */}
        <WorkOrderDetailModal
          isOpen={!!selectedWorkOrder}
          onClose={() => setSelectedWorkOrder(null)}
          workOrder={selectedWorkOrder}
          onPrint={(order) => {
            setSelectedWorkOrder(null);
            setPrintingWorkOrder(order);
          }}
          onUpdateOrder={updateWorkOrder}
          onApproveOrder={(id) => setOrderStatus(id, "approved", activeUser?.fullname || activeUser?.username)}
          activeUser={activeUser}
        />

        {/* Štampa Radnog Naloga A4 Modal */}
        <WorkOrderPrintModal
          isOpen={!!printingWorkOrder}
          onClose={() => setPrintingWorkOrder(null)}
          workOrder={printingWorkOrder}
        />

        {/* Karton Vozila Modal */}
        <ErrorBoundary title="Greška pri prikazu kartona vozila" onClose={() => setVehicleModalReg(null)}>
          <VehicleCardModal
            isOpen={!!vehicleModalReg}
            onClose={() => setVehicleModalReg(null)}
            reg={vehicleModalReg || ""}
            masterFleet={masterFleet}
            costData={costData}
            onOpenEditVehicle={(v) => setEditingVehicle(v)}
            currentRole={currentRole}
            activeUser={activeUser}
          />
        </ErrorBoundary>

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
        pendingWorkOrdersCount={pendingReviewCount}
      />

      {/* Glavni Kontejner - 100% širina browsera */}
      <div className="flex-1 flex flex-col min-w-0 w-full h-full overflow-hidden">
        {/* Header sa brzom pretragom i V1 dugmetom */}
        <Header
          portalMode={portalMode}
          setPortalMode={setPortalMode}
          currentRole={currentRole}
          masterFleet={masterFleet}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onOpenVehicleModal={(reg) => setVehicleModalReg(reg)}
          onOpenNewCostModal={() => setIsNewCostOpen(true)}
          onOpenNewVehicleModal={() => {
            setEditingVehicle(null);
            setIsNewVehicleOpen(true);
          }}
          pendingWorkOrders={pendingWorkOrders}
          onOpenWorkOrder={(order) => setSelectedWorkOrder(order)}
        />

        {/* Skrolabilni Body Dashboarda - 100% širina */}
        <main className="flex-1 overflow-y-auto w-full p-3 sm:p-5 lg:p-6 space-y-4">
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
                  onOpenNewVehicleModal={() => {
                    setEditingVehicle(null);
                    setIsNewVehicleOpen(true);
                  }}
                  onOpenEditVehicle={(v) => setEditingVehicle(v)}
                  activeUser={activeUser}
                  currentRole={currentRole}
                />
              )}

              {activeTab === 6 && (
                <TcoCalculator
                  masterFleet={masterFleet}
                  costData={costData}
                  onOpenVehicleModal={(reg) => setVehicleModalReg(reg)}
                />
              )}
            </>
          ) : (
            /* Skladišna Mehanizacija Tabovi - Instantna navigacija sa perzistentnim stanjem */
            <>
              {(visitedWhTabs.has(1) || activeWhTab === 1) && (
                <div className={activeWhTab === 1 ? "block" : "hidden"}>
                  <WarehouseKpis
                    isActive={activeWhTab === 1}
                    warehouseMasterFleet={warehouseMasterFleet}
                    warehouseCostData={warehouseCostData}
                    onSelectYear={handleWhSelectYear}
                    onOpenFleetTab={handleWhOpenFleetTab}
                    onOpenVehicleModal={handleWhOpenVehicleModal}
                    onOpenIntExtRecap={handleWhOpenIntExtRecap}
                    onOpenSupplierDetail={handleWhOpenSupplierDetail}
                    onOpenSegmentDetail={handleWhOpenSegmentDetail}
                  />
                </div>
              )}

              {(visitedWhTabs.has(2) || activeWhTab === 2) && (
                <div className={activeWhTab === 2 ? "block" : "hidden"}>
                  <WarehouseFleet
                    warehouseMasterFleet={warehouseMasterFleet}
                    onOpenVehicleModal={handleWhOpenVehicleModal}
                    onOpenEditVehicle={handleWhOpenEditVehicle}
                    currentRole={currentRole}
                  />
                </div>
              )}

              {(visitedWhTabs.has(3) || activeWhTab === 3) && (
                <div className={activeWhTab === 3 ? "block" : "hidden"}>
                  <WarehouseRepairs
                    warehouseCostData={warehouseCostData}
                    selectedYear={selectedWarehouseYear}
                    setSelectedYear={setSelectedWarehouseYear}
                    onOpenVehicleModal={handleWhOpenVehicleModal}
                    onDeleteCostRecord={deleteCostRecord}
                    activeUser={activeUser}
                  />
                </div>
              )}

              {(visitedWhTabs.has(4) || activeWhTab === 4) && (
                <div className={activeWhTab === 4 ? "block" : "hidden"}>
                  <WarehouseSegments
                    warehouseCostData={warehouseCostData}
                    onSelectSegment={handleWhOpenSegmentDetail}
                  />
                </div>
              )}

              {(visitedWhTabs.has(5) || activeWhTab === 5) && (
                <div className={activeWhTab === 5 ? "block" : "hidden"}>
                  <WarehouseSuppliers
                    warehouseCostData={warehouseCostData}
                    onSelectSupplier={handleWhOpenSupplierDetail}
                  />
                </div>
              )}

              {(visitedWhTabs.has(6) || activeWhTab === 6) && (
                <div className={activeWhTab === 6 ? "block" : "hidden"}>
                  <WarehouseWorkOrders
                    workOrders={workOrders}
                    isLoading={isWorkOrdersLoading}
                    onCreateOrderClick={() => setIsCreateWorkOrderOpen(true)}
                    onOpenFieldForm={() => {
                      setFieldFormInitialOrder(null);
                      setIsFieldFormOpen(true);
                    }}
                    onViewOrder={(o) => setSelectedWorkOrder(o)}
                    onPrintOrder={(o) => setPrintingWorkOrder(o)}
                    onApproveOrder={(id) => setOrderStatus(id, "approved", activeUser?.fullname || activeUser?.username)}
                    onDeleteOrder={deleteWorkOrder}
                    onSeedDemoOrder={handleSeedDemoWorkOrder}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ================= MODALI ================= */}

      {/* Karton Vozila Modal */}
      <ErrorBoundary title="Greška pri prikazu kartona vozila" onClose={() => setVehicleModalReg(null)}>
        <VehicleCardModal
          isOpen={!!vehicleModalReg}
          onClose={() => setVehicleModalReg(null)}
          reg={vehicleModalReg || ""}
          masterFleet={masterFleet}
          costData={costData}
          onOpenEditVehicle={(v) => setEditingVehicle(v)}
          currentRole={currentRole}
          activeUser={activeUser}
        />
      </ErrorBoundary>

      {/* Rekapitulacija Internih / Eksternih Servisa Modal */}
      <IntExtRecapModal
        isOpen={!!intExtModalTarget}
        onClose={() => setIntExtModalTarget(null)}
        targetType={intExtModalTarget || "Interno"}
        costData={portalMode === "warehouse" ? warehouseCostData : costData}
        isWarehouseMode={portalMode === "warehouse"}
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
        costData={portalMode === "warehouse" ? warehouseCostData : costData}
        isWarehouseMode={portalMode === "warehouse"}
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
        costData={portalMode === "warehouse" ? warehouseCostData : costData}
        isWarehouseMode={portalMode === "warehouse"}
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

      {/* Unos / Uređivanje Vozila Modal */}
      <EditVehicleModal
        isOpen={isNewVehicleOpen || !!editingVehicle}
        onClose={() => {
          setIsNewVehicleOpen(false);
          setEditingVehicle(null);
        }}
        initialVehicle={editingVehicle}
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

      {/* Detaljan Pregled Radnog Naloga Modal */}
      <WorkOrderDetailModal
        isOpen={!!selectedWorkOrder}
        onClose={() => setSelectedWorkOrder(null)}
        workOrder={selectedWorkOrder}
        onPrint={(order) => {
          setSelectedWorkOrder(null);
          setPrintingWorkOrder(order);
        }}
        onUpdateOrder={updateWorkOrder}
        onApproveOrder={(id) => setOrderStatus(id, "approved", activeUser?.fullname || activeUser?.username)}
        activeUser={activeUser}
      />

      {/* Štampa Radnog Naloga A4 Modal */}
      <WorkOrderPrintModal
        isOpen={!!printingWorkOrder}
        onClose={() => setPrintingWorkOrder(null)}
        workOrder={printingWorkOrder}
      />

      {/* Kreiranje & Dispečing Radnog Naloga Modal */}
      <CreateWorkOrderModal
        isOpen={isCreateWorkOrderOpen}
        onClose={() => setIsCreateWorkOrderOpen(false)}
        warehouseMasterFleet={warehouseMasterFleet}
        onCreateWorkOrder={createWorkOrder}
        activeUser={activeUser}
      />

      {/* Terenski Unos Radnog Naloga (Mobilna Forma) Modal */}
      <FieldWorkOrderForm
        isOpen={isFieldFormOpen}
        onClose={() => {
          setIsFieldFormOpen(false);
          setFieldFormInitialOrder(null);
        }}
        warehouseMasterFleet={warehouseMasterFleet}
        onSubmitOrder={handleFieldFormSubmit}
        activeUser={activeUser}
        initialOrder={fieldFormInitialOrder}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <ErrorBoundary title="Došlo je do neočekivane greške na portalu">
        <DashboardContent />
      </ErrorBoundary>
    </Suspense>
  );
}
