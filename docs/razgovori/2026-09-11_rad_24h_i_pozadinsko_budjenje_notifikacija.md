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
