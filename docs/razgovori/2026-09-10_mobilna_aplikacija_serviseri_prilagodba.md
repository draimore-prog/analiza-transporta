# Zabilješka: Prilagodba mobilne hibridne aplikacije za servisere i zaključavanje dodijeljene jedinice

**Datum:** 10. septembar 2026.  
**Učesnici:** Voditelj mehanizacije / Antigravity AI  
**Tema:** Pojednostavljenje UX/UI za starije servisere na terenu i fiksiranje dodijeljene jedinice u radnom nalogu.

---

### 1. Ključni zahtjevi korisnika
1. **Zaključavanje jedinice na nalogu:**
   - Kada voditelj dodijeli radni nalog sa specificiranom jedinicom (npr. `342 RX 17`), serviser na mobilnom telefonu ne smije imati opciju promjene ili ponovnog biranja jedinice.
   - Prikazuju se isključivo podaci dodijeljene jedinice (ID, proizvođač, model, lokacija, broj šasije, nalog/uputstvo voditelja) u fiksnom formatu sa ikonom katanca (`Lock`).
2. **Prilagodba mobilnom ekranu (Mobile-First) i prilagođavanje starijim serviserima:**
   - Smanjen broj informacija i uklonjeni zbunjujući statistički boksovi sa početnog ekrana.
   - Na vrhu ekrana postavljen ogroman, lako uočljiv taster: **`POKRENI NOVI NALOG`** (zelena boja, visina preko 56px, veliki tekst).
   - Ispod njega sekcija **`Radni nalozi u sistemu`** sa dva velika tastera:
     - `🟡 Čekaju na rad ({broj})`
     - `🟢 Završeni nalozi ({broj})`
   - Kartice radnih naloga redizajnirane sa krupnim fontovima (24px za ID viljuškara), krupnim bedževima i širokim tasterom **`OTVORI I POPUNI NALOG`**.
   - Pretraga kartoteke vozila premještena u sklopivi panel ("Pretraga kartona viljuškara i vozila") kako ne bi gušila glavni radni ekran.
3. **Povećani dodirni elementi u formi:**
   - Krupniji unos radnih sati (MTH) sa `inputMode="numeric"`.
   - Velika dugmad za ček-listu (ISPRAVNO / KVAR) i opcija "Označi sve kao ispravno".
   - Veliki prorezi za kameru i taster za slanje naloga.

---

### 2. Izmijenjene komponente
1. `src/components/serviser/FieldWorkOrderForm.jsx`:
   - Dodana provjera `isAssignedOrder` na osnovu dodijeljenog naloga.
   - Onemogućena promjena vozila ukoliko je zadatak kreirao voditelj.
   - Povećani elementi forme i optimiziran font za visoku čitljivost.
2. `src/components/serviser/ServiserDashboard.jsx`:
   - Redizajniran početni ekran u jednostavan vertikalni mobilni tok:
     - Veliko dugme na vrhu: `POKRENI NOVI NALOG`.
     - Sklopiva brza pretraga kartona.
     - Glavna lista: `Radni nalozi u sistemu` sa velikim tasterima za filtriranje.
     - Velike kartice sa jasnim akcijama `OTVORI I POPUNI NALOG` i statusom.

---

### 3. Verifikacija i distribucija
- Pokrenut `npm run build` – build uspješan bez grešaka.
- Promjene pohranjene na Git `origin/master`.
- Aplikacija objavljena na Firebase Hosting: `https://analiza-transporta-flota.web.app`.
