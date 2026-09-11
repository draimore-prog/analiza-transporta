# Zapisnik: Implementacija pozadinskog aktivnog servisa i praćenja notifikacija nakon gašenja mobitela

**Datum:** 11. septembar 2026.  
**Projekat:** Bingo MotorFix (Mobilna Aplikacija za Servisere & Web Portal)  
**Status:** Implementirano, integrisano, deployano na Firebase Hosting i pokrenut EAS build.

---

## 1. Zahtjev korisnika
Korisnik je zatražio rješenje za kontinuirano praćenje notifikacija o novim radnim nalozima:
> *"napravi background active dodatak uz apk koji ce pratiti notifikacije i kad je aplikacija skroz zatvorena, npr kad je bio ugašen mobitel"*

---

## 2. Analiza problema i uzroka
Prethodno stanje je imalo dva ključna nedostatka:
1. **Gubitak memorijskog stanja pri gašenju:**
   - Lista prethodno oglašenih naloga (`alertedOrdersRef`) čuvala se samo u RAM memoriji React komponente. Pri gašenju mobitela ili svajpovanju aplikacije, RAM se brisao.
   - Pri ponovnom pokretanju, varijabla `isFirstLoad` je bila postavljena na `true`, što je **tiho upisivalo sve postojeće naloge bez oglašavanja** kako bi se izbjegao spam. Zbog toga serviser nikada nije dobio obavještenje o nalozima koji su kreirani dok je telefon bio ugašen!
2. **Prestanak rada nakon svajpovanja aplikacije:**
   - Bez konfigurisanog `BackgroundFetch` modula sa parametrima `stopOnTerminate: false` i `startOnBoot: true`, Android OS gasi JavaScript runtime čim korisnik zatvori aplikaciju iz Recent Apps liste.

---

## 3. Realizovano rješenje (Background Active Watcher)

### A. Trajna perzistencija u `AsyncStorage`
- Integrisan `@react-native-async-storage/async-storage` za trajno čuvanje historije oglašenih naloga (`@bingo_motorfix_alerted_orders_v1`) i vremenske oznake zadnje provjere (`@bingo_motorfix_last_check_timestamp`).
- Čak i kada se telefon ugasi, isprazni baterija ili ponovo pokrene, lista već oglašenih naloga ostaje netaknuta.

### B. Novi modul `backgroundWatcher.js`
- **Lokacija:** `servis-mobilna-app/backgroundWatcher.js`
- **Headless Task:** Registrovan `BINGO_MOTORFIX_BACKGROUND_WATCHER_V1` na nivou `index.js` prije montiranja React komponente.
- **Android BackgroundFetch konfiguracija:**
  - `startOnBoot: true` — Android OS (preko `WorkManager` / `JobScheduler`) automatski aktivira provjeru čim se telefon upali nakon što je bio ugašen (`RECEIVE_BOOT_COMPLETED`).
  - `stopOnTerminate: false` — zadatak ostaje registrovan u Android sistemu i kada korisnik skroz zatvori ili svajpuje aplikaciju.
- **Catch-Up sinhronizacija:** Čim se telefon upali ili aplikacija probudi, automatski se povlače svi nalozi sa statusom `pending` ili `in_progress` i provjeravaju naspram trajne baze. Ukoliko je dispečer kreirao nalog dok je mobitel bio ugašen, telefon **odmah aktivira zvučni i vibracijski alarm sa prefiksom `🔔 [Propušten nalog]`**.

### C. Tihi statusni 24/7 Foreground Service indikator
- Kreiran trajni Android notifikacioni kanal `motorfix-service-status-channel` (`LOW` prioritet, bez ometanja zvuka) sa trajnom notifikacijom:
  > *"🔧 Bingo MotorFix • Praćenje naloga aktivno (24/7)"*
- Ovaj status štiti proces od agresivnog Android Low Memory Killer-a (LMK) i osigurava neprekidan rad.

### D. Upravljanje iz menija aplikacije
- U mobilnom drawer meniju dodano dugme:
  - `POZADINSKI SERVIS (PROVJERI 24/7 RAD)` — omogućava serviseru ručnu dijagnostiku i provjeru statusa pozadinske sinhronizacije i propuštenih naloga u bilo kom trenutku.

---

## 4. Build & Deployment
- Firebase Hosting: Ažuriran live web portal sa podrškom za `CHECK_BACKGROUND_SYNC`.
- EAS Update: Objavljeno ažuriranje `V1.15` za postojeće instalacije.
- EAS Cloud Build: Pripremljen puni Android native APK build (v1.14 / versionCode: 4).
