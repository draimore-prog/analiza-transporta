# Zabilješka: Instalacija Android SDK-a, konfiguracija PATH-a i priprema emulatora

**Datum:** 10. septembar 2026.  
**Učesnici:** Voditelj mehanizacije / Antigravity AI  
**Tema:** Kompletno podešavanje Android razvojnog okruženja za rad sa Expo aplikacijom i emulatorom.

---

### 1. Šta je instalirano i podešeno:

1. **Android CLI & SDK:**
   - Instaliran Google zvanični `android` CLI alat u: `C:\Users\emir.durakovic\AppData\AndroidCLI\`.
   - Android SDK lokacija: `C:\Users\emir.durakovic\AppData\Local\Android\Sdk`.
   - Instalirani paketi:
     - `platform-tools` (najnoviji `adb` v37.0.1).
     - `emulator` (nativni Google Android emulator).
     - `platforms/android-34` (Android SDK platforma).
     - `system-images/android-36/google_apis_playstore/x86_64` (slika sistema za emulator).

2. **Java Development Kit (JDK 17):**
   - Instaliran OpenJDK 17 (Temurin 17.0.12) u: `C:\Users\emir.durakovic\AppData\Local\Java\jdk-17.0.12+7`.
   - Postavljena varijabla `JAVA_HOME`.

3. **Korisničke varijable i PATH:**
   - `ANDROID_HOME` = `C:\Users\emir.durakovic\AppData\Local\Android\Sdk`
   - `ANDROID_SDK_ROOT` = `C:\Users\emir.durakovic\AppData\Local\Android\Sdk`
   - `JAVA_HOME` = `C:\Users\emir.durakovic\AppData\Local\Java\jdk-17.0.12+7`
   - U korisnički `PATH` trajno dodani:
     - `C:\Users\emir.durakovic\AppData\Local\Java\jdk-17.0.12+7\bin`
     - `C:\Users\emir.durakovic\AppData\Local\Android\Sdk\platform-tools` (`adb`)
     - `C:\Users\emir.durakovic\AppData\Local\Android\Sdk\emulator` (`emulator`)
     - `C:\Users\emir.durakovic\AppData\AndroidCLI` (`android`)

4. **Kreiran Android Virtual Device (AVD Emulator):**
   - Naziv uređaja: **`medium_phone`**
   - Komanda za pokretanje: `emulator -avd medium_phone` ili `android emulator start medium_phone`.
   - Expo komanda: `npm run android` unutar `servis-mobilna-app/` automatski prepoznaje i pali ovaj emulator.
