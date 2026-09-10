# Zapisnik izmjene: Automatsko odjavljivanje korisnika nakon 5 minuta neaktivnosti

**Datum:** 10. septembar 2026.  
**Portal:** Logistika - Servis motornih vozila i skladišne mehanizacije  
**Zahtjev:** Implementirati mehanizam zaštite koji automatski odjavljuje svakog prijavljenog korisnika ako nema nikakve aktivnosti na portalu u trajanju od 5 minuta, te ga preusmjerava na početni login ekran uz obavijest.

---

### 1. Detalji implementacije

1. **Detekcija aktivnosti korisnika (`useAuth.js`)**:
   - Osluškuju se korisnički događaji na prozoru: `mousedown`, `mousemove`, `keydown`, `scroll`, `touchstart`, `click`.
   - Zbog optimizacije performansi, ažuriranje vremenskog žiga je prigušeno (throttled) na minimalno svakih 2 sekunde.
   - Vremenski žig zadnje aktivnosti sprema se u `localStorage` pod ključem `last_portal_activity_ts`. Ovo osigurava sinhronizaciju kroz više otvorenih tabova – ako korisnik radi u jednom tabu, aktivnost se priznaje i u drugima.

2. **Tajmer i automatska odjava**:
   - Interval provjere postavljen na svakih 5 sekundi.
   - Ukoliko razlika između trenutnog vremena i zadnje aktivnosti premaši 5 minuta (`5 * 60 * 1000` ms = 300.000 ms), pokreće se funkcija `logout()`.
   - Postavlja se poruka o odjavi: *"Automatski ste odjavljeni sa sistema zbog neaktivnosti duže od 5 minuta."*

3. **Login ekran (`LoginModal.jsx` & `page.jsx`)**:
   - `sessionTimeoutMessage` se prosljeđuje modalnom dijalogu za prijavu.
   - Prikazuje se stilizovani amber/upozoravajući banner sa ikonicom upozorenja na vrhu login forme.
   - Prilikom nove uspješne prijave (`login` ili `loginAs`), poruka o isteku sesije se automatski briše.

---

### 2. Modifikovani fajlovi
- `src/hooks/useAuth.js`: Implementacija tajmera za neaktivnost, `logout` funkcije s razlogom i brisanjem lokalnih ključeva sesije, te eksport `sessionTimeoutMessage`.
- `src/app/page.jsx`: Preuzimanje `sessionTimeoutMessage` iz `useAuth()` i prosljeđivanje u `LoginModal`.
- `src/components/modals/LoginModal.jsx`: Prikaz obavještenja o isteku sesije zbog neaktivnosti iznad forme za unos podataka.
