# Preimenovanje Portala u "Logistika - Servis motornih vozila"

**Datum:** 09.09.2026.  
**Autor:** Antigravity AI & Emir Duraković

---

## 1. Predmet i Svrha Izmjene
Korisnik je zatražio promjenu naziva sistema jer primarni fokus i sadržaj platforme nije transport u užem smislu, već cjelokupna logistika održavanja, servisnih popravki i praćenja voznog parka i skladišne mehanizacije.

**Novi naziv sistema:**
`Logistika - Servis motornih vozila`

---

## 2. Ažurirane Komponente i Lokacije

1. **Glavni Sidebar ([src/components/layout/Sidebar.jsx](file:///c:/Users/emir.durakovic/Desktop/analiza-transporta-master/src/components/layout/Sidebar.jsx)):**
   - Brending logo u zaglavlju sidebara ažuriran:
     - Naslov: `Logistika - Servis`
     - Podnaslov: `Motornih vozila`
     - Puni `title`: `Logistika - Servis motornih vozila`
   - Dugme za povratak iz skladišne mehanizacije preimenovano iz `Glavni Transport` u `Servis motornih vozila`.

2. **Glavni Layout & Metadata ([src/app/layout.jsx](file:///c:/Users/emir.durakovic/Desktop/analiza-transporta-master/src/app/layout.jsx)):**
   - Title taga stranice u browseru postavljen na: `Logistika - Servis motornih vozila`.

3. **Ekran Učitavanja ([src/app/page.jsx](file:///c:/Users/emir.durakovic/Desktop/analiza-transporta-master/src/app/page.jsx)):**
   - Tekst na loading ekranu promijenjen iz `Analiza Transporta & Voznog Parka` u `Logistika - Servis motornih vozila`.

4. **Login Modal ([src/components/modals/LoginModal.jsx](file:///c:/Users/emir.durakovic/Desktop/analiza-transporta-master/src/components/modals/LoginModal.jsx)):**
   - Podnaslov ispod forme za prijavu ažuriran u `Logistika - Servis motornih vozila`.

5. **Serviserski Portal ([src/components/serviser/ServiserDashboard.jsx](file:///c:/Users/emir.durakovic/Desktop/analiza-transporta-master/src/components/serviser/ServiserDashboard.jsx)):**
   - Dugme za prelazak na primarni portal preimenovano iz `Glavni Transport` u `Servis motornih vozila`.

6. **Konstante i Opisi ([src/lib/constants.js](file:///c:/Users/emir.durakovic/Desktop/analiza-transporta-master/src/lib/constants.js)):**
   - Ažuriran opis uloge analitičara.

---

## 3. Verifikacija & Deployment
- `npm run build` izvršen uspješno (exit code 0).
- Git commit i push na `origin/master`.
- Deploy na Firebase Hosting (`https://analiza-transporta-flota.web.app`).
