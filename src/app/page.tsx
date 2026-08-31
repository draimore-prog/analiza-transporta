"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFleetData } from "@/hooks/useFleetData";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

// Transport Tabs
import { TransportKpis } from "@/components/transport/TransportKpis";
import { MaintenanceAnalysis } from "@/components/transport/MaintenanceAnalysis";
import { YoYComparison } from "@/components/transport/YoYComparison";
import { ServiceTable } from "@/components/transport/ServiceTable";
import { MasterFleetTable } from "@/components/transport/MasterFleetTable";

// Warehouse Tabs
import { WarehouseKpis } from "@/components/warehouse/WarehouseKpis";
import { WarehouseFleet } from "@/components/warehouse/WarehouseFleet";
import { WarehouseRepairs } from "@/components/warehouse/WarehouseRepairs";
import { WarehouseSegments } from "@/components/warehouse/WarehouseSegments";
import { WarehouseSuppliers } from "@/components/warehouse/WarehouseSuppliers";

// Modals
import { VehicleCardModal } from "@/components/modals/VehicleCardModal";
import { NewCostModal } from "@/components/modals/NewCostModal";
import { EditVehicleModal } from "@/components/modals/EditVehicleModal";
import { AdminPanelModal } from "@/components/modals/AdminPanelModal";
import { EditRoleModal } from "@/components/modals/EditRoleModal";
import { EditUserModal } from "@/components/modals/EditUserModal";
import { ChangePasswordModal } from "@/components/modals/ChangePasswordModal";

import { UserAccount } from "@/types/auth";
import { AppRole } from "@/types/roles";
import { Vehicle } from "@/types/fleet";

export default function DashboardPage() {
  const {
    activeUser,
    users,
    roles,
    currentRole,
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

  // Portal and tab state
  const [portalMode, setPortalMode] = useState<"transport" | "warehouse">("transport");
  const [activeTab, setActiveTab] = useState<number>(1);
  const [activeWhTab, setActiveWhTab] = useState<number>(1);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Selected filters across drilldowns
  const [selectedServiceYear, setSelectedServiceYear] = useState<string>("all");

  // Modal States
  const [vehicleModalReg, setVehicleModalReg] = useState<string | null>(null);
  const [isNewCostOpen, setIsNewCostOpen] = useState<boolean>(false);
  const [isNewVehicleOpen, setIsNewVehicleOpen] = useState<boolean>(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Dark mode class toggle on root document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Enforce role portal permissions (e.g. warehouse_specialist only sees warehouse)
  useEffect(() => {
    if (activeUser?.role === "warehouse_specialist") {
      setPortalMode("warehouse");
    } else if (currentRole?.defaultPortal) {
      setPortalMode(currentRole.defaultPortal === "warehouse" ? "warehouse" : "transport");
    }
  }, [activeUser, currentRole]);

  // Drilldowns
  const handleSelectYearDrilldown = useCallback((year: number) => {
    setSelectedServiceYear(year.toString());
    setActiveTab(4);
  }, []);

  const handleSelectTypeDrilldown = useCallback((type: string) => {
    setActiveTab(4);
  }, []);

  const handleSelectBrandDrilldown = useCallback((brand: string) => {
    setActiveTab(4);
  }, []);

  const handleSelectSegmentDrilldown = useCallback((seg: string) => {
    setActiveWhTab(3);
  }, []);

  const handleSelectSupplierDrilldown = useCallback((sup: string) => {
    setActiveWhTab(3);
  }, []);

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
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
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
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          portalMode={portalMode}
          setPortalMode={setPortalMode}
          currentRole={currentRole}
          onOpenVehicleModal={(reg) => setVehicleModalReg(reg)}
          onOpenNewCostModal={() => setIsNewCostOpen(true)}
          onOpenNewVehicleModal={() => setIsNewVehicleOpen(true)}
        />

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
          {portalMode === "transport" ? (
            /* Transport Portal Tabs */
            <>
              {activeTab === 1 && (
                <TransportKpis
                  masterFleet={masterFleet}
                  costData={costData}
                  onSelectYear={handleSelectYearDrilldown}
                  onOpenFleetTab={() => setActiveTab(5)}
                />
              )}

              {activeTab === 2 && (
                <MaintenanceAnalysis
                  costData={costData}
                  onSelectType={handleSelectTypeDrilldown}
                  onSelectBrand={handleSelectBrandDrilldown}
                />
              )}

              {activeTab === 3 && (
                <YoYComparison
                  costData={costData}
                  onSelectYear={handleSelectYearDrilldown}
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
            /* Warehouse Portal Tabs */
            <>
              {activeWhTab === 1 && (
                <WarehouseKpis
                  warehouseMasterFleet={warehouseMasterFleet}
                  warehouseCostData={warehouseCostData}
                  onSelectYear={(y) => setActiveWhTab(3)}
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
                  onSelectSegment={handleSelectSegmentDrilldown}
                />
              )}

              {activeWhTab === 5 && (
                <WarehouseSuppliers
                  warehouseCostData={warehouseCostData}
                  onSelectSupplier={handleSelectSupplierDrilldown}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* ================= MODALS ================= */}

      {/* Vehicle Card Modal */}
      <VehicleCardModal
        isOpen={!!vehicleModalReg}
        onClose={() => setVehicleModalReg(null)}
        reg={vehicleModalReg || ""}
        masterFleet={masterFleet}
        costData={costData}
      />

      {/* New Cost Entry Modal */}
      <NewCostModal
        isOpen={isNewCostOpen}
        onClose={() => setIsNewCostOpen(false)}
        masterFleet={masterFleet}
        onSaveCost={addCostRecord}
        activeUser={activeUser}
      />

      {/* New Vehicle Procurement Modal */}
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

      {/* Dynamic Roles Editor Modal */}
      <EditRoleModal
        isOpen={!!editingRole}
        onClose={() => setEditingRole(null)}
        role={editingRole}
        onSaveRole={saveRoleToFirestore}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onSaveUser={saveUserToFirestore}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        user={activeUser}
        onSaveUser={saveUserToFirestore}
      />
    </div>
  );
}
