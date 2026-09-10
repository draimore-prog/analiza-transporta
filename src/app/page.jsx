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
import { hasPageAccess, canEditPage, APP_NAV_SECTIONS } from "@/lib/constants.js";

// Mape za čitljive nazive stranica u URL-u i kompatibilnost starih linkova
const PAGE_SLUG_MAPPINGS = {
  // Analitika
  "kpi-pregled": "kpi-pregled",
  "kpi-struktura": "kpi-pregled",
  "1": "kpi-pregled",
  "analiza-odrzavanja": "analiza-odrzavanja",
  "2": "analiza-odrzavanja",
  "yoy-komparacija": "yoy-komparacija",
  "3": "yoy-komparacija",
  "tco-zamjena": "tco-zamjena",
  "tco-kalkulator": "tco-zamjena",
  "6": "tco-zamjena",

  // Baza podataka
  "maticna-baza-flote": "maticna-baza-flote",
  "maticna-baza": "maticna-baza-flote",
  "5": "maticna-baza-flote",
  "tabela-servisa": "tabela-servisa",
  "4": "tabela-servisa",

  // Skladišna mehanizacija
  "skladiste-analitika": "skladiste-analitika",
  "analitika-finansije": "skladiste-analitika",
  "skladiste-sifrarnik": "skladiste-sifrarnik",
  "sifrarnik-flote": "skladiste-sifrarnik",
  "skladiste-opravke": "skladiste-opravke",
  "pregled-svih-opravki": "skladiste-opravke",
  "skladiste-segmenti": "skladiste-segmenti",
  "segmenti-dijelovi": "skladiste-segmenti",
  "skladiste-dobavljaci": "skladiste-dobavljaci",
  "serviseri-dobavljaci": "skladiste-dobavljaci",
  "skladiste-nalozi": "skladiste-nalozi",
  "radni-nalozi": "skladiste-nalozi",

  // Servisna radionica
  "servisna-radionica": "servisna-radionica",
  "karton-pretraga": "servisna-radionica"
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

  // Stanje aktivne stranice (sa čitljivim URL slugom)
  const [activePage, setActivePageState] = useState("kpi-pregled");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Funkcija za navigaciju na određenu stranicu uz ažuriranje browser URL-a
  const navigateToPage = useCallback((pageId) => {
    if (!pageId || typeof pageId !== "string") return;
    setActivePageState(pageId);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("stranica", pageId);
      url.searchParams.delete("portal");
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

      let resolvedPage = "kpi-pregled";
      if (portalParam === "servisna-radionica" || portalParam === "serviser") {
        resolvedPage = "servisna-radionica";
      } else if (portalParam === "skladisna-mehanizacija" || portalParam === "warehouse" || portalParam === "skladiste") {
        if (pageParam && PAGE_SLUG_MAPPINGS[pageParam]) {
          resolvedPage = PAGE_SLUG_MAPPINGS[pageParam];
        } else {
          resolvedPage = "skladiste-analitika";
        }
      } else if (pageParam && PAGE_SLUG_MAPPINGS[pageParam]) {
        resolvedPage = PAGE_SLUG_MAPPINGS[pageParam];
      }
      setActivePageState(resolvedPage);
    };

    handleUrlChange();
    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, []);

  // Filteri
  const [selectedServiceYear, setSelectedServiceYear] = useState("all");
  const [selectedWarehouseYear, setSelectedWarehouseYear] = useState("all");

  // Perzistentno stanje posjećenih stranica skladišne mehanizacije za instantnu navigaciju
  const [visitedWhPages, setVisitedWhPages] = useState(() => new Set(["skladiste-analitika"]));

  useEffect(() => {
    if (activePage && activePage.startsWith("skladiste-")) {
      setVisitedWhPages((prev) => {
        if (prev.has(activePage)) return prev;
        const next = new Set(prev);
        next.add(activePage);
        return next;
      });
    }
  }, [activePage]);

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

  // Automatska dodjela početne stranice ili zaštita ako korisnik nema pristup traženoj stranici
  useEffect(() => {
    if (!currentRole) return;

    // Ako korisnik nema dozvolu za activePage, preusmjeri ga na dozvoljenu
    if (!hasPageAccess(currentRole, activePage)) {
      if (currentRole.defaultPage && hasPageAccess(currentRole, currentRole.defaultPage)) {
        setActivePageState(currentRole.defaultPage);
        return;
      }
      for (const sec of APP_NAV_SECTIONS) {
        const firstAllowed = sec.items.find((i) => hasPageAccess(currentRole, i.id));
        if (firstAllowed) {
          setActivePageState(firstAllowed.id);
          return;
        }
      }
      return;
    }

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("stranica") || params.get("portal") || params.get("tab") || params.get("whTab")) {
        return;
      }
    }
    if (currentRole?.defaultPage && hasPageAccess(currentRole, currentRole.defaultPage)) {
      setActivePageState(currentRole.defaultPage);
    } else if (activeUser?.role === "warehouse_specialist") {
      setActivePageState("skladiste-analitika");
    } else if (activeUser?.role === "serviser" || activeUser?.role === "mobile_serviser") {
      setActivePageState("servisna-radionica");
    }
  }, [activeUser, currentRole, activePage]);

  // Drilldown akcije
  const handleSelectYearDrilldown = useCallback((year) => {
    setSelectedServiceYear(year.toString());
    navigateToPage("tabela-servisa");
  }, [navigateToPage]);

  const handleSelectTypeDrilldown = useCallback((type) => {
    navigateToPage("tabela-servisa");
  }, [navigateToPage]);

  const handleSelectBrandDrilldown = useCallback((brand) => {
    navigateToPage("tabela-servisa");
  }, [navigateToPage]);

  // Stabilni warehouse handler-i
  const handleWhSelectYear = useCallback((year) => {
    setSelectedWarehouseYear(year ? String(year) : "all");
    navigateToPage("skladiste-opravke");
  }, [navigateToPage]);

  const handleWhOpenFleetTab = useCallback(() => {
    navigateToPage("skladiste-sifrarnik");
  }, [navigateToPage]);

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
  if (activePage === "servisna-radionica") {
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
          onLogout={() => logout()}
          onSwitchPortal={() => navigateToPage("kpi-pregled")}
          canEdit={canEditPage(currentRole, "servisna-radionica")}
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

  const isWarehouseMode = activePage.startsWith("skladiste-");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar sa navigacijom i odjavom */}
      <Sidebar
        activePage={activePage}
        onNavigatePage={navigateToPage}
        activeUser={activeUser}
        currentRole={currentRole}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
        onLogout={() => logout()}
        pendingWorkOrdersCount={pendingReviewCount}
      />

      {/* Glavni Kontejner - 100% širina browsera */}
      <div className="flex-1 flex flex-col min-w-0 w-full h-full overflow-hidden">
        {/* Header sa brzom pretragom i kategorijskim breadcrumbom */}
        <Header
          activePage={activePage}
          onNavigatePage={navigateToPage}
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
          {/* 1. KATEGORIJA: ANALITIKA */}
          {activePage === "kpi-pregled" && (
            <TransportKpis
              masterFleet={masterFleet}
              costData={costData}
              onSelectYear={handleSelectYearDrilldown}
              onOpenFleetTab={() => navigateToPage("maticna-baza-flote")}
              onOpenVehicleModal={(reg) => setVehicleModalReg(reg)}
              onOpenIntExtRecap={(t) => setIntExtModalTarget(t)}
              onOpenSupplierDetail={(s) => setSupplierModalTarget(s)}
              onOpenSegmentDetail={(seg) => setSegmentModalTarget(seg)}
            />
          )}

          {activePage === "analiza-odrzavanja" && (
            <MaintenanceAnalysis
              costData={costData}
              masterFleet={masterFleet}
              onSelectType={handleSelectTypeDrilldown}
              onSelectBrand={handleSelectBrandDrilldown}
            />
          )}

          {activePage === "yoy-komparacija" && (
            <YoYComparison
              costData={costData}
            />
          )}

          {activePage === "tco-zamjena" && (
            <TcoCalculator
              masterFleet={masterFleet}
              costData={costData}
              onOpenVehicleModal={(reg) => setVehicleModalReg(reg)}
            />
          )}

          {/* 2. KATEGORIJA: BAZA PODATAKA */}
          {activePage === "maticna-baza-flote" && (
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
              canEdit={canEditPage(currentRole, "maticna-baza-flote")}
            />
          )}

          {activePage === "tabela-servisa" && (
            <ServiceTable
              costData={costData}
              selectedYear={selectedServiceYear}
              setSelectedYear={setSelectedServiceYear}
              onOpenVehicleModal={(reg) => setVehicleModalReg(reg)}
              onDeleteCostRecord={deleteCostRecord}
              activeUser={activeUser}
              canEdit={canEditPage(currentRole, "tabela-servisa")}
            />
          )}

          {/* 3. KATEGORIJA: SKLADIŠNA MEHANIZACIJA (sa perzistentnim stanjem komponenti) */}
          {(visitedWhPages.has("skladiste-analitika") || activePage === "skladiste-analitika") && (
            <div className={activePage === "skladiste-analitika" ? "block" : "hidden"}>
              <WarehouseKpis
                isActive={activePage === "skladiste-analitika"}
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

          {(visitedWhPages.has("skladiste-sifrarnik") || activePage === "skladiste-sifrarnik") && (
            <div className={activePage === "skladiste-sifrarnik" ? "block" : "hidden"}>
              <WarehouseFleet
                warehouseMasterFleet={warehouseMasterFleet}
                onOpenVehicleModal={handleWhOpenVehicleModal}
                onOpenEditVehicle={handleWhOpenEditVehicle}
                currentRole={currentRole}
                canEdit={canEditPage(currentRole, "skladiste-sifrarnik")}
              />
            </div>
          )}

          {(visitedWhPages.has("skladiste-opravke") || activePage === "skladiste-opravke") && (
            <div className={activePage === "skladiste-opravke" ? "block" : "hidden"}>
              <WarehouseRepairs
                warehouseCostData={warehouseCostData}
                selectedYear={selectedWarehouseYear}
                setSelectedYear={setSelectedWarehouseYear}
                onOpenVehicleModal={handleWhOpenVehicleModal}
                onDeleteCostRecord={deleteCostRecord}
                activeUser={activeUser}
                canEdit={canEditPage(currentRole, "skladiste-opravke")}
              />
            </div>
          )}

          {(visitedWhPages.has("skladiste-segmenti") || activePage === "skladiste-segmenti") && (
            <div className={activePage === "skladiste-segmenti" ? "block" : "hidden"}>
              <WarehouseSegments
                warehouseCostData={warehouseCostData}
                onSelectSegment={handleWhOpenSegmentDetail}
              />
            </div>
          )}

          {(visitedWhPages.has("skladiste-dobavljaci") || activePage === "skladiste-dobavljaci") && (
            <div className={activePage === "skladiste-dobavljaci" ? "block" : "hidden"}>
              <WarehouseSuppliers
                warehouseCostData={warehouseCostData}
                onSelectSupplier={handleWhOpenSupplierDetail}
              />
            </div>
          )}

          {(visitedWhPages.has("skladiste-nalozi") || activePage === "skladiste-nalozi") && (
            <div className={activePage === "skladiste-nalozi" ? "block" : "hidden"}>
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
                canEdit={canEditPage(currentRole, "skladiste-nalozi")}
              />
            </div>
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
        costData={isWarehouseMode ? warehouseCostData : costData}
        isWarehouseMode={isWarehouseMode}
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
        costData={isWarehouseMode ? warehouseCostData : costData}
        isWarehouseMode={isWarehouseMode}
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
        costData={isWarehouseMode ? warehouseCostData : costData}
        isWarehouseMode={isWarehouseMode}
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
        users={users}
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
        users={users}
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
