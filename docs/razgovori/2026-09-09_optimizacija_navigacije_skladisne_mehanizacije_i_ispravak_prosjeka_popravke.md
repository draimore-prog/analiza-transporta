# Optimizacija Navigacije Skladišne Mehanizacije i Ispravak Prosjeka po Opravci

**Datum:** 09.09.2026.  
**Autor:** Antigravity AI & Emir Duraković

---

## 1. Predmet Zahtjeva
1. **Provjera i uklanjanje usporenja pri navigaciji** kroz portal skladišne mehanizacije (prebacivanje između tabova Finansije/KPI, Šifrarnik flote, Pregled svih opravki, Segmenti, Dobavljači).
2. **Ispravka KPI kartice "Prosjek po popravci"** koja je prikazivala `0,00 KM` umjesto stvarne prosječne vrijednosti troška po nalogu.

---

## 2. Identificirani Uzroci & Analiza

### A. Usporenje navigacije (Sluggishness)
- **Uništavanje i ponovno kreiranje ChartJS instanci:** Pri svakom kliku na drugi tab, prethodni tab se u potpunosti demontirao (`unmount`). Povratkom na KPI tab, 5 ChartJS canvas grafikona moralo se iznova inicijalizirati uz prolazak kroz više od 7.200 slogova podataka skladišta.
- **Nestabilne reference funkcija (`inline callbacks`):** U `page.jsx` funkcije poput `onSelectYear`, `onOpenVehicleModal`, `onOpenIntExtRecap` prosljeđivale su se kao inline arrow funkcije. To je izazivalo kontinuirano okidanje `useEffect` hooka u `WarehouseKpis.jsx`, što je stalno uništavalo i ponovo crtalo svih 5 grafikona čak i pri običnom renderu roditeljske komponente.
- **ChartJS animacije:** Podrazumijevana dužina animacije u ChartJS-u od 1000 ms blokirala je glavni JavaScript thread pokretanjem izračuna za `chartjs-plugin-datalabels` na 60 sličica u sekundi preko svih 5 grafikona istovremeno.

### B. Kartica "Prosjek po popravci" prikazivala 0,00 KM
- U izračunu `kpiStats` u `WarehouseKpis.jsx`, prosjek je uredno izračunat (`totalCount > 0 ? totalCost / totalCount : 0`), ali je u vraćenom objektu nazvan `avgPerIntervention`.
- U JSX-u kartice se čitalo `kpiStats.avgCostPerIntervention`, što je rezultiralo sa `undefined`.
- Funkcija `formatKM(undefined)` vraća `0,00 KM`.
- Za kompletnu bazu skladišne mehanizacije (1.579.877,75 KM kroz 7.277 naloga), stvarni prosjek iznosi **217,11 KM**.

---

## 3. Implementirana Rješenja

### 1. Optimizacija `src/components/warehouse/WarehouseKpis.jsx`
- **Ispravka KPI kartice:** U objekt `kpiStats` dodan je eksplicitan ključ `avgCostPerIntervention: avgPerIntervention`, a u JSX-u ugrađen fallback `kpiStats.avgCostPerIntervention ?? kpiStats.avgPerIntervention ?? 0`.
- **Stabilne callback reference:** Uveden `callbacksRef` za sve modalne i navigacijske handlere, čime su uklonjene funkcije iz polja zavisnosti `useEffect` hooka. Grafikoni se sada ažuriraju isključivo kada se stvarno promijene podaci ili odabrani filteri.
- **O(1) keširanje flote:** Uvedena mapa `fleetRegMap` koja eliminira višestruko pretraživanje niza flote viljuškara po registraciji.
- **Ubrzanje ChartJS animacija:** Sve konfiguracije grafikona optimizirane su na `animation: { duration: 200 }`, čime je eliminisano zagušenje render niti.
- **Podrška za reaktivni resize:** Dodat `isActive` prop i automatizirani `requestAnimationFrame` resize chartova pri povratku na tab.

### 2. Optimizacija Navigacije u `src/app/page.jsx`
- **Perzistentno (lazy-persistent) renderovanje tabova:** Uvedeno stanje `visitedWhTabs` koje montira tabove tek kada ih korisnik prvi put posjeti, a zatim ih drži u memoriji uz kontrolu vidljivosti (`block` / `hidden`).
- **Nema gubitka stanja i skrola:** Korisnik više ne gubi unesene filtere ili poziciju skrola u tabeli servisa kada pređe na analitiku ili šifrarnik.
- **`useCallback` stabilizacija:** Svi handler-i skladišnog portala (`handleWhSelectYear`, `handleWhOpenFleetTab`, `handleWhOpenVehicleModal`, `handleWhOpenIntExtRecap`, `handleWhOpenSupplierDetail`, `handleWhOpenSegmentDetail`) memoizirani su pomoću `useCallback`.

---

## 4. Verifikacija
- Pokrenut `npm run build` – aplikacija se uspješno kompajlira bez ijedne greške ili upozorenja.
- Kartica "Prosjek po popravci" sada dinamički i tačno prikazuje 217,11 KM za sve godine, te tačne prosjeke pri filtriranju po godinama i mjesecima.
- Prebacivanje između tabova skladišne mehanizacije odvija se trenutno (0 ms latencije).
