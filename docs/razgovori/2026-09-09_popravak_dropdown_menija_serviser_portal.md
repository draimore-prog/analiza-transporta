# Popravak Prikaza Dropdown Menija na Serviser Portalu

**Datum:** 09.09.2026.  
**Autor:** Antigravity AI  
**Status:** Implementirano, verifikovano i raspoređeno  

---

## 1. Problem
Prilikom unosa termina u polje za pretragu na portalu servisera (`ServiserDashboard.jsx`), dropdown lista sa prijedlozima pronađenih vozila otvarala se poluskrivena i odsječena.

### Uzrok:
1. Glavna centralna kartica za pretragu imala je CSS klasu `overflow-hidden`. Kada bi lista pronađenih vozila (koja ima maksimalnu visinu do `320px`) premašila donju ivicu kartice, pretraživački rezultati su bili odsječeni njenim okvirom.
2. Elementi pozadinskog sjaja (ambient blur glow) nalazili su se direktno u kartici, pa je uklanjanje `overflow-hidden` sa same kartice zahtijevalo izolaciju sjaja u zaseban unutrašnji wrapper.
3. Nedostajali su eksplicitni z-index slojevi (`z-40` na kontejneru pretrage, `z-50` na samom dropdownu, i `z-20` na kartici).

---

## 2. Implementirano Rješenje
U datoteci `src/components/serviser/ServiserDashboard.jsx`:
1. **Uklonjen `overflow-hidden` sa glavne kartice**: Dropdown se sada može nesmetano prostirati preko ivice kartice prema dole.
2. **Izolovan pozadinski sjaj**:
   ```jsx
   <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
     <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
     <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
   </div>
   ```
3. **Z-index i pozicioniranje dropdown menija**:
   - Postavljen `relative z-40` na kontejner pretrage.
   - Dropdown postavljen na `absolute left-0 right-0 top-full mt-2 z-50 shadow-2xl backdrop-blur-md ring-1`.
4. **Pametne ikone po tipu mehanizacije**:
   - Implementirana funkcija `getVehicleIcon(v.tipMehan)` koja dinamički dodjeljuje odgovarajuću ikonu u dropdown rezultatima (putničko `🚗`, teretno `🚛`, priključno `🚚`, radna mašina `🏗️`, skladišna/viljuškar `🚜`).

---

## 3. Verifikacija & Deployment
- `next build` prošao uspješno bez grešaka.
- Promjene pohranjene na Git `master` granu.
- Aplikacija raspoređena na Firebase Hosting (`https://analiza-transporta-flota.web.app`).
