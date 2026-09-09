# Analiza izvodljivosti: Dodjela i rekonstrukcija radnih sati za skladišnu mehanizaciju (100% Pokrivenost)

**Datum:** 09.09.2026.  
**Izvori podataka:**  
1. `Konsolidovani radni sati mehanizacija 2025-2026.xlsx` (528 aktivnih jedinica)
2. `fleet_master.json` (1.252 jedinice uključujući rashodovana/prodata vozila)
3. `fleet_data.json` (7.277 servisa skladišne mehanizacije 2021–2026)

**Status:** **Samo provjera stanja i simulacija (bez izmjena u bazi ili Firestoreu).**

---

### 1. Potpuni obuhvat (100% pokrivenost baze servisa):
Svih **7.277 servisa** skladišne mehanizacije je uspješno obrađeno i dobija radne sate na dan servisa:

1. **Grupa A – Aktivne mašine (6.719 servisa / 92.33%):**
   - Direktno uvezane sa 528 mašina iz konsolidovane tabele.
   - Za 2025–2026.: Kvartalna interpolacija između 7 stvarnih očitavanja.
   - Za 2021–2024.: Rekonstrukcija unazad preko individualnog tempa mašine uz zaštitu godine proizvodnje.
2. **Grupa B – Rashodovane / stare mašine prije 2025. (558 servisa / 7.67%):**
   - Mašine (npr. inv. br. 212, 175, 203, 3, 226...) koje su postojale i servisirane do 2023–2024, ali su rashodovane prije 2025.
   - Za njih iz `fleet_master.json` uzimamo godinu proizvodnje i primjenjujemo flotni benchmark tempo (3.52 h/dan) od proizvodnje do dana servisa.
   - Rezultat: Realan, monoton prirast radnih sati (npr. Inv 212: 9.127 h u 2021. do 12.179 h u 2023. godini).

---

### 2. Distribucija po godinama:
- **2021:** 854 / 854 (100.0%)
- **2022:** 1.255 / 1.255 (100.0%)
- **2023:** 1.432 / 1.432 (100.0%)
- **2024:** 1.734 / 1.734 (100.0%)
- **2025:** 1.462 / 1.462 (100.0%)
- **2026:** 540 / 540 (100.0%)
- **UKUPNO:** **7.277 / 7.277 (100.00%)**

---

### 3. Generisani izvještaj:
- `C:\Users\emir.durakovic\Desktop\Gemini-Files\Reports\Analiza_Izvodljivosti_Rekonstrukcije_Radnih_Sati.xlsx`
  - Sadrži detaljnu metodologiju, simulaciju svih 7.277 servisa, i raw sheet `DATA` crvene boje.
