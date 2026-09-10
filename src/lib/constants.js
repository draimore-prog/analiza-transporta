export const MASTER_CACHE_KEY = 'fleet_master_v16_full_fleet_safe';
export const DATASET_CACHE_KEY = 'fleet_dataset_v18_no_workmachine_hours';
export const SESSION_ACTIVE_USER_KEY = 'analiza_transporta_active_user';

export const LOCKED_2026_BASELINE = {
  radna: 8,
  putnicka: 119,
  prikljucna: 51,
  teretna: 166,
  skladisna: 594,
  total: 938
};

export const APP_NAV_SECTIONS = [
  {
    id: "analitika",
    title: "Analitika",
    icon: "📊",
    items: [
      { id: "kpi-pregled", name: "KPI Pregled Flote", icon: "📊", category: "analitika" },
      { id: "analiza-odrzavanja", name: "Analiza Održavanja", icon: "📈", category: "analitika" },
      { id: "yoy-komparacija", name: "YoY Komparacija", icon: "⚖️", category: "analitika" },
      { id: "tco-zamjena", name: "TCO & Zamjena Vozila", icon: "🔄", category: "analitika" }
    ]
  },
  {
    id: "baza-podataka",
    title: "Baza Podataka",
    icon: "🗄️",
    items: [
      { id: "maticna-baza-flote", name: "Matična Baza Voznog Parka", icon: "🏢", category: "baza-podataka" },
      { id: "tabela-servisa", name: "Tabela Servisa & Troškova", icon: "📋", category: "baza-podataka" }
    ]
  },
  {
    id: "skladisna-mehanizacija",
    title: "Skladišna Mehanizacija",
    icon: "🚜",
    items: [
      { id: "skladiste-analitika", name: "Analitika & Finansije Skladišta", icon: "📊", category: "skladisna-mehanizacija" },
      { id: "skladiste-sifrarnik", name: "Šifrarnik Mehanizacije (594)", icon: "🚜", category: "skladisna-mehanizacija" },
      { id: "skladiste-opravke", name: "Pregled Svih Opravki", icon: "🔧", category: "skladisna-mehanizacija" },
      { id: "skladiste-segmenti", name: "Segmenti & Dijelovi", icon: "⚡", category: "skladisna-mehanizacija" },
      { id: "skladiste-dobavljaci", name: "Serviseri & Dobavljači", icon: "🏢", category: "skladisna-mehanizacija" },
      { id: "skladiste-nalozi", name: "Radni Nalozi & Pregledi", icon: "📋", category: "skladisna-mehanizacija", hasBadge: true }
    ]
  },
  {
    id: "serviser",
    title: "Servisna Radionica",
    icon: "🔧",
    items: [
      { id: "servisna-radionica", name: "Serviserski Portal", icon: "🔍", category: "serviser" },
      { id: "terenski-nalozi", name: "Terenski Radni Nalozi", icon: "📱", category: "serviser", hasBadge: true }
    ]
  }
];

export const EDITABLE_PAGE_IDS = [
  "maticna-baza-flote",
  "tabela-servisa",
  "skladiste-sifrarnik",
  "skladiste-opravke",
  "skladiste-nalozi",
  "servisna-radionica",
  "terenski-nalozi"
];

export const isEditablePage = (pageId) => EDITABLE_PAGE_IDS.includes(pageId);

export function getRolePagePermission(role, pageId) {
  if (!role) return false;
  if (role.roleId === "superadmin") {
    return isEditablePage(pageId) ? "edit" : true;
  }

  if (role.pagePermissions && role.pagePermissions[pageId] !== undefined) {
    const val = role.pagePermissions[pageId];
    if (!isEditablePage(pageId)) {
      return Boolean(val && val !== "none");
    }
    return val;
  }

  // Kompatibilnost za postojeće uloge u Firestore bazi
  if (Array.isArray(role.navigationPanels)) {
    const hasPanel = role.navigationPanels.some((p) => (p.id || p) === pageId);
    if (!hasPanel) {
      return isEditablePage(pageId) ? "none" : false;
    }
    if (!isEditablePage(pageId)) {
      return true;
    }
    if (pageId === "maticna-baza-flote") {
      return role.permissions?.canRegisterVehicle ? "edit" : "view";
    }
    if (pageId === "tabela-servisa") {
      return (role.permissions?.canInputCost || role.permissions?.canEditCost) ? "edit" : "view";
    }
    if (pageId === "skladiste-sifrarnik") {
      return (role.permissions?.canRegisterVehicle || role.roleId === "warehouse_specialist") ? "edit" : "view";
    }
    if (pageId === "skladiste-opravke") {
      return role.permissions?.canDeleteCost ? "edit" : "view";
    }
    if (pageId === "skladiste-nalozi") {
      return (role.permissions?.canInputCost || role.roleId === "warehouse_specialist" || role.roleId === "serviser") ? "edit" : "view";
    }
    if (pageId === "servisna-radionica" || pageId === "terenski-nalozi") {
      return "edit";
    }
    return "view";
  }

  return isEditablePage(pageId) ? "none" : false;
}

export function hasPageAccess(role, pageId) {
  const perm = getRolePagePermission(role, pageId);
  return perm === true || perm === "view" || perm === "edit";
}

export function canEditPage(role, pageId) {
  const perm = getRolePagePermission(role, pageId);
  return perm === "edit" || (perm === true && role?.roleId === "superadmin");
}

export const DEFAULT_APP_ROLES = {
  superadmin: {
    roleId: "superadmin",
    roleName: "Super Administrator",
    roleIcon: "👑",
    roleBadge: "👑 Super Administrator",
    description: "Pun pristup svim modulima, unosu, brisanju, uređivanju, upravljanju nalozima i podešavanju rola.",
    defaultPage: "kpi-pregled",
    pagePermissions: {
      "kpi-pregled": true,
      "analiza-odrzavanja": true,
      "yoy-komparacija": true,
      "tco-zamjena": true,
      "maticna-baza-flote": "edit",
      "tabela-servisa": "edit",
      "skladiste-analitika": true,
      "skladiste-sifrarnik": "edit",
      "skladiste-opravke": "edit",
      "skladiste-segmenti": true,
      "skladiste-dobavljaci": true,
      "skladiste-nalozi": "edit",
      "servisna-radionica": "edit",
      "terenski-nalozi": "edit"
    },
    navigationPanels: [
      { id: "kpi-pregled", name: "KPI Pregled Flote", category: "analitika", icon: "📊" },
      { id: "analiza-odrzavanja", name: "Analiza Održavanja", category: "analitika", icon: "📈" },
      { id: "yoy-komparacija", name: "YoY Komparacija", category: "analitika", icon: "⚖️" },
      { id: "tco-zamjena", name: "TCO & Zamjena Vozila", category: "analitika", icon: "🔄" },
      { id: "maticna-baza-flote", name: "Matična Baza Voznog Parka", category: "baza-podataka", icon: "🏢" },
      { id: "tabela-servisa", name: "Tabela Servisa & Troškova", category: "baza-podataka", icon: "📋" },
      { id: "skladiste-analitika", name: "Analitika & Finansije Skladišta", category: "skladisna-mehanizacija", icon: "📊" },
      { id: "skladiste-sifrarnik", name: "Šifrarnik Mehanizacije (594)", category: "skladisna-mehanizacija", icon: "🚜" },
      { id: "skladiste-opravke", name: "Pregled Svih Opravki", category: "skladisna-mehanizacija", icon: "🔧" },
      { id: "skladiste-segmenti", name: "Segmenti & Dijelovi", category: "skladisna-mehanizacija", icon: "⚡" },
      { id: "skladiste-dobavljaci", name: "Serviseri & Dobavljači", category: "skladisna-mehanizacija", icon: "🏢" },
      { id: "skladiste-nalozi", name: "Radni Nalozi & Pregledi", category: "skladisna-mehanizacija", icon: "📋" },
      { id: "servisna-radionica", name: "Serviserski Portal", category: "serviser", icon: "🔍" },
      { id: "terenski-nalozi", name: "Terenski Radni Nalozi", category: "serviser", icon: "📱" }
    ],
    permissions: {
      canUploadExcel: true,
      canInputCost: true,
      canRegisterVehicle: true,
      canAccessAdminPanel: true,
      canExportExcel: true,
      canEditCost: true,
      canDeleteCost: true
    }
  },
  warehouse_specialist: {
    roleId: "warehouse_specialist",
    roleName: "Specijalist skladišne mehanizacije",
    roleIcon: "🏗️",
    roleBadge: "🏗️ Specijalist skladišne mehanizacije",
    description: "Namjenski pristup kategoriji Skladišna mehanizacija (radni nalozi, pregled opravki, dijelovi, serviseri i šifrarnik).",
    defaultPage: "skladiste-analitika",
    pagePermissions: {
      "kpi-pregled": false,
      "analiza-odrzavanja": false,
      "yoy-komparacija": false,
      "tco-zamjena": false,
      "maticna-baza-flote": "none",
      "tabela-servisa": "none",
      "skladiste-analitika": true,
      "skladiste-sifrarnik": "edit",
      "skladiste-opravke": "edit",
      "skladiste-segmenti": true,
      "skladiste-dobavljaci": true,
      "skladiste-nalozi": "edit",
      "servisna-radionica": "none",
      "terenski-nalozi": "edit"
    },
    navigationPanels: [
      { id: "skladiste-analitika", name: "Analitika & Finansije Skladišta", category: "skladisna-mehanizacija", icon: "📊" },
      { id: "skladiste-sifrarnik", name: "Šifrarnik Mehanizacije (594)", category: "skladisna-mehanizacija", icon: "🚜" },
      { id: "skladiste-opravke", name: "Pregled Svih Opravki", category: "skladisna-mehanizacija", icon: "🔧" },
      { id: "skladiste-segmenti", name: "Segmenti & Dijelovi", category: "skladisna-mehanizacija", icon: "⚡" },
      { id: "skladiste-dobavljaci", name: "Serviseri & Dobavljači", category: "skladisna-mehanizacija", icon: "🏢" },
      { id: "skladiste-nalozi", name: "Radni Nalozi & Pregledi", category: "skladisna-mehanizacija", icon: "📋" },
      { id: "terenski-nalozi", name: "Terenski Radni Nalozi", category: "serviser", icon: "📱" }
    ],
    permissions: {
      canUploadExcel: false,
      canInputCost: true,
      canRegisterVehicle: true,
      canAccessAdminPanel: false,
      canExportExcel: true,
      canEditCost: true,
      canDeleteCost: true
    }
  },
  editor: {
    roleId: "editor",
    roleName: "Administrator (Unos podataka i faktura)",
    roleIcon: "✍️",
    roleBadge: "✍️ Admin (Unos podataka)",
    description: "Mogućnost unosa novih faktura, uvoza Excel evidencija i registracije novih vozila i mehanizacije.",
    defaultPage: "maticna-baza-flote",
    pagePermissions: {
      "kpi-pregled": true,
      "analiza-odrzavanja": true,
      "yoy-komparacija": false,
      "tco-zamjena": false,
      "maticna-baza-flote": "edit",
      "tabela-servisa": "edit",
      "skladiste-analitika": false,
      "skladiste-sifrarnik": "none",
      "skladiste-opravke": "none",
      "skladiste-segmenti": false,
      "skladiste-dobavljaci": false,
      "skladiste-nalozi": "none",
      "servisna-radionica": "none",
      "terenski-nalozi": "none"
    },
    navigationPanels: [
      { id: "kpi-pregled", name: "KPI Pregled Flote", category: "analitika", icon: "📊" },
      { id: "analiza-odrzavanja", name: "Analiza Održavanja", category: "analitika", icon: "📈" },
      { id: "maticna-baza-flote", name: "Matična Baza Voznog Parka", category: "baza-podataka", icon: "🏢" },
      { id: "tabela-servisa", name: "Tabela Servisa & Troškova", category: "baza-podataka", icon: "📋" }
    ],
    permissions: {
      canUploadExcel: true,
      canInputCost: true,
      canRegisterVehicle: true,
      canAccessAdminPanel: false,
      canExportExcel: true,
      canEditCost: true,
      canDeleteCost: true
    }
  },
  viewer: {
    roleId: "viewer",
    roleName: "Analitičar (Samo pregled)",
    roleIcon: "📊",
    roleBadge: "📊 Analitičar (Samo pregled)",
    description: "Pristup analitici i bazama podataka u režimu samo za čitanje i analizu (bez mogućnosti unosa i brisanja).",
    defaultPage: "kpi-pregled",
    pagePermissions: {
      "kpi-pregled": true,
      "analiza-odrzavanja": true,
      "yoy-komparacija": true,
      "tco-zamjena": true,
      "maticna-baza-flote": "view",
      "tabela-servisa": "view",
      "skladiste-analitika": true,
      "skladiste-sifrarnik": "view",
      "skladiste-opravke": "view",
      "skladiste-segmenti": true,
      "skladiste-dobavljaci": true,
      "skladiste-nalozi": "view",
      "servisna-radionica": "none",
      "terenski-nalozi": "none"
    },
    navigationPanels: [
      { id: "kpi-pregled", name: "KPI Pregled Flote", category: "analitika", icon: "📊" },
      { id: "analiza-odrzavanja", name: "Analiza Održavanja", category: "analitika", icon: "📈" },
      { id: "yoy-komparacija", name: "YoY Komparacija", category: "analitika", icon: "⚖️" },
      { id: "tco-zamjena", name: "TCO & Zamjena Vozila", category: "analitika", icon: "🔄" },
      { id: "maticna-baza-flote", name: "Matična Baza Voznog Parka", category: "baza-podataka", icon: "🏢" },
      { id: "tabela-servisa", name: "Tabela Servisa & Troškova", category: "baza-podataka", icon: "📋" },
      { id: "skladiste-analitika", name: "Analitika & Finansije Skladišta", category: "skladisna-mehanizacija", icon: "📊" },
      { id: "skladiste-sifrarnik", name: "Šifrarnik Mehanizacije (594)", category: "skladisna-mehanizacija", icon: "🚜" },
      { id: "skladiste-opravke", name: "Pregled Svih Opravki", category: "skladisna-mehanizacija", icon: "🔧" },
      { id: "skladiste-segmenti", name: "Segmenti & Dijelovi", category: "skladisna-mehanizacija", icon: "⚡" },
      { id: "skladiste-dobavljaci", name: "Serviseri & Dobavljači", category: "skladisna-mehanizacija", icon: "🏢" },
      { id: "skladiste-nalozi", name: "Radni Nalozi & Pregledi", category: "skladisna-mehanizacija", icon: "📋" }
    ],
    permissions: {
      canUploadExcel: false,
      canInputCost: false,
      canRegisterVehicle: false,
      canAccessAdminPanel: false,
      canExportExcel: true,
      canEditCost: false,
      canDeleteCost: false
    }
  },
  mobile_serviser: {
    roleId: "mobile_serviser",
    roleName: "Terenski Serviser (Mobilna Aplikacija)",
    roleIcon: "📱",
    roleBadge: "📱 Terenski Serviser (Mobile App)",
    description: "Namjenski pristup radnim nalozima, preventivnim pregledima, ček-listama, radnim satima (MTH) i fotografisanju jedinica.",
    defaultPage: "terenski-nalozi",
    pagePermissions: {
      "kpi-pregled": false,
      "analiza-odrzavanja": false,
      "yoy-komparacija": false,
      "tco-zamjena": false,
      "maticna-baza-flote": "none",
      "tabela-servisa": "none",
      "skladiste-analitika": false,
      "skladiste-sifrarnik": "view",
      "skladiste-opravke": "none",
      "skladiste-segmenti": false,
      "skladiste-dobavljaci": false,
      "skladiste-nalozi": "view",
      "servisna-radionica": "view",
      "terenski-nalozi": "edit"
    },
    navigationPanels: [
      { id: "terenski-nalozi", name: "Terenski Radni Nalozi", category: "serviser", icon: "📱" },
      { id: "servisna-radionica", name: "Serviserski Portal", category: "serviser", icon: "🔍" },
      { id: "skladiste-sifrarnik", name: "Šifrarnik Mehanizacije (594)", category: "skladisna-mehanizacija", icon: "🚜" },
      { id: "skladiste-nalozi", name: "Radni Nalozi & Pregledi", category: "skladisna-mehanizacija", icon: "📋" }
    ],
    permissions: {
      canUploadExcel: false,
      canInputCost: false,
      canRegisterVehicle: false,
      canAccessAdminPanel: false,
      canExportExcel: false,
      canEditCost: false,
      canDeleteCost: false
    }
  },
  serviser: {
    roleId: "serviser",
    roleName: "Serviser (Radionica & Mehanizacija)",
    roleIcon: "🔧",
    roleBadge: "🔧 Serviser",
    description: "Pristup servisnoj radionici, prijemu radnih naloga i kartonu mehanizacije.",
    defaultPage: "servisna-radionica",
    pagePermissions: {
      "kpi-pregled": false,
      "analiza-odrzavanja": false,
      "yoy-komparacija": false,
      "tco-zamjena": false,
      "maticna-baza-flote": "none",
      "tabela-servisa": "none",
      "skladiste-analitika": false,
      "skladiste-sifrarnik": "view",
      "skladiste-opravke": "none",
      "skladiste-segmenti": false,
      "skladiste-dobavljaci": false,
      "skladiste-nalozi": "edit",
      "servisna-radionica": "edit",
      "terenski-nalozi": "edit"
    },
    navigationPanels: [
      { id: "servisna-radionica", name: "Serviserski Portal", category: "serviser", icon: "🔍" },
      { id: "terenski-nalozi", name: "Terenski Radni Nalozi", category: "serviser", icon: "📱" },
      { id: "skladiste-sifrarnik", name: "Šifrarnik Mehanizacije (594)", category: "skladisna-mehanizacija", icon: "🚜" },
      { id: "skladiste-nalozi", name: "Radni Nalozi & Pregledi", category: "skladisna-mehanizacija", icon: "📋" }
    ],
    permissions: {
      canUploadExcel: false,
      canInputCost: false,
      canRegisterVehicle: false,
      canAccessAdminPanel: false,
      canExportExcel: false,
      canEditCost: false,
      canDeleteCost: false
    }
  }
};
