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
      { id: "servisna-radionica", name: "Serviserski Portal / Terenski Unos", icon: "🛠️", category: "serviser" }
    ]
  }
];

export const DEFAULT_APP_ROLES = {
  superadmin: {
    roleId: 'superadmin',
    roleName: 'Super Administrator',
    roleIcon: '👑',
    roleBadge: '👑 Super Administrator',
    description: 'Pun pristup svim modulima, unosu, brisanju, uređivanju, upravljanju nalozima i podešavanju rola.',
    defaultPage: 'kpi-pregled',
    navigationPanels: [
      { id: 'kpi-pregled', name: 'KPI Pregled Flote', category: 'analitika', icon: '📊' },
      { id: 'analiza-odrzavanja', name: 'Analiza Održavanja', category: 'analitika', icon: '📈' },
      { id: 'yoy-komparacija', name: 'YoY Komparacija', category: 'analitika', icon: '⚖️' },
      { id: 'tco-zamjena', name: 'TCO & Zamjena Vozila', category: 'analitika', icon: '🔄' },
      { id: 'maticna-baza-flote', name: 'Matična Baza Voznog Parka', category: 'baza-podataka', icon: '🏢' },
      { id: 'tabela-servisa', name: 'Tabela Servisa & Troškova', category: 'baza-podataka', icon: '📋' },
      { id: 'skladiste-analitika', name: 'Analitika & Finansije Skladišta', category: 'skladisna-mehanizacija', icon: '📊' },
      { id: 'skladiste-sifrarnik', name: 'Šifrarnik Mehanizacije (594)', category: 'skladisna-mehanizacija', icon: '🚜' },
      { id: 'skladiste-opravke', name: 'Pregled Svih Opravki', category: 'skladisna-mehanizacija', icon: '🔧' },
      { id: 'skladiste-segmenti', name: 'Segmenti & Dijelovi', category: 'skladisna-mehanizacija', icon: '⚡' },
      { id: 'skladiste-dobavljaci', name: 'Serviseri & Dobavljači', category: 'skladisna-mehanizacija', icon: '🏢' },
      { id: 'skladiste-nalozi', name: 'Radni Nalozi & Pregledi', category: 'skladisna-mehanizacija', icon: '📋' },
      { id: 'servisna-radionica', name: 'Serviserski Portal / Terenski Unos', category: 'serviser', icon: '🛠️' }
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
    description: 'Namjenski pristup kategoriji Skladišna mehanizacija (radni nalozi, pregled opravki, dijelovi, serviseri i šifrarnik).',
    defaultPage: 'skladiste-analitika',
    navigationPanels: [
      { id: 'skladiste-analitika', name: 'Analitika & Finansije Skladišta', category: 'skladisna-mehanizacija', icon: '📊' },
      { id: 'skladiste-sifrarnik', name: 'Šifrarnik Mehanizacije (594)', category: 'skladisna-mehanizacija', icon: '🚜' },
      { id: 'skladiste-opravke', name: 'Pregled Svih Opravki', category: 'skladisna-mehanizacija', icon: '🔧' },
      { id: 'skladiste-segmenti', name: 'Segmenti & Dijelovi', category: 'skladisna-mehanizacija', icon: '⚡' },
      { id: 'skladiste-dobavljaci', name: 'Serviseri & Dobavljači', category: 'skladisna-mehanizacija', icon: '🏢' },
      { id: 'skladiste-nalozi', name: 'Radni Nalozi & Pregledi', category: 'skladisna-mehanizacija', icon: '📋' }
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
    roleName: 'Administrator (Unos podataka i faktura)',
    roleIcon: '✍️',
    roleBadge: '✍️ Admin (Unos podataka)',
    description: 'Mogućnost unosa novih faktura, uvoza Excel evidencija i registracije novih vozila i mehanizacije.',
    defaultPage: 'maticna-baza-flote',
    navigationPanels: [
      { id: 'kpi-pregled', name: 'KPI Pregled Flote', category: 'analitika', icon: '📊' },
      { id: 'analiza-odrzavanja', name: 'Analiza Održavanja', category: 'analitika', icon: '📈' },
      { id: 'maticna-baza-flote', name: 'Matična Baza Voznog Parka', category: 'baza-podataka', icon: '🏢' },
      { id: 'tabela-servisa', name: 'Tabela Servisa & Troškova', category: 'baza-podataka', icon: '📋' }
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
    description: 'Pristup analitici i bazama podataka u režimu samo za čitanje i analizu (bez mogućnosti unosa i brisanja).',
    defaultPage: 'kpi-pregled',
    navigationPanels: [
      { id: 'kpi-pregled', name: 'KPI Pregled Flote', category: 'analitika', icon: '📊' },
      { id: 'analiza-odrzavanja', name: 'Analiza Održavanja', category: 'analitika', icon: '📈' },
      { id: 'yoy-komparacija', name: 'YoY Komparacija', category: 'analitika', icon: '⚖️' },
      { id: 'tco-zamjena', name: 'TCO & Zamjena Vozila', category: 'analitika', icon: '🔄' },
      { id: 'maticna-baza-flote', name: 'Matična Baza Voznog Parka', category: 'baza-podataka', icon: '🏢' },
      { id: 'tabela-servisa', name: 'Tabela Servisa & Troškova', category: 'baza-podataka', icon: '📋' },
      { id: 'skladiste-analitika', name: 'Analitika & Finansije Skladišta', category: 'skladisna-mehanizacija', icon: '📊' }
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
  mobile_serviser: {
    roleId: 'mobile_serviser',
    roleName: 'Terenski Serviser (Mobilna Aplikacija)',
    roleIcon: '📱',
    roleBadge: '📱 Terenski Serviser (Mobile App)',
    description: 'Namjenski pristup radnim nalozima, preventivnim pregledima, ček-listama, radnim satima (MTH) i fotografisanju jedinica.',
    defaultPage: 'servisna-radionica',
    navigationPanels: [
      { id: 'servisna-radionica', name: 'Serviserski Portal / Terenski Unos', category: 'serviser', icon: '🛠️' },
      { id: 'skladiste-nalozi', name: 'Radni Nalozi & Pregledi', category: 'skladisna-mehanizacija', icon: '📋' }
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
  },
  serviser: {
    roleId: 'serviser',
    roleName: 'Serviser (Radionica & Mehanizacija)',
    roleIcon: '🔧',
    roleBadge: '🔧 Serviser',
    description: 'Pristup servisnoj radionici, prijemu radnih naloga i kartonu mehanizacije.',
    defaultPage: 'servisna-radionica',
    navigationPanels: [
      { id: 'servisna-radionica', name: 'Serviserski Portal / Terenski Unos', category: 'serviser', icon: '🛠️' },
      { id: 'skladiste-nalozi', name: 'Radni Nalozi & Pregledi', category: 'skladisna-mehanizacija', icon: '📋' }
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
