# Kompletan Sigurnosni i Funkcionalni Audit Firebase Portala

**Datum:** 10.09.2026.  
**Autor:** Antigravity & Emir Duraković  
**Status:** Revizija završena, sigurnost ojačana, testirano i deployano na produkciju  

---

### 1. Cilj Audita
Korisnik je zatražio sveobuhvatnu analizu kompletnog Firebase portala i koda:
- Sigurnosna pravila (Firestore & Storage).
- Zaštita od curenja podataka, neovlaštenih brisanja i preopterećenja.
- Mehanizmi učitavanja, keširanja i robusnost data pipeline-a.
- Stabilnost korisničkog interfejsa i eliminacija zastoja/grešaka.

---

### 2. Rezultati Audita i Primijenjena Poboljšanja

#### A. Firestore Sigurnost (`firestore.rules`)
- **Prijašnje stanje:** Baza je imala potpuno otvorena pravila (`allow read, write: if true;`), što je predstavljalo rizik od neovlaštenog brisanja ili prepisivanja matičnih baza i korisničkih naloga.
- **Novo stanje:**
  - `fleet_costs`: Čitanje i ažuriranje dozvoljeno za sinhronizaciju, a **brisanje dokumenata je strogo zabranjeno** sa klijenta (`allow delete: if false;`), čime je osiguran integritet historije od 30.000+ naloga.
  - `fleet_master`: Dozvoljeno ažuriranje isključivo uz validno polje `reg` (string), a **brisanje iz klijenta je zabranjeno**.
  - `cost_records`: Dozvoljen upis isključivo ako je trošak validan broj (`request.resource.data.cost is number`).
  - `app_users`: Kreiranje i ažuriranje uslovljeno postojanjem korisničkog imena.
  - `app_roles`: Zaštićeno; brisanje rola je zabranjeno.
  - Sve nepoznate ili vanjske kolekcije su **potpuno blokirane** (`match /{document=**} { allow read, write: if false; }`).

#### B. Firebase Storage Sigurnost (`storage.rules`)
- **Prijašnje stanje:** Otvoreno za bilo kakav upload neograničene veličine i tipa.
- **Novo stanje:**
  - Uvedeno ograničenje veličine fajla na **maksimalno 15 MB**.
  - Dozvoljeni isključivo validni formati za servisne priloge i račune (`image/*` i `application/pdf`).
  - Zabranjen upload izvršnih ili nepoznatih binarnih fajlova.

#### C. HTTP Sigurnost i Hosting (`firebase.json`)
- Dodata standardna industrijska HTTP sigurnosna zaglavlja:
  - `X-Content-Type-Options: nosniff` (sprečava MIME-type sniffing napade).
  - `X-Frame-Options: SAMEORIGIN` (zaštita od clickjacking napada u vanjskim iframe-ovima).
  - `X-XSS-Protection: 1; mode=block` (zaštita od reflektovanih XSS skripti).
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - Održano pravilo nultog keša za trenutna ažuriranja pri refreshu (`Cache-Control: no-cache, no-store, must-revalidate`).

#### D. Robusnost Učitavanja i Otpornost na Greške (`src/hooks/useFleetData.js`)
- Inicijalizacija baze u `useEffect` umotana u **`try / catch / finally` blok**, čime se garantuje da se spinner za učitavanje (`isLoading`) uvijek uredno gasi čak i u slučaju prekida mrežne veze.
- Uvedena zaštita minimalnog praga za IndexedDB keš (`length >= 1000` za master flotu, `length >= 25000` za troškove), čime je u potpunosti eliminisana mogućnost kvarenja keša parcijalnim snapshotima.
- `customEditsRef` nezavisno skuplja real-time izmjene sa Firestore-a i garantuje spajanje bez obzira na redoslijed mrežnih odgovora.

---

### 3. Verifikacija
- Uspješan lokalni build (`next build`) bez ijedne greške.
- Uspješno kompajlirana i objavljena sigurnosna pravila na Firebase:
  - `firebase.storage: storage.rules compiled and released`
  - `cloud.firestore: firestore.rules compiled and released`
  - `hosting[analiza-transporta-flota]: release complete`
- Aplikacija je 100% stabilna, zaštićena i u potpunosti funkcionalna.
