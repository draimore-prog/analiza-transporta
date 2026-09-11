# Zapisnik promjena: Skaliranje forme na jedan ekran, zaključani koraci, sistemska tema i notifikacije

**Datum:** 11. septembar 2026.  
**Projekat:** Bingo Servis Mehanizacije / Analiza Transporta & Radionica  
**Platforma:** Web (`https://analiza-transporta-flota.web.app`) & Android mobilna aplikacija (`servis-mobilna-app`)  

---

## 1. Zahtjevi korisnika
1. **Skaliranje prozora forme na jedan ekran telefona**:
   - Svaki pojedinačni prozor/korak (1 do 4) forme mora stati na jedan ekran mobilnog telefona bez vertikalnog skrolovanja.
2. **Zaglavlje aplikacije**:
   - Naslov "Terenski radni nalozi" mora biti lijepo raspoređen i poravnat sa ikonom i statusom.
3. **Uklanjanje duplog hamburger menija**:
   - Postojala su dva gumba sa "tri linije" (jedan u zaglavlju i jedan u plavoj kartici korisnika). Jedan je uklonjen.
4. **Onemogućavanje preskakanja koraka**:
   - Serviser mora ići striktno redoslijedom (korak 1 -> korak 2 -> korak 3 -> korak 4). Onemogućeno je klikanje koraka unaprijed.
5. **Uklanjanje suvišnih opcija**:
   - Iz menija su uklonjene opcije "Serviserski portal", "Kartoteka vozila" i "Glavna aplikacija transport i flota".
6. **Automatsko praćenje teme telefona**:
   - Ako je na telefonu uključen tamni način rada, aplikacija ima tamnu podlogu i svijetla slova.
   - Ako je na telefonu uključen svijetli način rada, aplikacija ima svijetlu podlogu i tamna slova.
7. **Detaljna analiza i rješavanje notifikacija**:
   - Identifikacija i otklanjanje svih uzroka izostanka zvučnih i push obavještenja pri kreiranju i dodjeli novih naloga.

---

## 2. Implementirane izmjene

### A. Skaliranje koraka čarobnjaka (`FieldWorkOrderForm.jsx`)
- **Korak 1 (Jedinica & zadatak):**
  - Kartica dodijeljene jedinice kompaktno sažeta (tip, proizvođač, model, lokacija i šasija).
  - Prekidač vrste intervencije ("Redovni pregled" vs "Kvar / popravka") dizajniran u 2 kompaktna dugmeta.
- **Korak 2 (Ček-lista 8 sklopova):**
  - Svih 8 stavki mehanizacije formatirano u ultra-kompaktne redove s inline brzim `✓ OK` i `⚠️ Kvar` prekidačima.
  - Dugme "KLIKNI OVDJE: OZNAČI SVE KAO ISPRAVNO" omogućava potvrdu u jednoj sekundi.
- **Korak 3 (Radovi i dijelovi):**
  - Horizontalni čipovi s najčešćim šablonima intervencija.
  - Kompaktna tekstualna polja (3 reda za radove, 2 reda za utrošene dijelove).
- **Korak 4 (MTH & 5 fotografija):**
  - Polje za radne sate (MTH) sa jasnom oznakom obaveznosti.
  - 5 slotova za fotografije organizovano u horizontalni grid od 5 kolona (`grid grid-cols-5`), omogućavajući pregled svih 5 slika istovremeno na jednom ekranu telefona.
  - Glavno dugme "ZAKLJUČI I POŠALJI NALOG" smješteno u dno forme.

### B. Strogi sekvencijalni tok (Zaključavanje steppera)
- U stepperu na vrhu forme dodano `disabled={s.id > currentStep}`.
- Serviser ne može kliknuti na budući korak dok ne ispuni uslove i ne klikne dugme "Dalje" (prelazak sa koraka 1 na korak 2 zahtijeva odabir mašine, korak 4 zahtijeva MTH i minimalno 1 sliku).
- Serviser uvijek može slobodno kliknuti unazad na prethodno završene korake radi provjere ili korekcije.

### C. Zaglavlje i uklanjanje duplog menija (`FieldOrdersDashboard.jsx`)
- Uklonjen je višak hamburger dugmeta sa plave kartice servisera i zamijenjen elegantnom statusnom značkom "Zadaci" sa brojačem aktivnih naloga.
- Jedino hamburger dugme ostaje u gornjem lijevom uglu zaglavlja.
- Naslov "Terenski radni nalozi" je poravnat sa `truncate`, responsive veličinom slova i podnaslovom "Bingo Servis Mehanizacije • Radionica".
- Iz slide-over ladice uklonjene su sve navigacijske stavke prema glavnoj aplikaciji i kartoteci.

### D. Dinamičko praćenje teme telefona (Dark / Light)
- U `src/app/page.jsx`:
  - Dodat je dinamički `window.matchMedia("(prefers-color-scheme: dark)")` listener koji odmah reaguje na promjenu sistemske teme telefona bez potrebe za osvježavanjem stranice.
  - Dodat je prilagođeni `systemcolorschemechange` event.
- U `servis-mobilna-app/App.js`:
  - Uvezen je React Native `useColorScheme()`.
  - Sistemska tema se automatski prenosi na native `StatusBar` (`light-content` / `dark-content`), boju pozadine `SafeAreaView` i injektuje direktno u WebView (`document.documentElement.classList.toggle("dark")`).

### E. Otklanjanje uzroka za notifikacije
1. **Audio Autoplay blokada**: Web Audio API zahtijeva inicijalnu korisničku interakciju. Dodan je automatski listener na prvi dodir ekrana koji budi `AudioContext`.
2. **Konekcija i push tokeni**:
   - Kreirana je Android Firebase aplikacija `ba.bingo.servismehanizacije` i dodat `google-services.json` u `servis-mobilna-app/`.
   - `dispatchPushNotificationToServisers` proširen da prihvata sve formate Expo tokena i bilježi status dostave.
   - U `App.js` dodana je proaktivna provjera pri pokretanju aplikacije: ako postoji nalog kreiran u zadnjih 60 minuta koji serviser nije vidio, odmah se oglašava lokalni alarm sa zvukom i vibracijom.

---

## 3. Verifikacija i distribucija
1. **Next.js Production Build**: `npm run build` završen sa 100% uspjeha u 2.9s.
2. **Firebase Hosting**: Raspoređeno na produkciju (`https://analiza-transporta-flota.web.app`).
3. **EAS OTA Update**: Publikovano na Expo kanal `preview` za instant ažuriranje mobilne aplikacije na uređajima.
4. **Git Version Control**: Sve izmjene evidentirane i poslane na `origin/master`.
