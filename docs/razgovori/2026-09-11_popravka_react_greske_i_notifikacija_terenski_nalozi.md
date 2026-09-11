# Popravka React greške pri otvaranju naloga, pravila notifikacija i OTA ažuriranje

**Datum:** 11. septembar 2026.  
**Platforme:** Web (`https://analiza-transporta-flota.web.app/?portal=terenski-nalozi`), Mobile APK / EAS OTA (`ba.bingo.servismehanizacije`)  
**Status:** Riješeno, kompajlirano, deployovano na Firebase Hosting i objavljeno na EAS Update (`preview` branch)

---

## 1. Problem i uzrok

1. **React Runtime Error (greška pri otvaranju dodijeljenog naloga):**
   - **Uzrok:** U komponenti `FieldWorkOrderForm.jsx` postojala je linija `if (!isOpen) return null;` smještena iznad `useMemo` poziva za kalkulaciju defekata (`defectCount`) i slika (`photoCount`).
   - Prilikom početnog učitavanja (`isOpen === false`), React je izvršavao 18 hookova i prekidao render. Kada serviser klikne na dugme `⚡ OTVORI I POPUNI NALOG`, `isOpen` postaje `true`, React prelazi raniji prekid i pokušava izvršiti dodatna 2 `useMemo` hooka. Ovo je direktno kršilo React pravilo o redoslijedu i broju hookova (*"Rendered more hooks than during the previous render"*), što je rušilo cijelu aplikaciju.
   - Pored toga, inicijalno stanje `selectedVehicle` i `checklist` je čekalo asinhroni `useEffect`, pa je tokom prvog render ciklusa moglo doći do čitanja neinicijalizovanih objekata.

2. **Izostanak notifikacija pri kreiranju radnog naloga:**
   - **Uzrok 1 (Filtriranje po imenu servisera):** U `FieldOrdersDashboard.jsx` funkcija `isAssignedToMe` je strogo provjeravala da li dodijeljeni serviser (`assignedTo`, npr. "Šefkija") doslovno sadrži korisničko ime prijavljenog korisnika. Tokom testiranja gdje je voditelj/admin prijavljen kao "admin" ili "Emir Duraković", sistem je odbacivao obavijest jer se imena nisu poklapala. Također, bosanska slova sa dijakritičkim znakovima (npr. "Šefkija" vs "sefkija") nisu prolazila prosto poređenje malih slova.
   - **Uzrok 2 (Native Firestore listener):** U `servis-mobilna-app/App.js`, listener je pratio samo `change.type === "added"` i preskakao prvi load, pa su izmjene postojećih naloga ili ponovna dodjeljivanja bila zanemarena.

---

## 2. Implementirana rješenja

1. **Sanacija `FieldWorkOrderForm.jsx`:**
   - Uklonjen uslovni rani prekid `if (!isOpen) return null;` iznad hookova. Svi hookovi se sada bezuslovno izvršavaju na vrhu komponente.
   - `defectCount` i `photoCount` su prebačeni na jednostavne i bezbjedne kalkulacije bez hook restrikcija uz potpunu zaštitu od `null`/`undefined` vrijednosti.
   - Dodana funkcija `normalizeChecklist()` koja garantuje da svih 8 stavki kontrolne liste uvijek ima validan oblik `{ status: "ok" | "issue", note: "" }`.
   - Dodana funkcija `extractVehicleFromOrder()` koja sinhrono popunjava podatke o vozilu čim se modal otvori sa zadatkom od voditelja.
   - Uspješan render bez ijednog konflikta.

2. **Unapređenje pravila za notifikacije (`FieldOrdersDashboard.jsx` i `App.js`):**
   - Dodana normalizacija teksta (`normalizeStr`) koja uklanja kvačice (`š`, `đ`, `č`, `ć`, `ž`) radi pouzdanog poređenja imena servisera.
   - Proširen uslov `isAssignedToMe`:
     - Ako je nalog dodijeljen "Svi" ili "Svi serviseri" -> zvoni svima.
     - Ako je prijavljen korisnik administrator, voditelj ili dispečer (testni mod) -> notifikacija i alarm se uvijek oglašavaju kako bi testiranje bilo 100% transparentno.
     - Ako je prijavljen terenski serviser -> automatski se aktivira zvučni alarm i iskačući baner.
   - U mobilnoj aplikaciji (`App.js`), Firestore listener sada procesuira i `added` i `modified` događaje uz deduplikaciju preko memorijskog `Set` bafera, osiguravajući da novododijeljeni nalozi odmah aktiviraju native zvuk i vibraciju na telefonu.

3. **OTA (Over-The-Air) ažuriranje:**
   - Generisan i objavljen novi EAS Update na kanalu/grani `preview` sa runtime verzijom `1.1.0`:
     - **Update Group ID:** `b975f14b-40e1-4eca-91a8-f79b5901f052`
     - **Android Update ID:** `01a08fe8-c8ca-7306-90a5-1cb29be63227`
   - Urađen build i deploy na Firebase Hosting (`https://analiza-transporta-flota.web.app/?portal=terenski-nalozi`). Korisnici u mobilnoj aplikaciji ili na webu automatski dobijaju ispravljen kod.
   - Korisnik može u meniju aplikacije ("tri linije" ☰) kliknuti na **"PROVJERI OTA AŽURIRANJE"** kako bi osvježio paket.
