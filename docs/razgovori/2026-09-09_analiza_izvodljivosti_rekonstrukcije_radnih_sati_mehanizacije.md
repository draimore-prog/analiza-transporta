# Analiza izvodljivosti: Dodjela i rekonstrukcija radnih sati za skladišnu mehanizaciju

**Datum:** 09.09.2026.  
**Izvor podataka:** `Konsolidovani radni sati mehanizacija 2025-2026.xlsx` (528 jedinica flote)  
**Cilj:** Provjera procenta poklapanja sa servisima skladišne mehanizacije (2021–2026) i ocjena izvodljivosti matematičko-fizikalne rekonstrukcije radnih sati za starije godine.  
**Status:** **Samo provjera stanja (bez izmjena u bazi ili Firestoreu).**

---

### 1. Ključni rezultati poklapanja:
- **Ukupno servisa skladišne mehanizacije u bazi:** 7.277 servisa.
- **Uspješno poklopljeno sa evidencijom mašina:** **6.719 servisa (92.33%)**.
- **Nepoklopljeno:** 558 servisa (7.67%).
  - *Razlog nepoklapanja:* Uglavnom mašine koje su rashodovane ili prodate prije 2025. godine (npr. inv. br. 212, 175, 203, 226) i samim tim se ne nalaze u evidenciji aktivne flote 2025–2026.

#### Pokrivenost po godinama:
- **2026. godina:** 532 / 540 (**98.70%**)
- **2025. godina:** 1.427 / 1.462 (**97.61%**)
- **2024. godina:** 1.694 / 1.734 (**97.69%**)
- **2023. godina:** 1.337 / 1.432 (**93.37%**)
- **2022. godina:** 1.049 / 1.255 (**83.59%**)
- **2021. godina:** 680 / 854 (**79.63%**)

---

### 2. Metodologija rekonstrukcije:
1. **Za 2025. i 2026. godinu (Interpolacija):**
   - Imamo 7 kvartalnih sidrenih tačaka (Q1 2025 – Q3 2026).
   - Radni sati na dan servisa se računaju linearnom interpolacijom između dva granična kvartala.
2. **Za 2021–2024. godinu (Rekonstrukcija unatrag):**
   - Polazi se od poznatog stanja na Q1 2025 i oduzima se iznos: `dani_unazad * dnevni_tempo (h/dan)`.
   - Dnevni tempo je izračunat za svaku mašinu pojedinačno na osnovu stvarnog korištenja (prosjek flote: 3.52 h/dan).
   - **Fizička zaštita (Bounds):** Uvedeno ograničenje preko godine proizvodnje mašine – sati nikada ne mogu pasti ispod nule.

---

### 3. Generisani izvještaj:
- `C:\Users\emir.durakovic\Desktop\Gemini-Files\Reports\Analiza_Izvodljivosti_Rekonstrukcije_Radnih_Sati.xlsx`
  - Sadrži detaljnu metodologiju, simulaciju za svih 6.719 servisa, analizu nepoklopljenih i raw sheet `DATA` crvene boje.
