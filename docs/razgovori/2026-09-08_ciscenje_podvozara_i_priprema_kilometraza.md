# Čišćenje podvozara/kooperanata iz baze i priprema pridruživanja kilometraža

**Datum:** 08.09.2026.  
**Autor:** Emir Duraković & Antigravity  

---

## 1. Kontekst i identifikovani problem
Tokom analize poklapanja master baze servisa sa evidencijom sipanja i kilometraža ([Evidencija_Sipanja_I_Kilometraza_Flote_Azurirano.xlsx](file:///C:/Users/emir.durakovic/Desktop/Gemini-Files/Reports/Evidencija_Sipanja_I_Kilometraza_Flote_Azurirano.xlsx)), utvrđeno je da se u bazi popravki nalazi 299 zapisa koji pripadaju vanjskim firmama i podvozarima:
* **Firme:** Meridian, Majevica dd, A2B, Mlin i pekara Ljubače, Nedix Prom, AD TRADE, Pivara doo, Kirsch-prom, Modelia, Cydonia, Autotransport Cvijetić itd.
* **Ukupan iznos servisa:** **96.855,58 KM** (period 2021–2023).
* **Uzrok nastanka:** Bingo interna radionica je u prošlosti vršila popravke za ove vanjske kooperante i izdavala interne fakture (`Bingo Interna faktura`), ali su te popravke greškom uvezene u operativne troškove vlastitog voznog parka.
* **Problem:** Ovi nosioci se ne nalaze u `fleet_master` (jer to nisu vozila Binga), ali su u `fleet_costs` vještački uvećavali ukupne troškove transporta i iskrivljavali KPI-jeve.

---

## 2. Poduzete radnje

1. **Sigurnosni Backup:**
   * Napravljen puni backup datoteka `fleet_data.json` u `C:\Users\emir.durakovic\Desktop\Gemini-Files\Work\`.
2. **Arhivski Excel Izvještaj:**
   * Svi izbačeni zapisi (299 transakcija) sačuvani su u Excel izvještaj:
     `C:\Users\emir.durakovic\Desktop\Gemini-Files\Reports\Izbaceni_Podvozari_I_Kooperanti.xlsx`
   * Izvještaj sadrži zbirni tab i tab **"DATA"** sa crvenom bojom taba (`FF0000`) formatiran kao tabela.
3. **Čišćenje Cloud Firestore baze (`fleet_costs`):**
   * Preko skripte `scripts/delete_podvozari_firestore.cjs` izvršeno je serijsko brisanje svih 299 dokumenata iz Firestore kolekcije `fleet_costs`.
   * Verifikacijom je potvrđen HTTP 404 status za obrisane dokumente.
4. **Ažuriranje lokalnih baza:**
   * `fleet_data.json` i `public/fleet_data.json` svedeni su sa 31.310 na **31.011 čistih zapisa**.
5. **Build i Deploy:**
   * Urađen produkcijski build (`npm run build`).
   * Aplikacija deployana na Firebase Hosting (`https://analiza-transporta-flota.web.app`).

---

## 3. Naredni korak
Ponovna provjera i simulacija povezivanja kilometraža na očišćenom skupu podataka (31.011 servisa) prije bilo kakvog importa u Firestore ili na portal.
