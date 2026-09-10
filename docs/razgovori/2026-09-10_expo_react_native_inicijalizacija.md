# Zabilješka: Inicijalizacija Expo React Native mobilne aplikacije za servisere

**Datum:** 10. septembar 2026.  
**Učesnici:** Voditelj mehanizacije / Antigravity AI  
**Tema:** Kreiranje nativne Expo (React Native) mobilne aplikacije za servisere skladišne mehanizacije umjesto Capacitora.

---

### 1. Šta je urađeno
1. **Kreiran Expo projekat (`servis-mobilna-app`):**
   - Projekat postavljen unutar podfoldera `servis-mobilna-app/` koristeći standardni Expo / React Native stack (`react-native: 0.86`, `react: 19.2`).
   - Povezan na istu Firebase Firestore bazu (`analiza-transporta-flota`).
2. **Korisnički interfejs prilagođen starijim radnicima:**
   - **Glavni ekran:**
     - Veliko dugme na vrhu: `➕ POKRENI NOVI NALOG` (veliki dodirni element, jasan kontrast).
     - Dva krupna tastera: `🟡 ČEKAJU NA RAD` i `🟢 ZAVRŠENI NALOZI`.
     - Krupne kartice radnih naloga sa oznakom viljuškara (22-26px monospace), modelom, lokacijom i instrukcijom voditelja.
     - Dugme: `⚡ OTVORI I POPUNI NALOG`.
   - **Ekran radnog naloga:**
     - **Fiksirana dodijeljena jedinica:** Ako je nalog dodijelio voditelj, podaci jedinice su zaključani (`🔒 ZADATAK OD VODITELJA`), nema biranja drugog viljuškara.
     - Krupno polje za radne sate (MTH) sa numeričkom tastaturom.
     - Ček-lista od 8 tačaka sa brzim tasterom `✓ SVE ISPRAVNO`.
     - Nativni pristup kameri telefona preko `expo-image-picker` za slikanje 5 slika sa automatskom kompresijom.
     - Dugme: `✓ ZAVRŠI I POŠALJI NALOG`.
3. **EAS Build konfiguracija (`eas.json`):**
   - Konfigurisana izrada gotovog samostalnog `.apk` paketa (`"buildType": "apk"`).
4. **Verifikacija:**
   - `npx expo export` uspješno kompajlirao Android bundle bez grešaka.
   - Glavni Next.js web portal uspješno verifikovan (`npm run build`).
