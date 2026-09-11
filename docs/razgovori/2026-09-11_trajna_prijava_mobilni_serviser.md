# Zapisnik promjena: Trajna prijava i ukidanje 5-minutne odjave za mobilne servisere

**Datum:** 11. septembar 2026.  
**Projekat:** Bingo Servis Mehanizacije / Analiza Transporta & Radionica  
**Platforma:** Web (`https://analiza-transporta-flota.web.app`) & Android mobilna aplikacija (`servis-mobilna-app`)  

---

## 1. Zahtjev korisnika
- Onemogućiti automatsko odjavljivanje korisnika nakon 5 minuta neaktivnosti na mobilnom telefonu.
- Ako je korisnik prijavljen kao mobilni serviser (`mobile_serviser` / `serviser`) ili koristi mobilnu aplikaciju, mora ostati **trajno prijavljen** (bez potrebe za ponovnim unosom lozinke nakon zaključavanja ili neaktivnosti).

---

## 2. Implementirane izmjene (`src/hooks/useAuth.js`)

### A. Izuzeće od 5-minutnog tajmera neaktivnosti
- U hooku `useAuth.js` tajmer `INACTIVITY_TIMEOUT_MS` (5 minuta) je izmijenjen:
  ```javascript
  const isMobileOrServiser =
    activeUser.role === "mobile_serviser" ||
    activeUser.role === "serviser" ||
    (typeof window !== "undefined" && (
      window.__IS_NATIVE_APP ||
      window.location.search.includes("portal=terenski-nalozi") ||
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    ));

  if (isMobileOrServiser) return; // NEMA automatske odjave za servisere
  ```
- Korisnici na telefonu i mobilni serviseri sada ostaju trajno prijavljeni bez prekida rada.

### B. Trajna pohrana sesije u `localStorage`
- Pri prijavi korisnika (`login` i `loginAs`), za uloge mobilnog servisera ili pristup sa mobilne aplikacije parametar `rememberMe` je automatski postavljen na `true`.
- Podaci o aktivnoj sesiji se trajno pohranjuju u `localStorage` pod ključem `analiza_transporta_active_user`.
- Pri svakom ponovnom pokretanju aplikacije ili ponovnom otvaranju ekrana, podaci se prvo čitaju iz `localStorage`, čime je osigurano da serviser nikada ne mora ponovo unositi korisničko ime i lozinku.

---

## 3. Verifikacija i distribucija
- **Next.js Production Build:** `npm run build` završen sa 100% uspjeha.
- **Firebase Hosting:** Ažurirano na produkciju (`https://analiza-transporta-flota.web.app`).
- **EAS OTA Update:** Poslano na Expo kanal `preview` za instant ažuriranje mobilne aplikacije.
- **Git Version Control:** Izmjene evidentirane i poslane na `origin/master`.
