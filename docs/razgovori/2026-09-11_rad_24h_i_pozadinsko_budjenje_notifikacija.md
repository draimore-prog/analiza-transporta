# Zapisnik promjena: Rad 24h u pozadini, izuzeće od uštede baterije i TaskManager pozadinsko buđenje

**Datum:** 11. septembar 2026.  
**Projekat:** Bingo Servis Mehanizacije / Analiza Transporta & Radionica  
**Platforma:** Web (`https://analiza-transporta-flota.web.app`) & Android mobilna aplikacija (`servis-mobilna-app`)  

---

## 1. Zahtjevi korisnika
1. Osigurati da aplikacija na mobitelu zatraži dozvolu za **rad 24h u pozadini** bez gašenja od strane Android sistema (isključenje iz uštede baterije / Android Doze moda).
2. Osigurati da notifikacije stižu pouzdano i kada aplikacija nije korištena duži vremenski period (npr. 6h ili više).
3. Provjeriti sve Firebase i Expo servise vezane za notifikacije i ugraditi sve potrebne module za neometano pozadinsko buđenje (`background notification wake up`).

---

## 2. Implementirane izmjene i arhitektura

### A. Dodavanje i konfiguracija novih modula (`servis-mobilna-app`)
- Instalirani službeni Expo moduli za pozadinski rad:
  - **`expo-task-manager`**: Omogućava registraciju headless pozadinskog taska (`BACKGROUND_NOTIFICATION_TASK`) koji se izvršava kada stigne notifikacija, čak i ako je proces aplikacije suspendovan.
  - **`expo-intent-launcher`**: Omogućava direktno pozivanje nativnog Android dijaloga za izuzeće iz uštede baterije (`ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`).

### B. Izuzeće od uštede baterije (`App.js`)
- Implementirana nativna funkcija `requestBatteryOptimizationExemption()` koja cilja paket `ba.bingo.servismehanizacije`:
  ```javascript
  IntentLauncher.startActivityAsync(
    IntentLauncher.ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
    { data: `package:${pkg}` }
  );
  ```
- Pri prvom pokretanju aplikacija automatski otvara dijalog s pitanjem korisniku da dozvoli rad u pozadini.
- U meniju aplikacije dodano je namensko dugme *"DOZVOLI RAD 24H (ISKLJUČI UŠTEDU BATERIJE)"* tako da serviser u svakom trenutku može ponovo otvoriti sistemske postavke jednim klikom.

### C. Pozadinski Task Manager za buđenje
- U `App.js` definisan je zadatak:
  ```javascript
  TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
    // Android OS budi headless task
  });
  ```
- Registrovan u sistemu pomoću `Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK)`.

### D. Pojačani parametri Push poruka (`useWarehouseWorkOrders.js`)
- Push poruke poslane na `https://exp.host/--/api/v2/push/send` proširene su ključnim parametrima za buđenje iz Android Doze moda:
  - `priority: "high"` (forsira trenutnu isporuku umjesto čekanja)
  - `channelId: "radni-nalozi-channel"` (kanal s maksimalnim prioritetom, zvukom i vibracijom)
  - `_displayInForeground: true`
  - `badge: 1`
  - `ttl: 2419200` (maksimalni rok čuvanja na FCM serveru)

---

## 3. Status distribucije
- **Web produkcija:** Raspoređeno na Firebase Hosting (`https://analiza-transporta-flota.web.app`).
- **EAS OTA Update:** Poslano na Expo preview granu.
- **Git Version Control:** Izmjene zabilježene i poslane na `origin/master`.

---

## 4. Rješenje za pozadinske notifikacije (FCM V1 ključ)
- **Problem:** Expo Push servis nije mogao prosljeđivati poruke na Google FCM jer na Expo Dashboardu nije bio povezan Google Service Account V1 ključ (greška `InvalidCredentials`).
- **Rješenje:** Korisnik je učitao Firebase Service Account JSON u Expo Credentials (Android -> FCM V1).
- **Verifikacija:** Testno slanje na oba registrovana servisera (`ExponentPushToken[-cYZrzBxEhroW9FtDLFsSo]` i `ExponentPushToken[6MsLFmLq8F5WDa9REIjRRY]`) je vratilo `status: "ok"` od strane Expo-a, a naknadna provjera računa (`getReceipts`) potvrdila uspješnu isporuku na Google FCM servere za oba uređaja.

---

## 5. Standard za inkrementalne OTA verzije (V1.1 ➔ V1.11 ➔ V1.12...)
- **Zahtjev korisnika:** Prilikom kreiranja update-a preko EAS-a primjenjivati inkrementalno označavanje verzija: `V1.1` -> `V1.11` -> `V1.12`...
- **Usklađivanje sa Expo Runtime Version:**
  - Da bi već instalirani APK (`runtimeVersion: "1.1.0"`) mogao bez reinstalacije preuzeti sve buduće inkrementalne OTA pakete, u `servis-mobilna-app/app.json` je fiksiran `"runtimeVersion": "1.1.0"`, dok se `"version"` inkrementira na `1.11`, `1.12`, itd.
  - U `FieldOrdersDashboard.jsx` se prikazuje trenutna verzija (npr. `V1.12 (Build 2026.09.11)`).
- **Objavljeno za V1.11 i V1.12:**
  - Web deployan na Firebase Hosting (`https://analiza-transporta-flota.web.app`).
  - EAS Update V1.12 objavljen na grani `preview` (Update ID: `01a09038-3850-7bd0-b992-e537231e1f17`).

---

## 6. Uklanjanje spama notifikacija, sakrivanje sidebara na mobitelu i favicon/ikona
1. **Zabrana notifikacija na prvo otvaranje i trajna deduplikacija:**
   - Uklonjeno oglašavanje alarma na prvo učitavanje i u `FieldOrdersDashboard.jsx` i u nativnom `App.js`.
   - Notifikacije se pokreću isključivo za prijavljenog korisnika i isključivo za NOVE naloge koji pristižu u realnom vremenu (`change.type === "added"`).
   - Svaki viđeni nalog se trajno pamti u `localStorage` (`seen_order_<id>`), čime je onemogućeno ponovno slanje ili oglašavanje.
2. **Sakrivanje i prikaz Sidebara na mobitelu:**
   - Dodana podrška za responsive sakrivanje bočne trake na manjim ekranima.
   - U `Header.jsx` ugrađeno hamburger dugme (`Menu`) koje otvara klizajući meni sa tamnom pozadinom.
   - U `Sidebar.jsx` ugrađeno dugme `X` za zatvaranje, a meni se automatski zatvara i na klik bilo koje navigacijske stavke ili klik izvan menija.
3. **Favicon, ikonica aplikacije i metapodaci:**
   - Kreirana je nova čista, ultra-premium 3D ikonica visoke rezolucije bez suvišnog teksta i bedževa:
     - Realističan moderan plavi tegljač (kamion) sa lijeve strane.
     - Industrijski žuti skladišni viljuškar sa desne strane.
     - Dva masivna ukrštena profesionalna hromirana mehanička ključa (okasti i viljuškasti sa preciznim čeličnim fasetama).
     - Tamna metalik pozadina sa suptilnim neonskim smaragdnim sjajem.
   - Ikonica je konvertovana i raspoređena u sve nativne i web rezolucije: `servis-mobilna-app/assets/icon.png`, `android-icon-foreground.png`, `public/icon.png`, `public/favicon.png` i `src/app/icon.png`.
   - Zvanični naziv u metapodacima i mobilnoj aplikaciji postavljen na **Bingo MotorFix**.

---


## 8. Postavljanje novog zvaničnog logotipa / ikonice i favicoma
- Korisnik je priložio novi logo (plavi tegljač i žuti viljuškar sa ukrštenim mehaničkim ključevima).
- Novi logo je uspješno konvertovan i postavljen na sve relevantne lokacije:
  - `public/favicon.png` (Web favicon)
  - `public/icon.png` (Web ikonica aplikacije)
  - `src/app/icon.png` (Next.js App router ikonica)
  - `servis-mobilna-app/assets/icon.png` (Glavna ikonica mobilne aplikacije)
  - `servis-mobilna-app/assets/android-icon-foreground.png` (Android adaptivna ikonica - prednji plan)
  - `servis-mobilna-app/assets/splash-icon.png` (Splash screen ikonica)
  - `servis-mobilna-app/assets/favicon.png` (Expo web favicon)
- Aplikacija je ponovo kompajlirana i objavljena na Firebase Hosting (`https://analiza-transporta-flota.web.app`) i putem EAS Update-a za mobilne korisnike.
