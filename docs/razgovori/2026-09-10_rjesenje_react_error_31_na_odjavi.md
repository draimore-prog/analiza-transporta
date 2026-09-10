# Rješenje problema: Minified React error #31 na odjavi korisnika

## Datum: 10.09.2026.

### Problem
Nakon klika na dugme za odjavu ("Odjava" u navigaciji/sidebaru ili dashboardu servisera), web aplikacija se rušila sa porukom:
`Minified React error #31: Objects are not valid as a React child (found: object with keys {_reactName, _targetInst, type, nativeEvent, target, currentTarget, ...})`

### Uzrok (Root Cause)
1. U `Sidebar.jsx` (linija 153) i `ServiserDashboard.jsx` (linija 243), dugme za odjavu je imalo direktan handler: `onClick={onLogout}`.
2. U Reactu, direktno prosleđivanje handlera na `onClick` predaje `SyntheticMouseEvent` kao prvi argument poziva: `onLogout(event)`.
3. Funkcija `logout` u `useAuth.js` definisana je sa parametrom: `logout = useCallback((reason = "") => { ... setSessionTimeoutMessage(reason); }, [])`.
4. Usled toga, `sessionTimeoutMessage` u stanju aplikacije nije postao string ili prazan string, već kompletan `SyntheticMouseEvent` objekat.
5. Nakon postavljanja `activeUser` na `null`, aplikacija prikazuje `LoginModal` sa propom `sessionTimeoutMessage={sessionTimeoutMessage}`.
6. U `LoginModal.jsx`, kod `{sessionTimeoutMessage && (<span className="leading-snug">{sessionTimeoutMessage}</span>)}` je pokušao renderovati React Synthetic Event objekat direktno unutar JSX stabla, što u Reactu izaziva fatalnu grešku `Minified React error #31`.

### Implementirane izmjene (Defense-in-depth)
1. **`src/hooks/useAuth.js`**:
   - Sanitizovan argument `reason`:
     `setSessionTimeoutMessage(typeof reason === "string" ? reason : "");`
     Time je onemogućeno da bilo kakav objekat, event ili ne-string podatak završi u state-u poruke sesije.
2. **`src/components/modals/LoginModal.jsx`**:
   - Dodana provjera tipa prije renderovanja poruke:
     `{sessionTimeoutMessage && typeof sessionTimeoutMessage === "string" && !errorMessage && ...}`
3. **`src/components/layout/Sidebar.jsx`**:
   - `onClick={onLogout}` izmijenjen u `onClick={() => onLogout && onLogout()}`, čime se osigurava da se klik event ne prosljeđuje kao argument.
4. **`src/components/serviser/ServiserDashboard.jsx`**:
   - `onClick={onLogout}` izmijenjen u `onClick={() => onLogout && onLogout()}`.
5. **`src/app/page.jsx`**:
   - Propovi `onLogout` za `Sidebar` i `ServiserDashboard` eksplicitno omotani u `() => logout()`.
   - Funkcija `navigateToPage` dodatno zaštićena tipskom provjerom (`if (!pageId || typeof pageId !== "string") return;`).

### Verifikacija i Deployment
- Pokrenut `npm run build` – Turbopack kompajlirao bez grešaka (kod 0).
- Izmjene commitovane i pushane na GitHub (`origin/master`).
- Izvršen deploy na Firebase Hosting (`https://analiza-transporta-flota.web.app`).
