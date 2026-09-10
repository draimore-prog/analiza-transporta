# Rješenje greške "This page couldn't load" i implementacija zaštite stabilnosti portala

**Datum:** 10. septembar 2026.  
**Platforma:** Next.js (App Router) + Firebase Hosting (`https://analiza-transporta-flota.web.app`)  
**Status:** Riješeno, verifikovano i raspoređeno na produkciju

---

## 1. Uzrok problema
Korisnik je prijavio grešku: `"opet imam neku grešku this page couldn/t load"`.
Detaljnom analizom koda i logova utvrđeni su sljedeći ključni uzroci rušenja aplikacije na klijentu:

1. **Ranjivost funkcije `formatDate(d)` na Firestore objekte i Timestamp-e:**
   - Prethodna implementacija je pretpostavljala da je `d` string ili `Date`. Kada bi primila Firestore `Timestamp` objekat (`{ seconds, nanoseconds }`) ili neočekivan format, pokušaj poziva `.getTime()` direktno je bacao `TypeError: dateObj.getTime is not a function`, što je izazivalo pad React stabla.
2. **Nepokriveni indeksi i `toString()` u `VehicleCardModal.jsx` grafikona:**
   - U Chart.js datalabels pluginu `yearlyData.years[context.dataIndex].toString()` nije imao provjeru postojanja indeksa (`?.toString()`), što je pri određenim animacijama ili praznim godinama izazivalo rušenje.
   - Hronološko sortiranje datuma servisa u kartonu vozila nije imalo zaštitu od nevalidnih datuma.
3. **Nedostatak `ErrorBoundary` zaštite:**
   - Aplikacija nije imala React `ErrorBoundary` komponentu. Svaki neuhvaćeni izuzetak unutar bilo koje tab komponente ili modala dovodio je do unmountovanja cjelokupne aplikacije i prikazivanja sistemske stranice o padu umjesto izolacije greške.
4. **Zastario IndexedDB keš (`DATASET_CACHE_KEY`):**
   - Keš ključ je ostao na `v16`, zbog čega su klijenti u preglednicima držali stari keš umjesto novoažurirane baze sa rekonstruisanim radnim satima i očišćenih 58 spornih servisa.

---

## 2. Implementirane ispravke

1. **Kreirana robusna `ErrorBoundary` komponenta (`src/components/common/ErrorBoundary.jsx`):**
   - Hvata sve klijentske greške unutar svojih granica.
   - Prikazuje profesionalan korisnički interfejs sa dugmetom "Pokušaj ponovo" i "Zatvori", čuvajući ostatak portala i navigaciju u potpunosti funkcionalnim.
   - Postavljena na nivou korijenske stranice (`DashboardPage`) i oko svih modalnih prozora (`VehicleCardModal`).
2. **Otporne funkcije formatiranja (`src/lib/calculations.js`):**
   - `formatDate(d)` sada bezbjedno prepoznaje i pretvara Firestore `Timestamp` objekte (`.toDate()`, `.seconds`), stringove, brojeve i `Date` objekte. Ako je datum nevalidan, sigurno vraća `'-'` bez bacanja izuzetaka.
   - `formatKM`, `formatMileage` i `formatOperatingHours` osigurani od `null`, `undefined` i `NaN`.
3. **Poboljšan `VehicleCardModal.jsx`:**
   - Usklađen uvoz `Chart` iz `@/lib/chartSetup.js`.
   - Sigurno sortiranje po vremenu (`getSafeTime`) bez obzira na format datuma u pojedinačnom zapisu.
   - Sigurno indeksiranje u godišnjim i mjesečnim grafikonima (`yearlyData.years[...]?.toString()`).
   - Dvostruka pretraga vozila i po registraciji i po garažnom broju.
4. **Optimizovan `WarehouseKpis.jsx`:**
   - Dodat uslov `if (!isActive) return;` kako se grafikoni ne bi iscrtavali i trošili memoriju kada je tab sakriven (`display: none`).
   - Zaštićena kalkulacija postotaka u tooltip-u od `NaN` vrijednosti.
5. **Inkrementiran IndexedDB ključ (`src/lib/constants.js`):**
   - Ažuriran na `'fleet_dataset_v17_warehouse_hours'` kako bi svi korisnici automatski povukli čiste i najnovije podatke.

---

## 3. Verifikacija
- Pokrenut `npm run build` – uspješno prošao bez ijedne greške ili upozorenja (1375ms, Turbopack).
- Provjerena sintaksa i tipovi putem TypeScript komajlera (`tsc --noEmit`).
- Verifikovan rad Firebase Hosting servisa i dohvat svih resursa sa statusom 200.
