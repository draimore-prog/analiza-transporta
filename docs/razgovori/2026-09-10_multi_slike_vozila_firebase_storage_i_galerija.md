# Upload do 10 slika po vozilu, Firebase Storage i interaktivna galerija

**Datum:** 10. septembar 2026.  
**Autor:** Antigravity AI & Emir Duraković  
**Link stranice:** [Logistika - Matična baza flote](https://analiza-transporta-flota.web.app/?portal=transport&stranica=maticna-baza-flote)

---

## 1. Zahtjev korisnika
1. Provjeriti i osigurati upload slika za matične podatke voznog parka (`maticna-baza-flote`).
2. Omogućiti dodavanje **do 10 fotografija** po vozilu.
3. Kreirati moderan i pregledan prikaz (interaktivna galerija / lightbox).
4. Povezati sve sa **Firebase Storage** infrastrukturom uz trajnu pohranu u Firestore bazi.

---

## 2. Analiza i Otklanjanje Uzroka
- Ranije je u `src/lib/firebase.js` bila privremena konfiguracija sa `analiza-transporta-flota.appspot.com`. Preuzeta je zvanična i verifikovana Firebase WEB konfiguracija preko CLI-ja:
  - `storageBucket`: `analiza-transporta-flota.firebasestorage.app`
  - `apiKey`: `AIzaSyDyYOLagPwhGirEfMXbqAClooDFODUVb2M`
  - `appId`: `1:1097206634987:web:178e18377696faf183e1ae`
- U `storage.rules` je ažurirano i deployano pravilo koje omogućava upload slika do 20MB na svim putanjama (`vehicles/...`).

---

## 3. Implementirane funkcionalnosti

### A. Upload i Menadžment Slika (`EditVehicleModal.jsx` & `fileUpload.js`)
- Podržan odabir **više slika odjednom** (do maksimalno 10 slika po vozilu).
- Slike se prije slanja automatski komprimuju na klijentu (Canvas kompresija do 1600px uz očuvanje kvaliteta).
- Prikaz statusa uploada u realnom vremenu: `Učitavanje 2 od 4 slike na Firebase Storage...`.
- Za svaku sliku u formi je omogućen:
  - **Pregled:** Uvećanje slike na klik.
  - **Glavna slika (⭐):** Mogućnost postavljanja bilo koje slike kao naslovne (premješta se na poziciju #1).
  - **Uklanjanje:** Brisanje neželjene slike prije ili nakon snimanja.
  - **Brojač preostalih mjesta:** Prikazuje npr. `4 / 10 slika`.

### B. Interaktivna Galerija i Lightbox (`VehicleCardModal.jsx`)
- U kartonu vozila ugrađen je vrhunski vizuelni blok:
  - **Hero prikaz:** Veliki format trenutno odabrane slike sa bedžom glavne slike i brojačem (`3 / 7`).
  - **Horizontalni strip sličica:** Brzo prebacivanje klikom na bilo koju od učitanih slika.
  - **Dugme za cijeli ekran (Lightbox):** Otvara crni kinematografski modal sa navigacijskim strelicama (`<` i `>`), podrškom za tastaturu (lijeva/desna strelica i `Esc`), trakom sličica na dnu, te dugmetom za preuzimanje slike u punoj rezoluciji.
  - Ako vozilo nema slika, prikazuje se poziv na akciju sa dugmetom `+ Dodaj slike (do 10)`.

### C. Matična Tabela Flote (`MasterFleetTable.jsx`)
- U tabeli matične baze flote, pored registracije se prikazuje minijatura naslovne slike vozila, a ukoliko vozilo posjeduje više slika, prikazan je diskretan bedž sa ukupnim brojem fotografija (npr. `+4`).

---

## 4. Status Deploymenta
- Pravila za Firebase Storage uspješno deployana (`storage.rules`).
- Web aplikacija testirana, prevedena (`npm run build`) i deployana na Firebase Hosting.
- Sve promjene commitovane na Git i pushane na `origin/master` (commit `05fb917`).
