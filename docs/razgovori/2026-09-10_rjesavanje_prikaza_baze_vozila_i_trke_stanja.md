# Rješavanje Prikaza Baze Vozila i Trke Stanja (Race Condition)

**Datum:** 10.09.2026.  
**Autor:** Antigravity & Emir Duraković  
**Status:** Riješeno, testirano i deployano  

---

### 1. Uzrok Problema (Root Cause)
Korisnik je prijavio da se u aplikaciji više ne vide vozila u tabelama ("nema ništa vozila na spisku, iz nekog razloga se ne vide").

Detaljnom analizom toka učitavanja u hook-u `useFleetData.js` otkrivena je kritična trka stanja (*race condition*):
1. Početno stanje `masterFleet` u hook-u je prazan niz `[]`.
2. Prilikom učitavanja stranice, asinhrono se pokreće `loadMasterFleet` koji čita `MASTER_CACHE_KEY` iz IndexedDB ili skida `/fleet_master.json` (1.252 vozila).
3. Istovremeno, u paralelnom `useEffect`-u pokrenut je Firestore real-time listener za kolekciju `fleet_master` sa upitom `where("isCustomEdit", "==", true)`.
4. Firestore snapshot listener je odmah po uspostavi veze vratio 7 dokumenata koji imaju `isCustomEdit == true`.
5. Snapshot callback je pozvao:
   ```javascript
   setMasterFleet((prev) => {
     let updated = [...prev]; // prev je u tom trenutku još uvijek bio []!
     changes.forEach(...); // ubacuje samo tih 7 vozila u prazan niz!
     IDBCache.set(MASTER_CACHE_KEY, updated); // PREPISUJE IndexedDB keš sa samo 7 vozila!
     return updated;
   });
   ```
6. Kao rezultat, IndexedDB keš `fleet_master_v15_all_statuses` je prepisan sa samo 7 vozila.
7. Kod svakog narednog osvježavanja stranice, `loadMasterFleet` je provjeravao `if (cached && cached.length > 0)` i preuzimao tih 7 vozila (ili bi tabela ostala prazna zbog filtera statusa i tipova mehanizacije), potpuno preskačući skidanje pune baze od 1.252 vozila.

---

### 2. Implementirano Rješenje

1. **Zaštita od prepisivanja keša i uvođenje `customEditsRef` (`useFleetData.js`)**:
   - Dodat `customEditsRef = useRef(new Map())` koji pamti sve pristigle Firestore izmjene bez obzira na fazu učitavanja baze.
   - U `loadMasterFleet`: Keš iz IndexedDB se prihvata **isključivo ako ima minimalno 1.000 vozila** (`cached.length >= 1000`). U suprotnom se automatski preuzima puni `fleet_master.json` sa servera.
   - Nakon skidanja baze, u nju se spajaju sve pristigle custom izmjene iz `customEditsRef`.
   - U `fleet_master` onSnapshot listeneru: Ako `masterFleet` u stanju ima manje od 1.000 vozila, callback samo ažurira `customEditsRef` i **ne dira stanje niti prepisuje IndexedDB**.
   - IndexedDB se ažurira isključivo kada niz ima punu bazu (`length >= 1000`).
   - Ista zaštita primijenjena i na `loadCostData` (`cached.length >= 25000`).

2. **Bumping keš ključa (`src/lib/constants.js`)**:
   - `MASTER_CACHE_KEY` promijenjen sa `fleet_master_v15_all_statuses` na `fleet_master_v16_full_fleet_safe`.
   - Ovim se automatski zaobilazi i poništava oštećeni lokalni keš u preglednicima svih korisnika te se povlači kompletna matična baza od 1.252 vozila.
