# Zapisnik izmjena: Hronološki poredak i indikatori boja na YoY / MoM komparaciji

**Datum:** 10. septembar 2026.  
**Autor / Asistent:** Antigravity AI  
**Komponenta:** `src/components/transport/YoYComparison.jsx`  
**Zahtjev korisnika:**
Korisnik je tražio da se na tabu YoY komparacija, a posebno u sekciji MoM (Mjesec na prethodni mjesec), tabele postave tako da:
1. Uvijek u prvoj koloni stoji **stariji period / mjesec** (npr. Novembar 2024.), a u drugoj koloni **noviji period / mjesec** (npr. Decembar 2024.).
2. Razlika se računa kao: `Noviji period - Stariji period`.
3. Indikatori i boje promjene postotka:
   - **🔴 Crvena boja**: Ukoliko je trošak u novijem periodu porastao (`+X%`).
   - **🟢 Zelena boja**: Ukoliko je trošak u novijem periodu pao tj. ostvarena ušteda (`-X%`).

---

## 1. Implementirane izmjene
U komponenti `src/components/transport/YoYComparison.jsx`:
- **Unificirana funkcija `renderComparisonTable`:**
  - Parametri i kolone su strogo raspoređeni:
    - Kolona 1: `olderLabel` (stariji period, običan font)
    - Kolona 2: `newerLabel` (noviji period, istaknut bold font i blagi indigo akcent)
    - Kolona 3: `Razlika (KM)` = `Noviji trošak - Stariji trošak`
    - Kolona 4: `YoY %` ili `MoM %` sa bedževima:
      - 🔴 `+X%` za porast troška
      - 🟢 `-X%` za smanjenje troška / uštedu
- **Pozivi za sve 4 tabele:**
  1. *1. Komparacija po Tipu Mehanizacije*: Starija godina lijevo, novija desno.
  2. *2. Komparacija po Segmentima Troškova*: Starija godina lijevo, novija desno.
  3. *3. Mjesec na Isti Mjesec Prošle Godine*: Isti mjesec starije godine lijevo, novije desno.
  4. *4. Mjesec na Prethodni Mjesec (MoM)*: Prethodni mjesec (npr. Novembar 2024.) lijevo, tekući mjesec (npr. Decembar 2024.) desno, sa zaglavljem `MoM %`.
- **Zaglavlje perioda:**
  - Prilagođeno da prikazuje hronološki raspon (npr. `Period 01.-06. (2025. vs 2026.)`).

---

## 2. Verifikacija
- `npm run build`: Uspješno kompajlirano bez grešaka.
- Testiran MoM i YoY prikaz za sve kombinacije godina i mjeseci.
