# Prikaz broja fakture i vrste fakture u pregledu opravki skladišne mehanizacije

**Datum:** 11. septembar 2026.  
**Komponenta:** `src/components/warehouse/WarehouseRepairs.jsx`  
**Cilj:** Uskladiti tabelarni prikaz u tabu "Pregled svih opravki" skladišne mehanizacije sa zbirnim pregledom servisa (`ServiceTable.jsx`) i kartonom vozila (`VehicleCardModal.jsx`), dodavanjem odvojenih kolona i filtera za broj fakture i vrstu fakture (Interno / Eksterno).

---

## 1. Implementirane izmjene

1. **Kolona "Broj fakture":**
   - Dodana u tabelu `WarehouseRepairs` na identičnoj poziciji kao u zbirnoj tabeli (nakon servisera/dobavljača).
   - Formatiran monospace bedž sa brojem računa (`item.brojRacuna`).
   - Dodan in-table kolonski filter za brzu tekstualnu pretragu po broju fakture (`colFilterInvoice`).

2. **Kolona "Interno / eksterno":**
   - Dodana kolona sa prepoznatljivim bedževima:
     - Plavi bedž `Interno` za interne naloge i radionice.
     - Ljubičasti bedž `Eksterno` za vanjske dobavljače i fakture.
   - Dodan in-table dropdown selektor za filtriranje: `Sve`, `Interno`, `Eksterno` (`colFilterInternalExternal`).

3. **Ujednačeno centriranje tabele:**
   - Sve kolone, filteri i ćelije centrirani (`text-center`) u skladu sa ranijim standardom ujednačavanja tabela.
   - Prazan prikaz (`colSpan`) ažuriran na 11 kolona.
   - Ažurirano dugme za poništavanje svih filtera (`resetAllFilters`) i indikator aktivnih filtera.

---

## 2. Verifikacija i deploy
- **Build test:** `npm run build` uspješno izvršen (Next.js 16.3.3 Turbopack).
- **Firebase Hosting:** Deployano na produkciju: [analiza-transporta-flota.web.app](https://analiza-transporta-flota.web.app).
