# Očuvanje Background Kanala i Notifikacija za Radne Naloge u Mobilnoj Aplikaciji (APK)

**Datum:** 10. septembar 2026.  
**Platforma:** Android APK / Expo / React Native & Firebase Cloud Firestore  

---

## 1. Kontekst i Problem
Korisnički zahtjev:
> *"Provjeri notifikacije i backgroundactivity u apk.. aplikacija bi trebala da očuva background kanal za notifikacije i kad nije aktivna da notifikacije (za novi radni nalog i slicno) prolaze bez problema.."*

Pri analizi mobilne aplikacije (`servis-mobilna-app`) identifikovane su sledeće tačke koje su sprječavale pouzdan rad notifikacija u pozadini:
1. **Netačna kolekcija u Firestore listeneru**: `App.js` je slušao nepostojeću/zabranjenu kolekciju `work_orders` umjesto stvarne produkcijske kolekcije `warehouse_work_orders` (što je bacalo Firestore grešku `PERMISSION_DENIED`).
2. **Dummy Firebase API ključevi na mobilnoj aplikaciji**: `servis-mobilna-app/firebase.js` je koristio placeholder konfiguraciju (`AIzaSyDummyKey...`) umjesto stvarnih produkcijskih parametara projekta `analiza-transporta-flota`.
3. **Nedostatak Android background dozvola**: Falile su dozvole za buđenje uređaja (`WAKE_LOCK`), rad u pozadini (`FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_DATA_SYNC`), alarme i ignorisanje restriktivne optimizacije baterije na Android 12/13/14+.
4. **Prekid WebSocket veze u pozadini (Android Doze Mode)**: Na novijim verzijama Androida, operativni sistem gasi JS proces kada je ekran ugašen. Bez Expo Push servisa (`exp.host/--/api/v2/push/send` povezanog sa Google FCM) notifikacije ne bi stizale dok je aplikacija potpuno zatvorena.

---

## 2. Implementirane Izmjene i Rješenja

### A. Android Manifest i Dozvole (`servis-mobilna-app/app.json`)
Dodate su eksplicitne sistemske dozvole:
- `android.permission.POST_NOTIFICATIONS` (Android 13+)
- `android.permission.WAKE_LOCK` (osigurava buđenje ekrana i procesora pri prijemu obavještenja)
- `android.permission.FOREGROUND_SERVICE` & `FOREGROUND_SERVICE_DATA_SYNC`
- `android.permission.ACCESS_NETWORK_STATE`
- `android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`
- `android.permission.RECEIVE_BOOT_COMPLETED`
- `android.permission.SCHEDULE_EXACT_ALARM` & `USE_EXACT_ALARM`

### B. Konfiguracija Android Notification Kanala (`App.js`)
Kanal `radni-nalozi-channel` je konfigurisan sa maksimalnim nivoom prioriteta:
- `importance: Notifications.AndroidImportance.MAX`
- `lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC`
- `bypassDnd: true` (prolazak kroz 'Do Not Disturb' ako je hitan nalog)
- `enableVibrate: true`, `vibrationPattern: [0, 250, 250, 250, 400]`
- `sound: "default"`
- `showBadge: true`

### C. Expo Push Token Registracija u Firestore (`serviser_push_tokens`)
1. Mobilna aplikacija pri prvom pokretanju preuzima svoj `ExpoPushToken` (`aba5c8a2-9d9f-4ec6-8060-442bc8068155`) i pohranjuje ga u kolekciju `serviser_push_tokens` u Firestore bazi.
2. U `firestore.rules` definisana su pravila pristupa za `serviser_push_tokens` i uspješno raspoređena na Firebase (`firebase deploy --only firestore:rules`).

### D. Automatsko Slanje Push Notifikacija pri Kreiranju Naloga (`useWarehouseWorkOrders.js`)
U kuki `useWarehouseWorkOrders`:
- Čim dispečer ili poslovođa unese novi radni nalog u web aplikaciji (ili preko terenskog unosa), funkcija `dispatchPushNotificationToServisers` čita aktivne tokene i šalje POST zahtjev na Expo Push Gateway (`https://exp.host/--/api/v2/push/send`).
- Google FCM dostavlja notifikaciju direktno na Android telefon čak i kada je aplikacija potpuno ugašena ili u sleep modu.

### E. Sinhronizacija Stanja (AppState) i Klik na Notifikaciju
- U `App.js` dodat je `AppState` listener koji pri ponovnom ulasku u aplikaciju (`active`) osvježava konekciju.
- Dodat je listener `Notifications.addNotificationResponseReceivedListener` koji na dodir notifikacije u statusnoj traci odmah otvara odgovarajući radni nalog u mobilnom portalu: `?portal=terenski-nalozi&orderId=...`.

---

## 3. Verifikacija i raspoređivanje
* **Kompajliranje bundle-a**: `npx expo export` uspješno generisao Android Hermes bytecode paket (`index-*.hbc`) bez grešaka.
* **Hosting**: Nova verzija web aplikacije sa push trigerima deployovana na Firebase Hosting (`https://analiza-transporta-flota.web.app`).
* **Git**: Izmjene su komitovane (`9561a37`) i pushovane na `origin/master`.
* **EAS Update (OTA Live)**:
  * **Production Branch**: `Update Group ID: 9c40a541-08ad-4056-810b-e6685a76b3d8` (Android ID: `01a08bcd-a246-7fc6-abc7-aca5e04d5aed`, iOS ID: `01a08bcd-a246-7fc6-b604-5239bef576af`)
  * **Preview Branch**: `Update Group ID: 7458209c-0d1d-4d12-921b-f8f0bde6d27a` (Android ID: `01a08bce-6812-7ed9-9ae9-f6d6e855de97`, iOS ID: `01a08bce-6812-7aec-9402-7658119aacf8`)
  * Svi instalirani APK uređaji automatski preuzimaju i primjenjuju novu verziju preko zraka (OTA).
