# Zapisnik: Migracija Portala za Servisere na V2 i Otklanjanje Greške pri Prijavi

**Datum**: 03.09.2026.  
**Projekat**: Analiza Transporta - Održavanje Flote (`analiza-transporta-flota`)

---

## 1. Identifikovani Problemi

1. **Nedostajući modul u V2**:
   - U originalnoj V1 verziji (`dashboard12_troskova.html`), korisnik sa ulogom `serviser` (npr. radionički mehaničar) imao je namjenski ekran **"Servisna Radionica"** za brzu pretragu kartona vozila po registraciji ili garažnom broju, bez prikaza finansijskih KPI-eva.
   - U V2 verziji (`src/`), ovaj modul nije bio prebačen – `portalMode` je podržavao samo `transport` i `warehouse`, a `serviser` nije imao svoj ekran, niti su u modalu kartona vozila bili sakriveni iznosi troškova.

2. **Problem sa prijavom (Login)**:
   - Funkcija `login()` u `useAuth.js` se oslanjala isključivo na lokalni niz `users` koji se asinhrono punio preko Firestore `onSnapshot` slušača. Pri brzoj prijavi, postojala je trka (race condition) gdje korisnik još nije bio u lokalnom stanju, što je izazivalo lažnu grešku *"Neispravno korisničko ime ili lozinka!"*.
   - U `LoginModal.jsx`, poziv `onLogin` nije imao `await`, što je pri asinhronoj provjeri odmah vraćalo neuspješnu prijavu.
   - Kod korisnika `jasenko`, u email polju je bila greška u kucanju (`jasensko.mitrovic@bingotuzla.ba`), pa prijava putem email adrese nije radila.

---

## 2. Poduzete Akcije i Rješenja

1. **Kreiranje namjenskog Serviser Portala (`ServiserDashboard.jsx`)**:
   - Kreirana je nova komponenta `src/components/serviser/ServiserDashboard.jsx`:
     - Centriran, čist radionički interfejs prilagođen mehaničarima.
     - Brza pretraga po registraciji, garažnom broju, marki, modelu ili broju šasije sa automatskim predlaganjem (autocomplete).
     - Prikaz nedavno pregledanih vozila za brzi povratak.
     - Prikaz prijavljenog servisera i mogućnost odjave.
     - Za administratore: mogućnost povratka na Glavni Transport jednim klikom.

2. **Zaštita povjerljivih finansijskih podataka u Kartonu Vozila (`VehicleCardModal.jsx`)**:
   - Za rolu `serviser`, u `VehicleCardModal.jsx` uvedena je provjera `isServiser`:
     - **Sakriven** ukupni iznos uloženo u vozilo (zamijenjeno prikazom tipa/kategorije i garažnog broja).
     - **Sakriveni** interaktivni grafikoni godišnjih i mjesečnih finansijskih troškova.
     - **U tabeli radova sakrivena kolona "Iznos (KM)"** – serviser vidi isključivo datum, segment, opis popravke/zamijenjene dijelove, izvođača i prilog (radni nalog/sliku).
     - Onemogućeno uređivanje matičnih podataka vozila.

3. **Integracija u navigaciju i `page.jsx`**:
   - U `src/app/page.jsx`, dodan `portalMode === "serviser"` koji automatski renderuje `ServiserDashboard` čim se serviser prijavi.
   - U `Sidebar.jsx`, pod sekcijom *"Posebni Portali"*, administratorima je dodano dugme **🔧 Servisna Radionica** kako bi mogli ući u radionicu i testirati kartone.

4. **Ispravka autentifikacije i prijave (`useAuth.js` & `LoginModal.jsx`)**:
   - `login()` funkcija je pretvorena u `async` funkciju sa direktnim Firestore fallback upitom (`getDoc`/`getDocs`), tako da prijava uspijeva u prvoj milisekundi čak i ako lokalni snapshot još nije stigao.
   - U `LoginModal.jsx` dodan `await onLogin(...)`.
   - U Firestore bazi ispravljen nalog `jasenko` (ime: Jasenko Mitrović, email: `jasenko.mitrovic@bingotuzla.ba`).

5. **Verifikacija i Deployment**:
   - Pokrenut `npm run build` – aplikacija se kompajlira za 3.5s bez ijedne greške.
   - Povezan GitHub nalog i uspješno izvršen `git push origin master`.
   - Autentifikovan Firebase CLI i izvršen live deploy:
     - Komanda: `npx firebase deploy --only hosting`
     - Status: `+ Deploy complete!`
     - Live URL: `https://analiza-transporta-flota.web.app` (HTTP 200, `no-cache, no-store, must-revalidate`).
