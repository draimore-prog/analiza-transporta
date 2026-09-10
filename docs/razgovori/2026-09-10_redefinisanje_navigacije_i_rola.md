# Zapisnik i Odluke: Redefinisanje Navigacije i Korisničkih Uloga

**Datum:** 10. septembar 2026.  
**Projekat:** Logistika - Servis motornih vozila (`analiza-transporta-master`)  
**Produkcija:** [https://analiza-transporta-flota.web.app](https://analiza-transporta-flota.web.app)

---

## 1. Zahtjev Korisnika
1. Grupisati sve stranice na kojima se nalazi analiza u kategoriju: **Analitika** (`analitika`).
2. Grupisati sve stranice na kojima su unosi matičnih podataka u kategoriju: **Baza podataka** (`baza-podataka`).
3. Ujediniti sve stranice iz prethodno odvojenog portala skladišne mehanizacije u jedinstvenu kategoriju: **Skladišna mehanizacija** (`skladisna-mehanizacija`).
4. Uskladiti permisije i definicije korisničkih uloga (`superadmin`, `warehouse_specialist`, `editor`, `viewer`, `mobile_serviser`, `serviser`) sa novim kategorijama.

---

## 2. Nova Struktura Navigacije (`APP_NAV_SECTIONS`)

### A. Analitika (`analitika`) - 📊
- **KPI Pregled Flote** (`kpi-pregled`) -> `<TransportKpis ... />`
- **Analiza Održavanja** (`analiza-odrzavanja`) -> `<MaintenanceAnalysis ... />`
- **YoY Komparacija** (`yoy-komparacija`) -> `<YoYComparison ... />`
- **TCO & Zamjena** (`tco-zamjena`) -> `<TcoCalculator ... />`

### B. Baza podataka (`baza-podataka`) - 🗄️
- **Matična Baza Flote** (`maticna-baza-flote`) -> `<MasterFleetTable ... />`
- **Tabela Servisa** (`tabela-servisa`) -> `<ServiceTable ... />`

### C. Skladišna mehanizacija (`skladisna-mehanizacija`) - 🚜
- **Analitika & Finansije** (`skladiste-analitika`) -> `<WarehouseKpis ... />`
- **Šifrarnik Flote** (`skladiste-sifrarnik`) -> `<WarehouseFleet ... />`
- **Pregled Svih Opravki** (`skladiste-opravke`) -> `<WarehouseRepairs ... />`
- **Segmenti & Dijelovi** (`skladiste-segmenti`) -> `<WarehouseSegments ... />`
- **Serviseri & Dobavljači** (`skladiste-dobavljaci`) -> `<WarehouseSuppliers ... />`
- **Radni Nalozi** (`skladiste-nalozi`) -> `<WarehouseWorkOrders ... />`

### D. Servisna radionica (`serviser`) - 🔧
- **Servisna Radionica** (`servisna-radionica`) -> `<ServiserDashboard ... />` (sa povratkom na analitiku)

---

## 3. Tehničke Izmjene
1. `src/lib/constants.js`:
   - Definisan centralni `APP_NAV_SECTIONS` sa čistim ikonama, opisima i slugovima.
   - Ažurirane `DEFAULT_APP_ROLES` uloge sa novim ID-jevima stranica.
2. `src/components/modals/EditRoleModal.jsx`:
   - Grupisani check-boxi za permisije panela po 4 kategorije (`Analitika`, `Baza podataka`, `Skladišna mehanizacija`, `Servisna radionica`).
3. `src/components/layout/Sidebar.jsx`:
   - Čista render logika po sekcijama uz automatsko filtriranje na bazi permisija korisničke uloge.
   - Badge za verifikaciju radnih naloga direktno uz stavku "Radni Nalozi".
4. `src/components/layout/Header.jsx`:
   - Uklonjen stari toggle portala, dodat dinamički kategorijski breadcrumb (`Kategorija / Stranica`).
   - Dodato dugme "+ Novo Vozilo" uz postojeće "+ Unos Troška".
5. `src/app/page.jsx`:
   - Ukinuta trostruka stanja (`portalMode`, `activeTab`, `activeWhTab`), uvedeno jedinstveno stanje `activePage` sa funkcijom `navigateToPage(pageId)`.
   - Zadržano keširanje posjećenih warehouse stranica (`visitedWhPages`) radi trenutnog prebacivanja bez re-render lagova.
   - Puna kompatibilnost sa starim URL parametrima (`?portal=warehouse&stranica=...`, `?tab=4`, itd.).
