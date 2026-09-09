# Usklađivanje mjesta troška (MT) i standardizacija tipova mehanizacije

**Datum:** 09.09.2026.  
**Autor:** Emir Duraković & Antigravity  

---

## 1. Kontekst i izvor podataka

Korisnik je na osnovu prethodno pripremljene radne sveske izvršio ručnu provjeru, dopunu i reviziju svih spornih servisa i vozila, te ostavio finalnu tabelu na Desktopu:
* Datoteka: `C:\Users\emir.durakovic\Desktop\Provjera_Servisa_Bez_MT_I_Tipova_Mehanizacije (version 1).xlsb.xlsx`
* Zahtjev:
  1. Učitati sve korekcije iz radnih listova.
  2. Povezati i dodijeliti mjesta troška (garažne brojeve).
  3. Uskladiti i standardizovati tipove mehanizacije u svim evidencijama.
  4. Ispraviti neusklađena velika i mala slova (pisanje tipova, marki i modela).
  5. Ažurirati lokalne baze (`fleet_master.json`, `fleet_data.json`) i produkcijsku Cloud Firestore bazu (`fleet_costs`, `fleet_master`).

---

## 2. Poduzete radnje i analiza izmjena

### A. Sigurnosni backup
Prije bilo kakvih izmjena napravljen je puni backup datoteka u:
`C:\Users\emir.durakovic\Desktop\Gemini-Files\Work\backup_before_corrections_2026_09_09\`

### B. Obrađeni tabovi i pravila standardizacije
1. **List 3 ("3. Revizija tipa u Masteru")**:
   - Ažurirano 18 vozila u matičnoj bazi `fleet_master`.
   - Korisnik je potvrdio da su manja komercijalna dostavna vozila sa 2 sjedišta (npr. Renault Clio, Ford Fiesta, VW Caddy) u evidenciji Binga **"Teretna vozila"** (Societe).
   - Standardizovani nazivi u množinu (`Teretna vozila`, `Priključna vozila`, `Radna mašina`).
   - `SERVIS MOTORNIH VOZILA` postavljen na `Servis motornih vozila` (MT `/`).
2. **List 2 ("2. Neusklađeni tipovi servisa")**:
   - Obrađeno 614 servisa gdje se tip u servisu razlikovao od matične flote.
   - Svi tipovi su usklađeni sa zvaničnim odlukama i standardizovani.
3. **List 1 ("1. Servisi bez MT-a")**:
   - Obrađeno 637 servisa koji su imali prazan ili nedefinisan garažni broj/MT.
   - Za 510 servisa uspješno dodijeljen i povezan tačan garažni broj (MT) na osnovu registracije i korisničkog unosa.
   - Za 127 servisa (interna radionica i oprema bez tablica poput VAP, Litostroj, John Deere traktor, Puhaljka itd.) dodijeljen standardni MT `/` i tip `Servis motornih vozila` ili `Radna mašina`.
   - Ispravljene pogrešne registracije (npr. zavedeni troškovi alata, pakeraja i dijelova prebačeni na `SERVIS MOTORNIH VOZILA`).
4. **Standardizacija velikih i malih slova**:
   - Tipovi mehanizacije strogo svedeni na 6 zvaničnih vrijednosti:
     * `Teretna vozila`: 15.532 servisa (master: 332 vozila)
     * `Skladišna mehanizacija`: 7.277 servisa (master: 644 vozila)
     * `Putnička vozila`: 4.874 servisa (master: 188 vozila)
     * `Priključna vozila`: 2.533 servisa (master: 71 vozilo)
     * `Radna mašina`: 707 servisa (master: 14 vozila)
     * `Servis motornih vozila`: 88 servisa (master: 1 jedinica)
   - Ujednačeni nazivi proizvođača i modela (npr. `John Deere`, `Caterpillar`, `Litostroj`, `Vap`, `Puhaljka`, `Limuzina`).

---

## 3. Sinhronizacija sa Cloud Firestore i Aplikacijom

1. **Ažuriranje Cloud Firestore**:
   - Izvršeno serijsko batch ažuriranje (`updateMask`) nad **1.056 dokumenata** u kolekciji `fleet_costs`.
   - Ažurirano **18 dokumenata** u kolekciji `fleet_master`.
2. **Lokalne baze**:
   - Ažurirani `fleet_data.json` i `fleet_master.json` u root-u i u `public/`.
3. **Povećanje verzije keša**:
   - `MASTER_CACHE_KEY` podignut na `fleet_master_v15_all_statuses`.
   - `DATASET_CACHE_KEY` podignut na `fleet_dataset_v14_july2026`.
4. **Excel Izvještaj**:
   - Sačuvan konačni izvještaj sa crvenim **"DATA"** tabom u:  
     `C:\Users\emir.durakovic\Desktop\Gemini-Files\Reports\Revidirana_Evidencija_MT_I_Tipova_Mehanizacije.xlsx`
5. **Build & Deploy**:
   - Izvršen `npm run build` i uspješan deploy na Firebase Hosting (`https://analiza-transporta-flota.web.app`).

---

## 4. Rezultat
U bazi više nema niti jednog servisa sa neusklađenim tipom mehanizacije, niti servisa vozila sa nepoznatim garažnim brojem. Baza je u potpunosti pripremljena za završno pridruživanje kilometraža.
