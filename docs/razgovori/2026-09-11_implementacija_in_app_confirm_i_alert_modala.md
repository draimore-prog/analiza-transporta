# Zapisnik: Implementacija custom in-app Confirm & Alert modala ("Da li želite obrisati...")

**Datum:** 11. septembar 2026.  
**Projekat:** Bingo MotorFix (Analiza Transporta & Flota)  
**Status:** Implementirano, testirano, deployano na Firebase Hosting i objavljen EAS OTA Update.

---

## 1. Zahtjev korisnika
Korisnik je zatražio uklanjanje ružnih sistemskih/pregledničkih nativnih alert i confirm prozorčića (`window.confirm`, `window.alert`), te izradu namjenske React komponente unutar same aplikacije za akcije poput:
> *"popravi i web alertse ne mora biti u native, napravi komponentu u sklopu aplikacije za 'da li zelite obrisati....', valjda me kontas"*

---

## 2. Realizovane izmjene

### A. Kreirana komponenta `ConfirmDialogModal`
- **Lokacija:** `src/components/common/ConfirmDialogModal.jsx`
- **Dizajn i karakteristike:**
  - Moderni tamni backdrop blur overlay sa visokim prioritetom prikaza (`z-[99999]`).
  - Prilagođene teme i ikonice:
    - **`danger` (brisanje):** Crveni bedž sa ikonicom kante za otpatke (`Trash2`), crveno dugme za brisanje.
    - **`warning` (upozorenje/prekid):** Amber/žuti bedž sa ikonicom upozorenja (`AlertTriangle`).
    - **`info` / `success`:** Plava/zelena tematika za obavještenja.
  - Prikaz istaknutog koda/naziva stavke u monospace bedžu (npr. registarska oznaka vozila ili broj radnog naloga).
  - Podrška za tastaturu: **ESC** za odustajanje, **Enter** za potvrdu.
  - Podrška za dvostruki režim: Confirmation (dva dugmeta: "Odustani" i "Obriši/Potvrdi") ili Alert (jedno dugme: "U redu").

### B. Kreiran kontekst i hook `useConfirm`
- **Lokacija:** `src/context/ConfirmContext.jsx`
- **Funkcionalnosti:**
  - `confirm({ title, message, itemName, confirmText, cancelText, variant })` -> vraća `Promise<boolean>`
  - `confirmDelete({ itemName, itemType, message, title })` -> namjenski helper za brisanje sa automatski sastavljenom formulacijom pitanja.
  - `alert({ title, message, variant, buttonText })` -> zamjena za `window.alert()`.
  - Integrisan na vrhu aplikacije u `src/app/page.jsx` unutar `ConfirmProvider`.

### C. Refaktorisane komponente i uklonjeni svi nativni `confirm` i `alert` pozivi
1. **`src/components/warehouse/WarehouseWorkOrders.jsx`**:
   - Brisanje radnog naloga skladišne mehanizacije koristi `confirmDelete({ itemName: order.orderNumber, itemType: "radni nalog" })`.
2. **`src/components/warehouse/WarehouseFleet.jsx`**:
   - Superadmin trajno brisanje mašine koristi `confirmDelete({ itemName: v.reg, itemType: "mašinu" })`.
3. **`src/components/transport/MasterFleetTable.jsx`**:
   - Superadmin trajno brisanje transportnog vozila koristi `confirmDelete({ itemName: v.reg, itemType: "vozilo" })`.
4. **`src/components/modals/VehicleCardModal.jsx`**:
   - Brisanje vozila iz kartona vozila koristi `confirmDelete`.
5. **`src/components/modals/EditVehicleModal.jsx`**:
   - Brisanje vozila, upozorenja o limitu slika i verifikacija obaveznih polja koriste in-app modal.
6. **`src/components/modals/NewCostModal.jsx`**:
   - Potvrda odustajanja od unosa troška i obavještenja o neispravnim podacima koriste in-app modal.
7. **`src/components/modals/AdminPanelModal.jsx`**:
   - Brisanje korisničkog naloga i obavještenja o kreiranju korisnika/uloga koriste in-app modal.
8. **`src/components/modals/EditUserModal.jsx`**, **`EditRoleModal.jsx`**, **`ChangePasswordModal.jsx`**, **`FieldOrdersDashboard.jsx`**:
   - Svi preostali `alert` pozivi zamijenjeni su in-app obavještenjima.

---

## 3. Verifikacija & Deployment
- `npm run build`: Uspješno kompajliran bez grešaka (Exit code 0).
- Firebase Hosting: Deployan na produkciju (`https://analiza-transporta-flota.web.app`).
- EAS Mobile OTA Update: Objavljen update za mobilnu aplikaciju.
