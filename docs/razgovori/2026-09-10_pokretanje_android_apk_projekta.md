# Zabilješka: Pokretanje nativnog Android APK projekta i zvučnih notifikacija

**Datum:** 10. septembar 2026.  
**Učesnici:** Voditelj mehanizacije / Antigravity AI  
**Tema:** Inicijalizacija Capacitor Android projekta, zvučni alarm za novi nalog i automatizacija izgradnje APK paketa.

---

### 1. Šta je urađeno
1. **Nativna Android Capacitor integracija:**
   - Instalirani paketi `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`.
   - Konfigurisan `capacitor.config.json` sa identifikatorom aplikacije `ba.bingo.servismehanizacije` i nazivom `Bingo Servis Mehanizacije`.
   - Generisan kompletan Android Studio projekat u direktoriju `android/`.
   - Podešen `AndroidManifest.xml` sa zaključanom portretnom orijentacijom (`screenOrientation="portrait"`), dozvolama za kameru, vibraciju, internet i notifikacije.
2. **Real-time zvučni alarm i vibracija (`src/lib/notificationSound.js`):**
   - Implementiran Web Audio sintetizator (ugodan, jasan trotonski alarm D5 -> A5 -> D6).
   - Serviser na mobitelu dobija zvučni signal i vibraciju telefona kada voditelj u skladištu dodijeli novi radni nalog.
   - Prikazuje se istaknuti animirani baner na vrhu ekrana sa dugmetom: `⚡ OTVORI I POPUNI ODMAH`.
   - Dodat taster za testiranje zvuka alarma u zaglavlju mobilnog portala.
3. **Automatizacija izgradnje APK paketa u Cloud-u (`.github/workflows/build-apk.yml`):**
   - Kreiran GitHub Actions workflow koji na svaki push ili ručno pokretanje automatski u oblaku (Ubuntu + Java 21 + Android SDK + Gradle) kompajlira `app-debug.apk` bez potrebe za instalacijom Android Studio alata na lokalnom računaru.
4. **Deploy:**
   - Web aplikacija ažurirana i objavljena na Firebase Hosting (`https://analiza-transporta-flota.web.app`).
   - Sve izmjene pohranjene na GitHub (`origin/master`).
