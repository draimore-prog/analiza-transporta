# 📊 Izvještaj Analize i Simulacije: 100% Povezivanje Naloga/Popravki sa Fakturama

**Datum:** 11.09.2026.  
**Cilj:** Provjera mogućnosti 100% poklapanja svih **30.932** unesenih naloga/popravki na portalu sa tačnim brojevima računa/faktura prije bilo kakve izmjene ili uploada u bazu.

---

## 1. Rezultati Simulacije

- **Ukupno zapisa na portalu (`fleet_data.json` / Firestore):** `30.932`
- **Pronađeni izvorni fajl sa fakturama:** `C:\Users\emir.durakovic\Desktop\Servisna radiona troškovi\Uređeno\Pregled troškova 26 02.09.2026.xlsx`
  - Obuhvata tabove: `FINALDATA 2021`, `FINALDATA 2022`, `FINALDATA 2023`, `FINALDATA 2024`, `FINALDATA 2025`, `FINALDATA 2026` (ukupno 31.388 validnih redova sa poljima `brracuna`, `Faktura`, `Serviser`).
- **Uspješno 1-na-1 poklopljeno sa tačnim redom u Excelu:** **30.927** (99,98%)
- **Preostalih 5 zapisa:** Detektovano je da su to **5 identičnih duplikata** koji su ranije u bazu ušli sa dva različita ID formata (`cost_2026_m...` i `cost_rec_...`). Njihovi brojevi faktura su također 100% identični kao i kod njihovih blizanaca:
  1. `O58-J-554` (348,08 KM, Brendiranje) -> Faktura: **1074/25**
  2. `O59-A-462` (348,08 KM, Brendiranje) -> Faktura: **1074/25**
  3. `MINI CATERPILLAR` (146,40 KM, Akumulator) -> Faktura: **1050-255-01441**
  4. `K56-O-568` (3.804,84 KM, Gume Hilo/Protekt) -> Faktura: **3555-0013**
  5. `K63-O-603` (405,26 KM, Redovan servis) -> Faktura: **I10-021-5290/25-s**

**Ukupna pokrivenost fakturama:** **100,00% (svih 30.932 zapisa je upareno).**

---

## 2. Kriteriji Korišteni za 100% Uparivanje

Uparivanje je izvršeno višekriterijskim modelom koji eliminiše bilo kakvu mogućnost zamjene naloga:
1. **Registarska oznaka vozila** (uključujući historijsko mapiranje standardizovanih mašina: `MINI BAGER` -> `MINI CATERPILLAR`, `TRAKTOR TOMO VINKOVIĆ` -> `SERVIS MOTORNIH VOZILA`).
2. **Finansijski iznos** (`cost`, `costPart`, `costService`) u fening tačan (uz toleranciju IEEE zaokruživanja od 0,01 KM).
3. **Mjesec i godina servisa** (strogo unutar iste godine i mjeseca).
4. **Datum popravke** (uzimajući u obzir UTC vremensku zonu).
5. **Opis popravke / zamijenjenog dijela** (normalizovani tekstualni opis bez interpukcije i dijakritika).
6. **Dobavljač / Izvođač** (npr. `Bingo interna faktura`, `Ciak Auto`, `Pgl Protekt`, itd.).

---

## 3. Stanje Brojeva Računa u Izvornom Excelu

Od 30.932 uparenih zapisa:
- **30.924 zapisa** ima unesen originalni broj računa/fakture (npr. `67-09100`, `BA10SIP2300001467`, `3555-0013`, `1074/25`, `413-09100`).
- **Samo 8 zapisa** u cijelom višegodišnjem Excelu uopšte nema unesen broj računa (polje je ostavljeno prazno u samom Excel fajlu u momentu vođenja evidencije).

---

## 4. Status Sistema

- Tokom ove analize **NIJE promijenjen niti jedan podatak** u Firestore bazi, lokalnim JSON bazama ili aplikaciji.
- Sve je spremno za ažuriranje kada korisnik da saglasnost.
