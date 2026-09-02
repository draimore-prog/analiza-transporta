# Zapisnik i Odluka: Dodavanje Filtera Mjeseca i Tipa Vozila u KPI Pregled

- **Datum**: 02. septembar 2026.
- **Autor / Agencija**: Antigravity AI & Bingo Flota Tim
- **Kontekst**: Zahtjev korisnika za proširenjem filtera u Tabu 1 ("Pregled Flote & KPI")

---

## 1. Korisnički Zahtjev
Korisnik je zatražio:
> *"DODAJ U KPI PREGLED PORED FILTERA godine i filter mjesec i filter tip vozila"*

Prethodno je u KPI pregledu (`TransportKpis.jsx`) postojao samo dropdown filter za godinu (`selectedYearFilter`).

---

## 2. Implementirane Funkcionalnosti

1. **Novi Reaktivni Filteri u Stanju (React State)**:
   - `selectedYearFilter`: Godina (Sve godine 2021-2026, 2026, 2025, 2024, 2023, 2022, 2021).
   - `selectedMonthFilter`: Mjesec (Svi mjeseci 1-12, 1. Januar .. 12. Decembar).
   - `selectedTipFilter`: Tip vozila (Svi tipovi vozila, Teretna vozila, Putnička vozila, Skladišna mehanizacija, Priključna vozila, Radna mašina).
   - Tipovi se automatski izvode i normalizuju pomoću funkcije `cleanVehicleType` iz `@/lib/calculations.js`.

2. **Kombinovano Filtriranje Podataka (`filteredCostData`)**:
   - `filteredCostData` sada istovremeno filtrira troškove po godini, mjesecu i tipu vozila.
   - Svih 6 V1 Summary KPI kartica (`Ukupan Trošak`, `Trošak po Vozilu/Dan`, `Udio Internog Servisa`, `Top Segment`, `Broj Intervencija`, `Prosjek po Intervenciji`) automatski reaguju na sve odabrane filtere.
   - Kartica 1 ("Ukupan Trošak") ima dinamički podnaslov koji jasno prikazuje aktivnu kombinaciju (npr. *"Juli 2026. godina • Teretna vozila"*).
   - Kartica 2 ("Trošak po Vozilu / Dan") računa prosjek na bazi stvarno aktivnih vozila unutar izabranog tipa i perioda.

3. **Prilagođavanje Analitičkih Grafikona**:
   - **Mjesečna Dinamika / Trend Grafikon (`chartTrend`)**:
     - *Sve godine + svi mjeseci*: 6-godišnja uporedna linija (filtrirana po tipu vozila ako je izabran).
     - *Sve godine + odabrani mjesec*: Uporedni stubičasti grafikon za taj konkretni mjesec (npr. Juli) kroz svih 6 godina (2021-2026) sa podjelom na interno i eksterno održavanje!
     - *Određena godina*: Raspodjela po mjesecima za tu godinu (interno vs eksterno).
   - **Interno vs Eksterno Doughnut (`chartIntExt`)**: Računa se na bazi `filteredCostData`.
   - **Top 10 Vozila (`chartVehicles`)**: Prikazuje top 10 vozila u okviru filtriranog skupa.
   - **Struktura po Segmentu (`chartSegments`)**: Dinamički izračun udjela segmenata za filtrirani period i tip.
   - **Top Dobavljači / Partneri (`chartSuppliers`)**: Dinamički prikaz dobavljača ili internog održavanja usklađen sa filterima.

4. **Korisnički Interfejs (UI/UX)**:
   - Dodata je **Glavna filter traka** na vrhu KPI pregleda sa jasnim bedžom "Aktivni filteri" i brzim dugmetom **"Poništi"** (`RotateCcw`) koje jednim klikom vraća sve filtere na početno stanje ("Sve godine", "Svi mjeseci", "Svi tipovi").
   - Ažurirana je i filter traka neposredno iznad grafikona koja sadrži iste dropdown kontrole (Godina, Mjesec, Tip vozila) za jednostavno filtriranje tokom pregleda grafikona.

---

## 3. Verifikacija
- Pokrenut `npm run build` (Next.js Turbopack) – prošao uspješno bez ijedne greške u 13.9s.
- Svi fajlovi su spremni za automatski Git commit/push i Firebase Hosting deploy.
