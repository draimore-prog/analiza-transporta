# Obavezna fotodokumentacija, status/navigacijske margine i EAS APK build

**Datum:** 10. septembar 2026.  
**Autor:** Antigravity AI & Emir Duraković  
**Aplikacija:** Bingo Servis Mehanizacije (Mobilni Serviser Portal)

---

## 1. Zahtjevi korisnika
1. **Obavezan unos slika:** Onemogućiti slanje radnog naloga sa terena bez priložene fotodokumentacije.
2. **Sigurnosne margine za mobitele:** Dodati header marginu (za Status Bar / notch / urez kamere) i footer marginu (za donju navigacijsku traku / gesture bar) kako sučelje ne bi bilo prekriveno hardverskim elementima telefona.
3. **Publish / Build APK:** Pokrenuti i objaviti build sa gotovim instalacionim `.apk` paketom za Android.

---

## 2. Realizovane stavke

### A. Obavezna Fotodokumentacija (`FieldWorkOrderForm.jsx`)
- U funkciji slanja `handleSubmit` dodana je stroga validacija:
  ```javascript
  const uploadedPhotosCount = Object.values(photos).filter(Boolean).length;
  if (uploadedPhotosCount === 0) {
    setErrorMessage("Fotodokumentacija je OBAVEZNA! Molimo priložite barem jednu fotografiju stanja viljuškara / popravke...");
    return;
  }
  ```
- U zaglavlju sekcije za fotografije ugrađen je istaknuti bedž:
  `* Unos slika obavezan` (crveni okvir) te brojač priloženih fotografija (`X/5 slika`).
- Izmjene su odmah deployane na Firebase Hosting (`https://analiza-transporta-flota.web.app`).

### B. Header i Footer Sigurnosne Margine (`servis-mobilna-app/App.js` i `ServiserDashboard.jsx`)
- U `servis-mobilna-app/App.js` definisane su dinamičke i fiksne margine:
  - `STATUSBAR_MARGIN = Platform.OS === "android" ? (StatusBar.currentHeight || 28) : 0`
  - `NAVBAR_MARGIN = Platform.OS === "android" ? 16 : 0`
  - Primijenjene na glavni kontejner (`paddingTop: STATUSBAR_MARGIN`, `paddingBottom: NAVBAR_MARGIN`) čime je osigurano da zaglavlje i donji elementi aplikacije nikada ne budu prekriveni satom, baterijom ili gesture trakom.
- U `ServiserDashboard.jsx` footeru dodana je dodatna sigurnosna margina (`pb-8`) za komforno skrolovanje do samog dna.

### C. Gotov APK i EAS Build
- Prethodno završeni APK dostupan za direktno preuzimanje:
  `https://expo.dev/artifacts/eas/UrEKebbnYBhkWtN51ujrbG2CUPrN97O6ft686YEvZFY.apk`
- U `eas.json` dodatno podešen i optimizovan build profil za direktni APK.
- Pokrenut novi EAS preview build sa svim najnovijim izmjenama.
