# Zapisnik: Čišćenje korisničkih naloga i provjera sinhronizacije rola

**Datum**: 03.09.2026.  
**Projekat**: Analiza Transporta - Održavanje Flote (`analiza-transporta-flota`)

---

## 1. Problem i Analiza
- **Problem**: Korisnički nalozi su obrisani u Firebase konzoli pod *Authentication*, ali su se i dalje prikazivali na portalu.
- **Uzrok**: Portal koristi namjenski Firestore auth sistem pohranjen u kolekciji `app_users` (a ne Firebase Authentication servis). Brisanje iz Authentication servisa ne briše dokumente iz Cloud Firestore-a.
- **Zatečeno stanje**: U kolekciji `app_users` nalazila su se 4 naloga:
  - `emir.durakovic` (superadmin)
  - `silvio.suljic` (superadmin)
  - `dzenis` (viewer)
  - `milos` (viewer)

---

## 2. Poduzete Akcije
1. **Brisanje suvišnih naloga iz Firestore-a**:
   - Obrisani nalozi: `dzenis` i `silvio.suljic`.
   - Zadržani nalozi u `app_users`:
     - **Emir Duraković** (`emir.durakovic` – Super Administrator)
     - **Milos Milos** (`milos` – Analitičar / Viewer)

2. **Otklanjanje ranjivosti i poboljšanje koda**:
   - `src/hooks/useAuth.js`:
     - U funkciji `saveUserToFirestore` dodana je automatska sanitizacija objekata kako bi se uklonila `undefined` polja prije slanja na Firestore (čime se sprečava `Unsupported field value: undefined` greška).
     - U `onSnapshot` slušaču za `app_users` osigurano je ispravno pražnjenje liste kada se obrišu svi nalozi ili dođe do pražnjenja kolekcije.
   - `src/components/modals/AdminPanelModal.jsx` & `src/components/modals/EditUserModal.jsx`:
     - Osigurano je da se za neobavezna polja (poput email-a) ne prosljeđuje `undefined` već prazan string ili definisana vrijednost.

3. **Verifikacija**:
   - Izvršen testni ciklus kreiranja i brisanja korisnika na Firestore bazi (kreiranje novog korisnika i dodjela role, verifikacija prisustva, i potom brisanje).
   - Test uspješno prošao – sinhronizacija rola i naloga je 100% ispravna.
   - Next.js build uspješno kompajliran bez grešaka.
