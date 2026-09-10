# Rješenje problema: Dupliciranje korisničkih naloga prilikom izmjene podataka

## Datum: 10.09.2026.

### Problem
Prilikom izmjene podataka korisničkog naloga u administraciji (npr. promjena korisničkog imena, ispravka formata ili izmjena uloge/lozinke), u listi korisnika bi se pojavio duplicirani nalog (stari nalog bi ostao prisutan, a pored njega bi se stvorio novi).

### Uzrok (Root Cause)
1. U Firestore bazi podataka, dokumenti u kolekciji `app_users` koriste `user.username.toLowerCase()` kao svoj identifikator dokumenta (`Doc ID`).
2. U modalnom dijalogu `EditUserModal.jsx`, polje "Korisničko Ime" je bilo slobodno za unos i izmjenu.
3. Prilikom spremanja izmjena, `EditUserModal` je pozivao `onSaveUser(updated)` prosljeđujući samo novi objekat korisnika sa novim korisničkim imenom, bez informacije o originalnom/starom korisničkom imenu (`user.username`).
4. Funkcija `saveUserToFirestore` u `useAuth.js` je izvršavala `setDoc(doc(db, "app_users", newDocId), cleanUser, { merge: true })`.
5. Zbog promjene naziva dokumenta (npr. `jasenko` u `jasenko.mitrovic`, ili `adis mujanović` u `adis.mujanović`), kreiran je novi dokument pod novim ID-jem, dok je stari dokument pod starim ID-jem ostao netaknut u Firestore-u.
6. Real-time listener `onSnapshot` je učitavao oba dokumenta, što je u administratorskoj tabeli prikazivalo dva naloga za istu osobu.

### Uvid u bazu - Pronađeni zaostali duplikati
Pregledom kolekcije `app_users` na Firestore pronađena su tačno 4 stara, napuštena dokumenta:
1. `adis mujanović` (novi aktuelni je `adis.mujanović`)
2. `jasenko` (novi aktuelni je `jasenko.mitrovic`)
3. `jasmin` (novi aktuelni je `jasmin.avdic`)
4. `nedim` (novi aktuelni je `nedim.kisic`)

### Implementirane popravke
1. **`src/hooks/useAuth.js`**:
   - `saveUserToFirestore(user, oldUsername = null)`:
     - Automatski provjerava da li je `originalId` (`oldUsername` ili `user._docId`) različit od novog `newDocId`.
     - Ako je korisničko ime promijenjeno, automatski se briše stari dokument iz Firestore kolekcije `app_users` (`deleteDoc`).
     - Ako je u pitanju trenutno prijavljeni korisnik, automatski se ažurira i njegova aktivna sesija u memoriji i storage-u.
   - `deleteUserFromFirestore(userOrUsername)`:
     - Podržava i string i objekat sa `_docId` kako bi se tačno obrisao željeni dokument.
   - `unsubUsers` listener:
     - Svakom učitanom korisniku dodijeljen je i stvarni Firestore ID dokumenta (`_docId: d.id`).
2. **`src/components/modals/EditUserModal.jsx`**:
   - Povezan prop `users` za validaciju unikatnosti korisničkog imena.
   - Ako korisnik pokuša promijeniti korisničko ime u ono koje već pripada drugom korisniku, modal prikazuje upozorenje i sprečava koliziju.
   - Prilikom spremanja, prosljeđuje se `origUsername`: `await onSaveUser(updated, origUsername)`.
3. **`src/components/modals/AdminPanelModal.jsx`**:
   - U formi za kreiranje novog korisnika dodana je provjera da li korisničko ime već postoji, čime se sprečava prepisivanje postojećih naloga.
   - U tabeli korisnika, dugme za brisanje sada prosljeđuje puni objekat `u` sa `_docId`.
4. **`src/app/page.jsx`**:
   - Prosljeđen prop `users={users}` u `EditUserModal`.

### Status
- Build testiran (`npm run build`) - uspješan.
- Kod commitovan i pushan na GitHub (`origin/master`).
- Deployan na Firebase Hosting (`https://analiza-transporta-flota.web.app`).
