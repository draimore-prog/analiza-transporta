# Analiza i Rješenje: Pozadinski Rad, Memorija i Push Notifikacije (Android)

**Datum:** 11.09.2026.  
**Projekat:** Bingo Servis Mehanizacije / Analiza Transporta  

---

## 1. Zašto se aplikacija gasi i zašto notifikacije prestaju stizati?

Kada se Android aplikacija zatvori (korisnik izađe ili swipe-uje aplikaciju iz liste nedavnih aplikacija):
1. **Gašenje procesa i JavaScript runtime-a**:
   - Android potpuno terminira Linux proces aplikacije.
   - Svi JavaScript listeneri u aplikaciji (`onSnapshot` Firestore listener na `warehouse_work_orders`) momentalno prestaju sa radom jer je proces uklonjen iz RAM memorije.
2. **OEM Optimizacija i Deep Sleep (Doze Mode)**:
   - Android proizvođači (Samsung OneUI, Xiaomi MIUI/HyperOS, Huawei EMUI, Realme/Oppo) agresivno zamrzavaju aplikacije i stavljaju ih u "Force Stop" stanje kako bi sačuvali bateriju.
   - U tom stanju, samo visoko-prioritetne poruke koje dolaze preko Google Play Services (FCM mrežnog nivoa) mogu probuditi uređaj i prikazati obavještenje.

---

## 2. Implementirane Izmjene u Kodu

### A. Optimizovan Push Payload za Expo / FCM V1 (`useWarehouseWorkOrders.js`)
U funkciji `dispatchPushNotificationToServisers` osigurano je:
- `channelId: "radni-nalozi-channel"`
- `priority: "high"`
- `sound: "default"`
- `android.channelId`, `android.priority: "high"`, `android.sound`, `android.vibrate`
- Standardna `title` i `body` polja u korijenu poruke kako bi operativni sistem Android automatski i samostalno iscrtao notifikaciju bez potrebe za pokretanjem JavaScript engine-a prije nego što korisnik klikne na nju.

### B. Proširenje Android Intent Bridge-a u Mobilnoj Aplikaciji (`App.js`)
- Dodata funkcija `openAutoStartSettings` koja prepoznaje i direktno otvara sistemske menije za **Auto-start / Rad u pozadini** za najčešće OEM proizvođače (Xiaomi, Huawei, Oppo, Vivo, Samsung).
- Dodata funkcija `openAppSettings` za direktan pristup postavkama dozvola i obavijesti.
- Povezane poruke iz WebView-a: `OPEN_AUTO_START_SETTINGS`, `OPEN_APP_SETTINGS`, `REQUEST_BATTERY_OPTIMIZATION`.

### C. Meni za Servisere sa Prečicama za Bateriju i Auto-start (`FieldOrdersDashboard.jsx`)
U ladici (hamburger meniju) dodate su opcije za servisere:
- **Isključi uštedu baterije (Rad 24h)**
- **Auto-start postavke (Xiaomi / Samsung / Huawei)**
- **Postavke aplikacije & Dozvole**
- **Test notifikacije na zaključanom ekranu sa odgodom od 5 sekundi**

---

## 3. Firebase Cloud Messaging (FCM V1) & EAS Povezivanje

U Firebase konzoli (`analiza-transporta-flota`):
1. Modul **Cloud Messaging** je podrazumijevano aktivan na Firebase backendu.
2. Za povezivanje sa EAS Push servisom (FCM V1 standard):
   - U Firebase Console ➔ **Project Settings** ➔ **Service Accounts**.
   - Kliknuti na **Generate new private key** (preuzima se JSON fajl).
   - U terminalu unutar `servis-mobilna-app/` pokrenuti `npx eas-cli credentials` ➔ Android ➔ Push Notifications ➔ Google Service Account i učitati preuzeti JSON fajl.
