# Zapisnik: Gramatičko ispravljanje naslova u sentence case

**Datum:** 11. septembar 2026.  
**Korisnički zahtjev:**  
"e sad jedna vizuelna izmjena, s obzirom da imamo veliki broj naslova od više riječi, trenutno nam u toj većini naslova i pod naslova stoji veliko slovo za svaku riječ, pa jel to možeš gramatički ispraviti jedan primjer je Interaktivni Analitički Grafikoni i sl"

---

### Sažetak izvršenih izmjena

U skladu sa pravopisnim standardima našeg jezika, izvršena je konverzija engleskog "Title Case" stila (gdje svaka riječ počinje velikim slovom) u pravilan rečenični format (**sentence case** - samo prvo slovo fraze veliko), uz dosljedno zadržavanje svih akronima (npr. KPI, TCO, YoY, KM, VIN, GB, MTH, PJ) i vlastitih imena.

#### Obuhvaćeni moduli i komponente (21 datoteka):
1. `src/lib/constants.js`:
   - Sekcije navigacije: *"KPI pregled flote"*, *"Baza podataka"*, *"Skladišna mehanizacija"*, *"Tabela servisa i troškova"*, *"Radni nalozi"*.
2. `src/components/layout/Header.jsx`:
   - Brze akcije: *"Novo vozilo"*, *"Unos troška"*, *"Radni nalozi sa terena"*.
3. `src/components/transport/TransportKpis.jsx`:
   - Naslovi grafikona i kartica: *"Interaktivni analitički grafikoni"*, *"Mjesečna dinamika troškova"*, *"Interno vs eksterno održavanje"*, *"Top 10 vozila po trošku"*, *"Trošak po segmentima"*, *"Interni troškovi po godinama"*, *"Top dobavljači i serviseri"*.
4. `src/components/transport/MaintenanceAnalysis.jsx`:
   - Sekcije i tabele: *"Prosječan trošak po jedinici (vozilu)"*, *"Samo servisirana vozila"*, *"Dugoročni KPI (pregled trendova kroz godine 2021 - 2026)"*.
5. `src/components/transport/YoYComparison.jsx`:
   - Analitički naslovi: *"YoY komparativna analiza i mjesečni KPI"*, *"1. Komparacija po tipu mehanizacije"*, itd.
6. `src/components/transport/TcoCalculator.jsx`:
   - Zaglavlja kalkulatora: *"TCO i kalkulator isplativosti zamjene vozila"*, *"Rang lista rentabilnosti flote (kandidati za zamjenu)"*, kolone tabele: *"Vozilo / registracija"*, *"Garažni br."*, *"Marka i model"*, *"Godište / starost"*, *"TCO indeks rizika"*.
7. `src/components/transport/MasterFleetTable.jsx`:
   - Dugmad i kolone: *"Dodaj novo vozilo"*, *"Izvezi šifrarnik"*, *"Garažni br."*, *"Reg. oznaka"*, *"Tip mehanizacije"*, *"Broj šasije (VIN)"*.
8. `src/components/transport/ServiceTable.jsx`:
   - Naslov i kolone: *"📋 Tabela servisa i radnih naloga"*, *"Garažni br."*, *"Tip mehanizacije"*, *"Opis popravke"*, *"Serviser / dobavljač"*, *"Broj fakture"*, *"Interno / eksterno"*.
9. `src/components/modals/VehicleCardModal.jsx`:
   - Karton vozila: *"Tip / kategorija mehanizacije"*, *"Ukupno uloženo u održavanje"*, *"Broj evidentiranih servisa"*, *"Broj šasije (VIN)"*, *"Foto galerija vozila"*, *"Hronološki pregled svih servisa i računa"*.
10. `src/components/modals/NewCostModal.jsx`:
    - Forma unosa troška: *"Unos novog troška / servisnog naloga"*, koraci i labele polja (*"1. Osnovni podaci o vozilu / mehanizaciji"*, *"2. Detalji servisa i fakture"*, *"3. Kategorizacija i vrsta troška"*, *"4. Finansijski obračun (automatski total)"*, polja: *"Garažni broj (MT)"*, *"Radni sati na datum servisa (h)"*, *"Cijena rezervnog dijela (KM)"*, *"Total trošak (KM sa PDV)"*, itd.).
11. `src/components/modals/EditVehicleModal.jsx`:
    - Forma vozila: *"Fotografije vozila (maksimalno 10 slika)"*, *"Registarska oznaka"*, *"Garažni broj"*, *"Broj šasije (VIN)"*, *"Sačuvaj izmjene"*, *"Sačuvaj novo vozilo"*.
12. `src/components/warehouse/WarehouseKpis.jsx`:
    - KPI i grafikoni skladišta: *"Ukupan utrošak"*, *"Aktivne mašine"*, *"Broj opravki"*, *"Vlastita radionica"*, *"Vanjski servisi"*, *"Prosjek po opravci"*, *"Vlastita radionica vs eksterni"*, *"Višegodišnji pregled troškova i broja mehanizacije (2021 - 2026)"*.
13. `src/components/warehouse/WarehouseFleet.jsx`:
    - Naslov i kolone: *"Šifrarnik skladišne mehanizacije"*, *"Izvoz šifrarnika (Excel)"*, *"Garažni br."*, *"Interna oznaka / reg."*, *"Model / tip"*, *"Broj šasije"*.
14. `src/components/warehouse/WarehouseRepairs.jsx`:
    - Pregled opravki: *"📋 Pregled opravki skladišne mehanizacije"*, kolone tabele.
15. `src/components/warehouse/WarehouseSegments.jsx`:
    - Sekcija: *"Raspodjela troškova po segmentima skladišta"*.
16. `src/components/warehouse/WarehouseSuppliers.jsx`:
    - Sekcija: *"Partneri i serviseri skladišne mehanizacije"*.
17. `src/components/warehouse/WarehouseWorkOrders.jsx`:
    - Radni nalozi: *"Radni nalozi i preventivni pregledi mehanizacije"*, *"Novi radni nalog"*, kartice i kolone.
18. `src/components/warehouse/CreateWorkOrderModal.jsx`:
    - Modal dodjele: *"Kreiraj i dodijeli radni nalog"*, koraci i uputstva.
19. `src/components/warehouse/WorkOrderDetailModal.jsx`:
    - Detalji naloga: *"Kontrolna lista preventivnog pregleda (8 sklopova)"*, *"Opis izvršenih radova"*, *"Utrošeni materijal i dijelovi"*, *"Fotodokumentacija sa terena (5 pozicija)"*.
20. `src/components/serviser/ServiserDashboard.jsx`:
    - Portal servisera: *"Karton vozila i servisna historija održavanja"*, *"Servisna radionica i kartoteka"*, *"Terenski nalozi"*, *"Glavna aplikacija"*.
21. `src/components/serviser/FieldWorkOrderForm.jsx`:
    - Terenska forma: *"Novi terenski radni nalog"*, *"Redovni pregled"*, *"Kvar / popravka"*, *"Radni sati sa table (MTH)"*, *"Kontrolna ček-lista (8 sklopova)"*.

---

### Verifikacija i Deployment
- **Build test:** `npm run build` uspješno kompajliran bez ijedne greške.
- **Verzionisanje:** Sve izmjene komitovane i poslane na GitHub `origin/master`.
- **Hosting:** Aplikacija deployana na Firebase Hosting (`https://analiza-transporta-flota.web.app`).
