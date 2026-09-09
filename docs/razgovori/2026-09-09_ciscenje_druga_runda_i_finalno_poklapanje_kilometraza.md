# Druga runda čišćenja eksternih nosilaca i konačno poklapanje kilometraža (99,02%)

**Datum:** 09.09.2026.  
**Autor:** Emir Duraković & Antigravity  

---

## 1. Rezime poduzetih akcija iz Excela korisnika

Korisnik je pregledao radnu svesku `Preostali_Specificni_Nosioci_Analiza.xlsx`, obrisao stavke koje ne pripadaju floti, te potvrdio i korigovao podatke za vlastita vozila i mašine.

### A. Izvršena brisanja (15 nosilaca, 21 nalog, 3.463,81 KM)
Uklonjeni su svi nalozi popravki za eksterne partnere i nepoznata vozila trećih lica:
* `J87-A-235` (Džananović doo, Dacia – 4 servisa)
* `K49-T-912` i `K09-J-619` (Džajić Komerc, DAF i Iveco – 4 servisa)
* `E58-T-682` i `O36-K-271` (Duka, MAN i Mercedes – 3 servisa)
* `E90-A-536` i `J03-T-485` (Spole doo, Mercedes – 2 servisa)
* `J98-E-405` (Violeta, Mercedes – 1 servis)
* `E16-J-572` (Kera & Disk, Mercedes – 1 servis)
* `T37-E-428` (A.D. Trade, Mercedes – 1 servis)
* `T24-E-105` (AMD SCONTO, MAN – 1 servis)
* `O37-E-846` (Old Gold Komerc, Mercedes – 1 servis)
* `RADNA MAŠINA` (Vibraciona žaba Tuzla Remont – 1 servis)
* `K26-A-072` (MAN Tuzla Remont – 1 servis)
* `E86-A-884` (VW Tuzla Remont – 1 servis)

*Arhivski izvještaj sačuvan sa crvenim "DATA" tabom u:*  
`C:\Users\emir.durakovic\Desktop\Gemini-Files\Reports\Obrisani_Podvozari_Runda_2.xlsx`

### B. Izvršena ažuriranja (31 nalog)
1. **Građevinska mehanizacija (28 naloga):** `CATERPILLAR` i `MINI BAGER` prebačeni u registraciju `MINI CATERPILLAR`, MT `/`, Marka `Caterpillar`, Tip `Radna mašina`.
2. **Korekcija tipfelera MAN kamiona:**
   * `M74-A-818` ispravljen u `M47-A-818`, MT `40450`, `Teretna vozila`.
   * `K26-M-053` i `K26-M-074` ispravljeni u `K26-M-071`, MT `40375`, `Teretna vozila`.

---

## 2. Sinhronizacija sa Cloud Firestore i Aplikacijom

* **Cloud Firestore (`fleet_costs`):**
  * Obrisano 21 dokument.
  * Ažurirano 31 dokument.
* **Lokalna baza (`fleet_data.json`):**
  * Svedena sa 31.011 na **30.990 čistih naloga**.
* **Deploy:**
  * Podignut cache ključ `DATASET_CACHE_KEY` na `fleet_dataset_v15_clean_round2`.
  * Buildano i deployano na Firebase Hosting (`https://analiza-transporta-flota.web.app`).

---

## 3. Rezultati konačnog poklapanja kilometraža (nakon čišćenja)

* **Poklapanje na nivou vozila (Putnička + Teretna):**
  * Ukupno jedinstvenih motornih vozila: **518 vozila**
  * Poklopljeno u točenjima: **506 vozila (97,68%)**
  * Preostalih 12 vozila (2,32%):
    * **8 električnih vozila** (Tesla i Smart EQ) – nemaju sipanja nafte/benzina.
    * **4 nova Bingo vozila** (`O37-A-116`, `M36-O-426`, `A82-E-529`, `A82-E-528`) – nabavljena 2024–2026.
* **Poklapanje na nivou servisa:**
  * **Ukupno servisa:** 20.379
  * **Uspješno pronađena kilometraža:** **20.180 servisa (99,02%)**
  * **Unutar 7 dana:** **83,65%** servisa (medijan: 2,0 dana).
