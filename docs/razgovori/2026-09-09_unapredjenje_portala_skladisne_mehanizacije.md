# Unapređenje Portala Skladišne Mehanizacije (Izolacija Podataka, Filteri i Klikabilni Grafikoni)

**Datum:** 09.09.2026.  
**Autor:** Antigravity AI  
**Status:** Implementirano, testirano i raspoređeno  

---

## 1. Zahtjev i Kontekst
Korisnik je zatražio doradu portala **Skladišna mehanizacija**:
1. **Izolacija podataka u modalima:** Prilikom odabira kartice segmenta (npr. gume, baterije, točkovi), kartona dobavljača/servisera (npr. Linde, Jungheinrich) ili rekapitulacije internih/eksternih radionica, podaci su se prethodno otvarali sa cjelokupnom flotom (uključujući teretna i putnička vozila). Zahtijevano je da se na skladišnom portalu prikazuju ISKLJUČIVO podaci i troškovi skladišne mehanizacije.
2. **Filteri po godinama i mjesecima:** Omogućiti detaljan odabir godina (2021-2026), mjeseci i načina održavanja (Interno/Eksterno) unutar skladišnog KPI-ja.
3. **Dodavanje novih grafikona i klikabilnost (Clickable Charts):** Proširiti postojeće grafikone na kompletan paket (mjesečni/godišnji trend, interno vs eksterno, top mašine, segmenti, vodeći serviseri), pri čemu svaki grafikon na klik otvara odgovarajući karton, podizvještaj ili filtrira podatke.

---

## 2. Šta je Implementirano

### A. Kontekstualni Troškovi u Modalima (`src/app/page.jsx`)
- Uvedeno prosljeđivanje `costData={portalMode === 'warehouse' ? warehouseCostData : costData}` i `isWarehouseMode={portalMode === 'warehouse'}` za:
  - `SegmentDetailModal` (detalji segmenata)
  - `SupplierDetailModal` (detalji dobavljača i ovlaštenih servisera)
  - `IntExtRecapModal` (rekapitulacija vlastite radionice i vanjskih servisa)
- Uvedeno stanje `selectedWarehouseYear` i povezano sa `WarehouseKpis` i `WarehouseRepairs` (Tab 3).
- Proslijeđeni svi potrebni click-handler prop-ovi u `WarehouseKpis`: `onOpenIntExtRecap`, `onOpenSupplierDetail`, `onOpenSegmentDetail`, `onOpenVehicleModal`, `onOpenFleetTab`.

### B. Sinhronizacija Godine u Tabeli Popravki (`src/components/warehouse/WarehouseRepairs.jsx`)
- Komponenta sada prihvata `selectedYear` i `setSelectedYear` iz roditeljskog stanja, uz fallback na lokalno stanje ukoliko prop nije proslijeđen.
- Klik na godinu ili nalog u KPI pregledu automatski filtrira tabelu svih opravki za traženi period.

### C. Kompletno Preuređen KPI Dashboard Skladišta (`src/components/warehouse/WarehouseKpis.jsx`)
1. **Filter traka:**
   - Filter po godinama: Sve godine (2021-2026), 2026, 2025, 2024, 2023, 2022, 2021.
   - Filter po mjesecima: Svi mjeseci (1-12) ili pojedinačni mjesec.
   - Režim održavanja: Svi servisi, Vanjski partneri (Eksterno), Vlastita radionica (Interno).
   - Indikator aktivnih filtera i dugme za Reset.
2. **6 KPI Kartica:**
   - *Ukupan Utrošak* (dinamički prema filteru)
   - *Aktivne Mašine* (klik vodi na Tab 2 - Šifrarnik mehanizacije)
   - *Broj Opravki* (klik otvara Tab 3 - Tabela popravki)
   - *Vlastita Radionica (Interno)* (iznos i procenat, klik otvara `IntExtRecapModal('Interno')`)
   - *Vanjski Servisi (Eksterno)* (iznos i procenat, klik otvara `IntExtRecapModal('Eksterno')`)
   - *Prosjek po Opravci & Dnevni prosjek po mašini*
3. **5 Interaktivnih i Klikabilnih Grafikona:**
   - **Trend dinamike troškova (Bar):** Prikaz svih godina (2021-2026) ili 12 mjeseci odabrane godine sa podjelom na Interno i Eksterno. Klik na stubac filtrira godinu.
   - **Interno vs Eksterno (Doughnut):** Prikaz udjela vlastite radionice i vanjskih servisa uz % datalabels. Klik otvara `IntExtRecapModal`.
   - **Top 10 Mašina / Viljuškara po Trošku (Horizontal Bar):** Prikaz najskupljih mašina sa garažnim brojem i % udjela u trošku. Klik otvara `VehicleCardModal` (karton viljuškara).
   - **Raspodjela po Segmentima (Doughnut):** Baterije, Točkovi, Hidraulika, Mehanika, Elektronika, Ulja, Redovan servis. Klik otvara `SegmentDetailModal` (filtriran samo na skladište).
   - **Glavni Partneri i Serviseri (Bar):** Linde, Jungheinrich, Still, Unikomerc, Vlastita radionica... Klik otvara `SupplierDetailModal` (filtriran samo na skladište) ili karton interne radionice.
4. **Kartice Top Mašina na dnu:**
   - Interaktivne kartice sa rangom, registracijom, garažnim brojem, markom, modelom i direktnim linkom na karton mašine.

### D. Vizuelni Indikator u Modalima (`SegmentDetailModal.jsx`, `SupplierDetailModal.jsx`, `IntExtRecapModal.jsx`)
- Kada je aktivan skladišni portal, u zaglavlju modala se prikazuje vizuelni bedž:
  `🚜 Skladišna mehanizacija`
  čime se korisniku pruža trenutna potvrda da su statistike i podaci filtrirani isključivo za mehanizaciju.

---

## 3. Verifikacija
- `next build` uspješno završen (`Compiled successfully`).
- Kod je commitovan na Git `origin/master`.
- Aplikacija je raspoređena na Firebase Hosting.
