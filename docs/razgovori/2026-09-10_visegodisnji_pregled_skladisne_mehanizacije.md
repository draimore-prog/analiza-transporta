# Zamjena Kartica sa Višegodišnjim Pregledom Mehanizacije (2021 - 2026)

**Datum:** 10.09.2026.  
**Autor:** Antigravity & Emir Duraković  
**Status:** Implementirano, verifikovano i deployano  

---

### 1. Zahtjev
Na portalu **Skladišna mehanizacija** (`WarehouseKpis.jsx`), ukloniti donji kontejner sa karticama *"Vodeća skladišna mehanizacija po troškovima intervencija"*, a umjesto toga ubaciti interaktivni tabelarni prikaz:  
**"Višegodišnji pregled troškova i broja vozila (2021 - 2026)"**, identično kao što je na glavnom portalu servisa motornih vozila.

---

### 2. Implementacija u `src/components/warehouse/WarehouseKpis.jsx`
1. **Flota po godinama za skladišnu mehanizaciju**:
   - Definisane historijske vrijednosti flote mehanizacije (`WAREHOUSE_FLEET_BY_YEAR`):
     - 2021: 312 mašina
     - 2022: 291 mašina
     - 2023: 352 mašine
     - 2024: 419 mašina
     - 2025: 595 mašina
     - 2026: Dinamički proračun aktivnih mašina iz `warehouseMasterFleet` (594 aktivne mašine).

2. **Agregacija troškova i naloga (`yearlyStats`)**:
   - Iz `warehouseCostData` agregirani su ukupni trošak i broj servisnih intervencija za svaku godinu (2021 - 2026).
   - Automatski proračunat prosječan trošak po mašini (`cost / fCount`).

3. **Tabela i Drilldown**:
   - Tabela sadrži kolone: *Godina*, *Broj Mašina u Floti*, *Ukupan Trošak Održavanja*, *Prosjek po Jedinici*, *Broj Servisnih Intervencija*.
   - Klik na bilo koji red pokreće `onSelectYear(y)` koji korisnika preusmjerava na Tab 3 (*Tabela Popravki Mehanizacije*) sa unaprijed aktiviranim filterom za odabranu godinu.
   - U zaglavlju se nalazi i dugme za brzi prelazak na Tab 2 (*Šifrarnik flote - 594 aktivne*).
