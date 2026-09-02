# 📝 Zabilješka: Firestore kao jedini izvor istine za uvoz i bazu podataka
*Datum: 02.09.2026.*

## 📌 Ključna Odluka i Dogovor
1. **Firestore kao primarna baza**:
   - Svi podaci od **2021. do 2026. godine (zaključno sa 06. mjesecom / junom 2026.)** su već verifikovani, usklađeni i trajno pohranjeni na Google Cloud Firestore bazi (`analiza-transporta-flota`).
2. **Procedura za nove uvoze (npr. juli / 7. mjesec 2026. i nadalje)**:
   - Svaki budući import se veže direktno na Firestore bazu.
   - Podaci iz novih Excel tabela se kompariraju sa postojećim zapisima u Firestoreu.
   - Postojeći podaci (2021–2025 i 2026 do 06. mjeseca) ostaju netaknuti.
   - U bazu se upisuje isključivo delta (novi i nedostajući troškovi) uz strogu deduplikaciju.
3. **Pravilo uvršteno u `.agents/AGENTS.md`**:
   - Pravilo #5 obavezuje svakog agenta na poštivanje ove arhitekture.
