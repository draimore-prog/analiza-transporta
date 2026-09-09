# Zapisnik: Uspješna primjena radnih sati na skladišnu mehanizaciju i metodologija buduće re-kalibracije

**Datum:** 09.09.2026.  
**Obuhvat:** Svih 7.219 servisa skladišne mehanizacije (2021–2026)  
**Izvori:** `Konsolidovani radni sati mehanizacija 2025-2026.xlsx` + `fleet_master.json`  
**Status primjene:** **Uspješno primijenjeno na Cloud Firestore (`fleet_costs`) i lokalne datasete (`fleet_data.json`, `public/fleet_data.json`).**

---

### 1. Izvršena ažuriranja:
- **Cloud Firestore:** 7.219 dokumenata u kolekciji `fleet_costs` ažurirano putem 19 batch commit-ova (`updateMask: ['radniSati']`).
- **Lokalni i produkcijski dataset:** Ažuriran `fleet_data.json` i `public/fleet_data.json` gdje svaka popravka skladišne mehanizacije ima tačnu brojčanu vrijednost radnih sati (`radniSati`), dok je `kilometraza` postavljena na `null`.
- **Generisani skripti i arhive:**
  - `scripts/sync_warehouse_hours_to_firestore.cjs`
  - `C:\Users\emir.durakovic\Desktop\Gemini-Files\Work\warehouse_hours_updates.json`

---

### 2. Mogućnost buduće re-konstrukcije i verifikacije tačnosti:
Korisnik je postavio ključno pitanje:  
*Da li će se baza moći nekada ponovo rekonstruisati kad budemo imali više stvarnih radnih sati iz novih popravki kako bismo provjerili jesmo li ih danas tačno postavili?*

**Odgovor: DA, sistem je namjenski dizajniran za buduću re-kalibraciju:**
1. **Backtesting & Provjera tačnosti:**  
   Kada serviseri u narednim mjesecima unesu stvarna očitavanja sa displeja mašina, možemo uporediti ta stvarna očitavanja sa našom projekcijom.
2. **Dinamičko prilagođavanje nagiba (Slope Recalibration):**  
   Ukoliko nova očitavanja pokažu da je neka mašina npr. radila 4.5 h/dan umjesto pretpostavljenih 3.5 h/dan, automatska skripta može retroaktivno prilagoditi historijski niz radnih sati unazad, tako da prošlost savršeno konvergira ka stvarnim tačkama.
3. **Puna reverzibilnost i sljedivost:**  
   Svi algoritmi, izvorni Exceli i sigurnosni backupi su trajno arhivirani, što omogućava ponovno generisanje i fino podešavanje u bilo kom trenutku.
