# Zapisnik Implementacije - Faza 2: Mobilna Terenska Forma i Radni Nalozi Skladišne Mehanizacije

**Datum:** 10.09.2026.  
**Projekat:** Analiza Transporta i Održavanja Voznog Parka (Bingo d.o.o. Tuzla)  
**Faza:** 2 - Terenska mobilna aplikacija / forma za servisere na telefonima  

---

## 1. Cilj i Kontekst
Serviseri skladišne mehanizacije posjeduju službene Android telefone sa kamerama i imaju svakodnevnu obavezu redovnih preventivnih pregleda i vanrednih popravki 594 jedinice skladišne mehanizacije (regalni viljuškari, visokopodizni, čeoni, paletari).

U Fazi 2 implementirana je namjenska, optimizovana mobilna forma za servisere koja omogućava:
1. Brz odabir jedinice skladišne mehanizacije (594 jedinice iz `warehouseMasterFleet`) po garažnom broju, modelu ili šasiji.
2. **Obavezan unos radnih sati (MTH)** sa brojača table viljuškara uz strogu validaciju.
3. **8 tačaka preventivne ček-liste** (Točkovi/gume, Kran/viljuške/lanci, Baterija/punjač, Hidraulika/ulje, Kočioni sistem, Ruda/elektronika, Šasija/sjedište, Signalizacija/sigurnost) sa brzim toggle-om "Označi sve kao ispravno" i mogućnošću unosa pojedinačnih napomena za uočene nepravilnosti.
4. **Predlošci najčešćih radova** i polje za utrošeni materijal i rezervne dijelove.
5. **Standardizovanih 5 uglova fotografisanja** (Naprijed, Nazad, Lijevo, Desno, Brojač/Sjedište) sa klijentskom HTML5 Canvas kompresijom slika (max 1280px, ~150-200 KB) radi uštede prenosa podataka u skladištima i pouzdanog spremanja u Firestore.
6. Direktan prenos naloga u status `completed` (poslano na verifikaciju voditelju) i instant notifikacija dispečeru/voditelju na portalu.

---

## 2. Realizovane Komponente i Promjene

1. **Klijentska kompresija slika (`src/lib/imageCompression.js`):**
   - Automatsko skaliranje visoke rezolucije mobilne kamere na max 1280x1280px uz JPEG 75% kvalitet.
   - Prikaz uštede u KB i procentima na formi prije slanja.

2. **Mobilna terenska forma (`src/components/serviser/FieldWorkOrderForm.jsx`):**
   - Dizajnirana po principima mobilnog interfejsa sa velikim touch-metama, jasnim kontrastom i mogućnošću brzog zatvaranja.
   - Puna integracija sa kamerom pametnih telefona (`capture="environment"`).

3. **Nadogradnja servisnog portala (`src/components/serviser/ServiserDashboard.jsx`):**
   - Uveden dvostruki prikaz:
     - **Radni Nalozi & Pregledi Mehanizacije:** Pregled zaduženih otvorenih naloga (`pending`), dugme "Popuni na Terenu", lista završenih pregleda, te istaknuto dugme "➕ Novi Preventivni Pregled".
     - **Karton Mehanizacije & Pretraga:** Pretraga kombinovane baze skladišnih viljuškara i transportnih vozila.
   - Integrisani modali za detaljan uvid u nalog i A4 print sa mobilnog telefona ili računara.

4. **Portal skladišne mehanizacije (`src/components/warehouse/WarehouseWorkOrders.jsx`):**
   - Dodato dugme `📱 Terenski Unos` u gornjem zaglavlju taba 6, omogućavajući dispečeru ili korisnicima na tabletima da takođe pokrenu mobilnu formu.

5. **Povezivanje u `src/app/page.jsx`:**
   - Objedinjeni modali i pozivi `createWorkOrder` / `updateWorkOrder` za servisere i administratore.
