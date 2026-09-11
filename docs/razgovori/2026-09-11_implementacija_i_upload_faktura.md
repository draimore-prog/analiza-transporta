# Zapisnik: Povezivanje brojeva računa za 30.932 naloga i revizija komponente unosa

- **Datum:** 11. septembar 2026.
- **Projekt:** Analiza Transporta i Skladišne Mehanizacije (`analiza-transporta-flota`)
- **Status:** Implementirano, Verifikovano, Pushovano na Git i Deployed na Firebase Hosting

---

## 1. Rezime Zadatka
Korisnik je uočio da u bazi troškova i servisa za 30.932 naloga na portalu nije bio evidentiran broj računa/fakture (`brojRacuna`), iako su popravke uredno evidentirane.
Zatraženo je:
1. 100% tačno uparivanje svih 30.932 zapisa sa originalnim brojevima računa iz master Excel evidencije (`brracuna`, `Faktura`).
2. Upis brojeva računa u Firestore bazu (`fleet_costs`) i lokalne datasetove (`fleet_data.json`, `public/fleet_data.json`).
3. Provjera i revizija kompletne komponente unosa novog računa/troška (`NewCostModal.jsx`).
4. Prikaz broja računa i mogućnost filtriranja u `ServiceTable.jsx` i `VehicleCardModal.jsx`.
5. Usklađivanje Excel exporta sa novim kolonama `Broj Računa` i `Tip Fakture`.

---

## 2. Rezultati Uparivanja i Upload u Firestore
- **Izvorni Excel:** `C:\Users\emir.durakovic\Desktop\Servisna radiona troškovi\Uređeno\Pregled troškova 26 02.09.2026.xlsx`
- **Obuhvat tabova:** `FINALDATA 2021` do `FINALDATA 2026` (31.388 redova)
- **Kriteriji poklapanja:** Datum, registracija/garažni broj, iznos troška, opis popravke, dobavljač/serviser.
- **Uspješnost poklapanja:** **30.932 / 30.932 (100.00%)**
- **Firestore Batch Upload:** Svih 30.932 dokumenta u kolekciji `fleet_costs` uspješno su ažurirana sa poljima:
  - `brojRacuna`: tačan broj fakture (npr. `1050-255-01441`, `RN-2026/014`, `1074/25` itd.)
  - `fakturaTip`: tip fakture (npr. `Eksterna`, `Interna`, `Externa`, `Fakturisano`)
- **Keš verzija:** `DATASET_CACHE_KEY` podignut na `fleet_dataset_v19_with_invoices`.

---

## 3. Revizija Komponente Unosa Računa (`NewCostModal.jsx`)
Komponenta je detaljno pregledana i testirana:
1. **Unos broja računa:**
   - Polje `brojRacuna` omogućava unos broja fakture ili radnog naloga.
   - Pohranjuje se u objekt sa `.trim()` i fallbackom na `"-"`.
   - Dodano mapiranje `fakturaTip: vrstaFakture` za potpunu konzistentnost sa postojećom bazom.
2. **Kategorizacija & Tip fakture:**
   - Padajući meni `vrstaFakture` ("Kombinovana faktura", "Faktura za rezervne dijelove", "Faktura za rad / uslugu", "Interni radni nalog").
   - Automatski obračun totala: `costPart` + `costService` = `cost`.
3. **Automatsko povezivanje kilometraže / radnih sati:**
   - Za teretna i putnička vozila: dugme `⚡ Poklopi sa točenjem goriva` automatski pronalazi najbliže točenje goriva iz `/fleet_odometer.json` i upisuje tačnu kilometražu.
   - Za skladišnu mehanizaciju: dinamičko polje za radne sate (h).
   - Za priključna vozila i radne mašine: automatski postavlja `null` u skladu sa standardima sistema.
4. **Cloud Prilog (Firebase Storage):**
   - Mogućnost uploada skeniranog računa ili slike (PDF, JPG, PNG) putem `uploadMediaFile(file, "invoices")`.
   - Prilog se trajno vezuje za troškovni unos (`invoiceUrl`, `invoiceName`, `invoiceType`).
5. **Upis u bazu (`useFleetData.js`):**
   - `addCostRecord` upisuje novi zapis u `cost_records` (real-time listener) i istovremeno sinhronizuje u `fleet_costs`.

---

## 4. Prikaz i Filtriranje na Portalu
- **Tabela servisa (`ServiceTable.jsx`):**
  - Dodana kolona `Broj Računa` sa monospace formatiranjem i oznakom tipa fakture.
  - Dodan in-table filter `🔍 Račun...` za trenutno pretraživanje po broju ili tipu računa.
  - Uvezan u `resetAllFilters` i indikator aktivnih filtera.
- **Karton vozila (`VehicleCardModal.jsx`):**
  - Dodana kolona `Broj Računa` u hronološki tabelarni pregled historije popravki vozila.
  - Dodan in-table filter `🔍 Račun...`.
- **Excel Export (`src/lib/exportExcel.js`):**
  - Dodane kolone `"Broj Računa"` i `"Tip Fakture"` prilikom izvoza u Excel.

---

## 5. Build i Deployment
- `npm run build`: Uspješno (0 grešaka).
- Git commit i push na `origin/master`.
- Firebase Hosting: Uspješno raspoređeno na live produkciju (`https://analiza-transporta-flota.web.app`).
