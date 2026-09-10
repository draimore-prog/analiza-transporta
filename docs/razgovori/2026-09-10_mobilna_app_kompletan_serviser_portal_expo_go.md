# Integracija kompletnog serviser portala u mobilnu aplikaciju i Expo Go

**Datum:** 10. septembar 2026.  
**Autor:** Antigravity AI & Emir Duraković  
**Link portala:** [Logistika - Servis motornih vozila](https://analiza-transporta-flota.web.app/?portal=servisna-radionica)

---

## 1. Kontekst i zahtjev korisnika
Korisnik je specificirao tačne potrebe za mobilnu aplikaciju:
1. Ne prikazivati samo izolovanu formu za "Terenski unos", već **kompletan sadržaj koji mobilni serviser vidi na linku**:  
   `https://analiza-transporta-flota.web.app/?portal=servisna-radionica`
2. **Autentifikacija (Login):** Prije bilo kakvog prikaza podataka mora se prikazati identičan Login ekran kao na web stranici.
3. **Dark / White Mode Toggle:** Aplikacija mora sadržavati dugme za promjenu teme (svijetla / tamna tema) u samom zaglavlju serviser portala.
4. **Fluidnost i sprečavanje neprirodnog zumiranja:** Sučelje mora biti zaključano za nehotično zumiranje, odzumiranje ili elastični scroll.
5. **Expo Go podrška:** Omogućiti pokretanje i testiranje u hodu preko Expo Go klijenta bez čekanja na dugotrajni cloud build cijelog APK-a.

---

## 2. Implementirane izmjene

### A. Web Aplikacija (`src/components/serviser/ServiserDashboard.jsx` & `src/app/page.jsx`)
- U komponentu `ServiserDashboard` dodani su props `isDarkMode` i `setIsDarkMode`.
- U zaglavlje serviser portala ugrađeno je **dugme za promjenu teme** sa ikonama Sunce (`Sun`) i Mjesec (`Moon`), sa hover i active stanjima, usklađeno sa postojećom navigacijom.
- U `src/app/page.jsx` prilagođen je spoljni omotač (`min-h-screen w-full overflow-y-auto`) kako bi se osiguralo prirodno skrolovanje svih dugih lista i naloga na mobilnim uređajima.
- Aplikacija uspješno prevedena (`npm run build`) i deployana na Firebase Hosting (`https://analiza-transporta-flota.web.app`).

### B. Mobilna Aplikacija (`servis-mobilna-app/App.js` & `app.json`)
- Instaliran modul `react-native-webview` kompatibilan sa Expo SDK 57 (`npx expo install react-native-webview`).
- U `app.json` definisana dopuštenja za kameru, audio reprodukciju i galeriju fotografija.
- U `App.js` ugrađen optimizovani native WebView koji:
  - Učitava `https://analiza-transporta-flota.web.app/?portal=servisna-radionica`.
  - Injektuje `viewport` blokadu koja onemogućava slučajno zumiranje na dodir i dvoklik (`user-scalable=no, maximum-scale=1.0`).
  - Uključuje hardversku akceleraciju za 60fps renderovanje na Androidu (`androidLayerType="hardware"`).
  - Omogućava reprodukciju zvuka bez obaveznog prethodnog klika za alarme novih naloga (`mediaPlaybackRequiresUserAction={false}`).
  - Povezuje hardversko Android dugme "Nazad" (`BackHandler`) kako bi korisnik mogao navigirati unutar portala bez slučajnog izlaska iz aplikacije.
  - Prikazuje brendirani splash loader tokom učitavanja te offline ekran sa "Pokušaj ponovo" u slučaju nestanka mreže.

---

## 3. Način pokretanja u Expo Go
1. Na mobilnom uređaju instalirati aplikaciju **Expo Go** (Google Play Store ili App Store).
2. Prijaviti se na isti nalog (`draimore`) ili u aplikaciji odabrati "Scan QR code" / unijeti Expo URL:
   - Lokalna mreža: `exp://172.23.206.80:8085`
   - Tunnel server (pokrenut u pozadini na portu 8085).
3. Svaka naknadna izmjena na web portalu ili mobilnom omotaču automatski je dostupna bez novog APK builda.

---

## 4. Git i Deployment status
- Izmjene commitovane i pushane na `origin/master` (commit `47b30d1`).
- Firebase Hosting ažuriran i aktivan.
