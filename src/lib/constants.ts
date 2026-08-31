import { AppRole } from "@/types/roles";

export const MASTER_CACHE_KEY = 'fleet_master_v13_all_statuses';
export const DATASET_CACHE_KEY = 'fleet_dataset_v12_2026_indexed';
export const SESSION_ACTIVE_USER_KEY = 'analiza_transporta_active_user';

export const LOCKED_2026_BASELINE = {
  radna: 8,
  putnicka: 119,
  prikljucna: 51,
  teretna: 166,
  skladisna: 594,
  total: 938
};

export const DEFAULT_APP_ROLES: Record<string, AppRole> = {
  superadmin: {
    roleId: 'superadmin',
    roleName: 'Super Administrator',
    roleIcon: '👑',
    roleBadge: '👑 Super Administrator',
    description: 'Pun pristup svim modulima, unosu, brisanju, uređivanju, upravljanju nalozima i podešavanju rola.',
    defaultPortal: 'transport',
    allowedPortals: ['transport', 'warehouse', 'serviser'],
    navigationPanels: [
      { id: 'tab1', name: 'Pregled Flote & KPI', portal: 'transport', icon: '📊', tabId: 1 },
      { id: 'tab2', name: 'Analiza Održavanja', portal: 'transport', icon: '📈', tabId: 2 },
      { id: 'tab3', name: 'YoY Komparacija', portal: 'transport', icon: '🔄', tabId: 3 },
      { id: 'tab4', name: 'Tabela Servisa', portal: 'transport', icon: '🔧', tabId: 4 },
      { id: 'tab5', name: 'Matična baza podataka', portal: 'transport', icon: '🚛', tabId: 5 },
      { id: 'wh1', name: 'Analitika & Finansije', portal: 'warehouse', icon: '📊', tabId: 1 },
      { id: 'wh2', name: 'Šifrarnik Flote (594)', portal: 'warehouse', icon: '🚜', tabId: 2 },
      { id: 'wh3', name: 'Pregled Svih Opravki', portal: 'warehouse', icon: '🔧', tabId: 3 },
      { id: 'wh4', name: 'Segmenti & Dijelovi', portal: 'warehouse', icon: '⚡', tabId: 4 },
      { id: 'wh5', name: 'Serviseri & Dobavljači', portal: 'warehouse', icon: '🏢', tabId: 5 },
      { id: 'serviserSearch', name: 'Karton Vozila / Pretraga', portal: 'serviser', icon: '🔍', tabId: 1 }
    ],
    permissions: {
      canUploadExcel: true,
      canInputCost: true,
      canRegisterVehicle: true,
      canAccessAdminPanel: true,
      canSwitchPortal: true,
      canExportExcel: true,
      canEditCost: true,
      canDeleteCost: true
    }
  },
  warehouse_specialist: {
    roleId: 'warehouse_specialist',
    roleName: 'Specijalist skladišne mehanizacije',
    roleIcon: '🏗️',
    roleBadge: '🏗️ Specijalist skladišne mehanizacije',
    description: 'Namjenski pristup ogranku skladišne mehanizacije (viljuškari, paletari, baterije, servisi i šifrarnik mehanizacije).',
    defaultPortal: 'warehouse',
    allowedPortals: ['warehouse'],
    navigationPanels: [
      { id: 'wh1', name: 'Analitika & Finansije', portal: 'warehouse', icon: '📊', tabId: 1 },
      { id: 'wh2', name: 'Šifrarnik Flote (594)', portal: 'warehouse', icon: '🚜', tabId: 2 },
      { id: 'wh3', name: 'Pregled Svih Opravki', portal: 'warehouse', icon: '🔧', tabId: 3 },
      { id: 'wh4', name: 'Segmenti & Dijelovi', portal: 'warehouse', icon: '⚡', tabId: 4 },
      { id: 'wh5', name: 'Serviseri & Dobavljači', portal: 'warehouse', icon: '🏢', tabId: 5 }
    ],
    permissions: {
      canUploadExcel: false,
      canInputCost: true,
      canRegisterVehicle: true,
      canAccessAdminPanel: false,
      canSwitchPortal: false,
      canExportExcel: true,
      canEditCost: true,
      canDeleteCost: true
    }
  },
  editor: {
    roleId: 'editor',
    roleName: 'Administrator (Unos troškova)',
    roleIcon: '✍️',
    roleBadge: '✍️ Admin (Unos faktura)',
    description: 'Mogućnost unosa novih faktura, uvoza Excel evidencija i registracije novih nabavki vozila.',
    defaultPortal: 'transport',
    allowedPortals: ['transport'],
    navigationPanels: [
      { id: 'tab1', name: 'Pregled Flote & KPI', portal: 'transport', icon: '📊', tabId: 1 },
      { id: 'tab2', name: 'Analiza Održavanja', portal: 'transport', icon: '📈', tabId: 2 },
      { id: 'tab3', name: 'YoY Komparacija', portal: 'transport', icon: '🔄', tabId: 3 },
      { id: 'tab4', name: 'Tabela Servisa', portal: 'transport', icon: '🔧', tabId: 4 },
      { id: 'tab5', name: 'Matična baza podataka', portal: 'transport', icon: '🚛', tabId: 5 }
    ],
    permissions: {
      canUploadExcel: true,
      canInputCost: true,
      canRegisterVehicle: true,
      canAccessAdminPanel: false,
      canSwitchPortal: false,
      canExportExcel: true,
      canEditCost: true,
      canDeleteCost: true
    }
  },
  viewer: {
    roleId: 'viewer',
    roleName: 'Analitičar (Samo pregled)',
    roleIcon: '📊',
    roleBadge: '📊 Analitičar (Samo pregled)',
    description: 'Pristup Glavnom Transportnom portalu u režimu samo za čitanje i analizu (bez mogućnosti unosa i brisanja).',
    defaultPortal: 'transport',
    allowedPortals: ['transport'],
    navigationPanels: [
      { id: 'tab1', name: 'Pregled Flote & KPI', portal: 'transport', icon: '📊', tabId: 1 },
      { id: 'tab2', name: 'Analiza Održavanja', portal: 'transport', icon: '📈', tabId: 2 },
      { id: 'tab3', name: 'YoY Komparacija', portal: 'transport', icon: '🔄', tabId: 3 },
      { id: 'tab4', name: 'Tabela Servisa', portal: 'transport', icon: '🔧', tabId: 4 },
      { id: 'tab5', name: 'Matična baza podataka', portal: 'transport', icon: '🚛', tabId: 5 }
    ],
    permissions: {
      canUploadExcel: false,
      canInputCost: false,
      canRegisterVehicle: false,
      canAccessAdminPanel: false,
      canSwitchPortal: false,
      canExportExcel: true,
      canEditCost: false,
      canDeleteCost: false
    }
  },
  serviser: {
    roleId: 'serviser',
    roleName: 'Serviser (Karton vozila)',
    roleIcon: '🔧',
    roleBadge: '🔧 Serviser',
    description: 'Namjenski pristup isključivo pretrazi kartona i servisne historije pojedinačnih motornih vozila.',
    defaultPortal: 'serviser',
    allowedPortals: ['serviser'],
    navigationPanels: [
      { id: 'serviserSearch', name: 'Karton Vozila / Pretraga', portal: 'serviser', icon: '🔍', tabId: 1 }
    ],
    permissions: {
      canUploadExcel: false,
      canInputCost: false,
      canRegisterVehicle: false,
      canAccessAdminPanel: false,
      canSwitchPortal: false,
      canExportExcel: false,
      canEditCost: false,
      canDeleteCost: false
    }
  }
};
