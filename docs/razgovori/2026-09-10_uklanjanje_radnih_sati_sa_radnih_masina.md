# Uklanjanje Praćenja Radnih Sati sa Radnih Mašina

**Datum:** 10.09.2026.  
**Autor:** Antigravity & Emir Duraković  
**Status:** Primijenjeno i verifikovano  

---

### 1. Zahtjev i Cilj
Korisnik je zatražio da se polje i praćenje radnih sati u potpunosti ukloni sa **Radnih mašina**, jer se za njih ti sati realno ne vode niti će se evidentirati.  
Ponašanje radnih mašina je izjednačeno sa **Priključnim vozilima** (radni sati i kilometraža su `null` / prikazuje se `-` u tabelama i servisnim karticama, polje za unos je sakriveno u formama).  
Jedina kategorija koja i dalje prati i zahtijeva radne sate ostaje **Skladišna mehanizacija**.

---

### 2. Izvršene Izmjene

1. **`src/lib/calculations.js`**:
   - `formatServiceUsage(item)`: Dodata provjera za `Radna mašina` tako da vraća `'-'` (kao i za `Priključna vozila`). Radne sate formatira isključivo za `Skladišna mehanizacija`.

2. **`src/hooks/useFleetData.js`**:
   - U svim granama mapiranja troškova (početno učitavanje iz IndexedDB/Cache-a, fallback na JSON i Firestore real-time listener) polje `radniSati` se za `Radna mašina` postavlja na `null` (umjesto `0`).

3. **`src/components/modals/VehicleCardModal.jsx`**:
   - Postavljeno `isPrikljucno = cleanType === "Priključna vozila" || cleanType === "Radna mašina"`.
   - Naslov kolone `usageColTitle` postavlja "Radni sati" samo za `Skladišna mehanizacija`, inače "Kilometraža".
   - U tabeli servisa kartice vozila, za `Radna mašina` se kolona ne prikazuje ili prikazuje `-`.

4. **`src/components/modals/NewCostModal.jsx`**:
   - Odabirom vozila ili promjenom tipa mehanizacije na `Radna mašina`, polja za kilometražu i radne sate se prazne i sakrivaju iz forme (isto kao za `Priključna vozila`).
   - Prilikom spašavanja naloga, `finalKm = null` i `finalHours = null` za radne mašine.

5. **`src/components/transport/ServiceTable.jsx`**:
   - `isPrikljucnaFilter` obuhvata i `Radna mašina` (`colFilterType === "Priključna vozila" || colFilterType === "Radna mašina"`).
   - `colUsageHeader` postavlja "Radni sati" isključivo kada je selektovana `Skladišna mehanizacija`.
   - Red u tabeli prikazuje `-` za `Priključna vozila` i `Radna mašina`.

6. **`public/fleet_data.json` & Cloud Firestore (`fleet_costs`)**:
   - Skriptom `scripts/clean_workmachine_hours.cjs` svih 713 zapisa radnih mašina ažurirano je u `public/fleet_data.json` sa `radniSati: null`.
   - Putem Firestore REST API batch transakcija, svih 713 dokumenata u kolekciji `fleet_costs` ažurirano je sa `radniSati = null`.

7. **`src/lib/constants.js`**:
   - `DATASET_CACHE_KEY` inkrementiran na `fleet_dataset_v18_no_workmachine_hours` radi automatskog brisanja zastarjelog IndexedDB keša kod svih korisnika.
