# Zapisnik promjena: Linijski grafikon mjesečne dinamike troškova za Skladišnu mehanizaciju

**Datum:** 09.09.2026.  
**Modul:** Skladišna mehanizacija (`src/components/warehouse/WarehouseKpis.jsx`)  
**Zahtjev:** Usklađivanje prikaza grafikona trenda troškova na portalu skladišne mehanizacije sa glavnim portalom – uvođenje multi-line prikaza "Mjesečna dinamika troškova" po godinama (2021–2026) kroz 12 mjeseci sa zakrivljenim linijama.

---

### Implementirane izmjene:

1. **Multi-line grafikon po uzoru na glavni portal (`TransportKpis.jsx`):**
   - Kada su filteri godine i mjeseca postavljeni na sve (`selectedYearFilter === "all"` i `selectedMonthFilter === "all"`), grafikon prikazuje 6 distinktno obojenih linija (po jednu za svaku godinu od 2021. do 2026.) kroz 12 mjeseci (Jan – Dec).
   - Parametri linija: `tension: 0.3`, `borderWidth: 2.5`, `backgroundColor: "transparent"`.
   - Paleta boja: `#3b82f6` (2021), `#10b981` (2022), `#f59e0b` (2023), `#ef4444` (2024), `#8b5cf6` (2025), `#ec4899` (2026).
   - Tooltip prikazuje iznos u KM i udio u godišnjem trošku skladišne mehanizacije.
   - Klik na tačku godine filtrira prikaz za tu godinu (`setSelectedYearFilter`).

2. **Fleksibilan prikaz pri selekciji pojedinačne godine ili mjeseca:**
   - **Kada je izabran specifičan mjesec (a sve godine):** Prikazuje se poređenje tog mjeseca kroz godine 2021–2026 sa podjelom na vlastitu radionicu (interno) i vanjske servise (eksterno).
   - **Kada je izabrana pojedinačna godina:** Prikazuje se mjesečna dinamika za tu godinu kroz 12 stubaca (interno vs eksterno), uz mogućnost klika za drill-down na odabrani mjesec.

3. **Optimizacija performansi:**
   - Zadržano brzo renderovanje (`animation: { duration: 200 }`) za trenutnu responsivnost pri pregledu i navigaciji.

4. **Ažurirani naslovi i opisi:**
   - Kartica preimenovana u **"📈 Mjesečna Dinamika Troškova"** uz dinamički podnaslov koji opisuje trenutno selektovani opseg.
