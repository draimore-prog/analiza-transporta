# Zapisnik i Odluke: Aktivna Vozila na Nalogu, Izbor Mobilnog Servisera i Dozvole/Notifikacije na Aplikaciji

**Datum:** 10. septembar 2026.  
**Projekat:** Logistika - Servis motornih vozila (`analiza-transporta-master` & `servis-mobilna-app`)  
**Produkcija:** [https://analiza-transporta-flota.web.app](https://analiza-transporta-flota.web.app)

---

## 1. Zahtjevi Korisnika
1. **Web Portal - Radni Nalozi**:
   - Dozvoliti odabir isključivo **Aktivnih** vozila (isključiti rashodovana, prodata, neaktivna).
   - Polje za zaduženog servisera (`assignedTo`) redefinisati kao **dropdown / autofill** sa izborom korisnika koji imaju rolu **mobilni serviser** (ili serviser), uz mogućnost unosa drugog vanjskog partnera po potrebi.
2. **Mobilna Aplikacija (`servis-mobilna-app`)**:
   - Prilikom pokretanja zatražiti dozvole (permissions) za notifikacije, kameru i galeriju slika.
   - Konfigurisati Android notifikacijski kanal visokog prioriteta (`Radni Nalozi Servisa`) sa zvukom i vibracijom.
   - Postaviti real-time notifikacije (Firestore listener i WebView bridge) tako da kada mobilni serviser dobije novi radni nalog, obavještenje prođe direktno kroz notifikacijski kanal na telefonu.

---

## 2. Implementirane Izmjene

### A. Web Portal
- **`CreateWorkOrderModal.jsx`**:
  - Uvezen `normalizeVehicleStatus` iz `@/lib/calculations.js`.
  - Flota za pretragu i odabir filtrirana na: `normalizeVehicleStatus(v.status) === "Aktivno"`.
  - Dodat prop `users` (proslijeđen iz `page.jsx`).
  - Polje "Zaduženi Mobilni Serviser" pretvoreno u selektor koji lista sve korisnike sa rolom `mobile_serviser` i `serviser` (npr. `Mirnes Hasić (Mobilni serviser)`), uz opciju za unos vanjskog servisa.
- **`FieldWorkOrderForm.jsx`**:
  - Također filtrirana lista pretrage vozila na samo `normalizeVehicleStatus(v.status) === "Aktivno"`.
- **`notificationSound.js`**:
  - Dodat bridge: `window.ReactNativeWebView.postMessage(JSON.stringify({ type: "NOTIFICATION", title, body }))` tako da web app automatski šalje event nativnoj aplikaciji kada stigne nalog.

### B. Mobilna Aplikacija (`servis-mobilna-app`)
- **`package.json` & `app.json`**:
  - Instaliran `expo-notifications`.
  - Dodane dozvole `POST_NOTIFICATIONS`, `CAMERA`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `VIBRATE`, `RECEIVE_BOOT_COMPLETED`.
  - Registrovan plugin `expo-notifications`.
- **`App.js`**:
  - Na mount-u automatski traži permisije za notifikacije (`Notifications.requestPermissionsAsync()`), kameru (`ImagePicker.requestCameraPermissionsAsync()`) i galeriju (`ImagePicker.requestMediaLibraryPermissionsAsync()`).
  - Kreiran Android notification channel `"radni-nalozi-channel"` (`importance: MAX`, `sound: default`, vibracija).
  - Postavljen real-time Firestore listener na `work_orders` kolekciju (gdje je status `pending` ili `in_progress`), koji pri kreiranju novog naloga kreira instantnu lokalnu notifikaciju.
  - Povezan `onMessage` handler na `WebView` koji također hvata in-app web alarme i konvertuje ih u nativne notifikacije.
