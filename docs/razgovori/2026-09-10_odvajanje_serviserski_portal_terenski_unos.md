# Zapisnik: Odvajanje Serviserskog Portala i Terenskog Unosa

**Datum:** 10. septembar 2026.  
**Autor:** Antigravity AI & Emir Duraković  
**Status:** Implementirano, Verifikovano i Produkcijski Objavljeno  

---

## 1. Zahtjev i Kontekst
Korisnik je zatražio razdvajanje prethodno spojene stranice:
> *"Serviserski Portal / Terenski Unos odvoji ove dvije stranice, Serviserski Portal treba da bude samo search bar vrati ServiserDashboard kakav je bio prije uklanjanja "portala""*

Cilj:
1. **Serviserski Portal** (`servisna-radionica`):
   - Vraćen u čisto stanje fokusirano isključivo na brzu pretragu kartona vozila i mehanizacije (identično originalnom ServiserDashboard prije uklanjanja portala).
   - Velika centralna kartica za pretragu sa autocomplete dropdownom (pretraga po registraciji, garažnom broju, šasiji, marki, modelu).
   - Lista nedavno pregledanih vozila (iz `sessionStorage`).
   - 3 sažete info kartice na dnu: "Ukupno Jedinica", "Režim Radionice: Tehnički Pregled", "Evidentirani Servisi".
   - Otvaranje kartona vozila (`VehicleCardModal`) na klik ili tipku Enter.
   - Brza navigacija na Terenske Naloge ili povratak na Glavnu Aplikaciju.
2. **Terenski Radni Nalozi** (`terenski-nalozi`):
   - Izdvojen u novu namjensku komponentu `FieldOrdersDashboard.jsx`.
   - Zvučni alarm i iskačuća kartica u realnom vremenu prilikom dodjele novog naloga serviseru.
   - Dugme `+ POKRENI NOVI NALOG` (otvara `FieldWorkOrderForm` za unos radnih sati MTH, ček-liste pregleda i do 5 fotografija).
   - Dva filter taba: `🟡 ČEKAJU NA RAD` i `🟢 ZAVRŠENI NALOZI` sa dinamičkim brojačima.
   - Pretraga naloga po vozilu, broju ili opisu.
   - Kartice radnih naloga sa statusima, prioritetom (HITNO), utrošenim dijelovima, brojem fotografija, brzim akcijama "OTVORI I POPUNI NALOG", pregledom detalja i A4 štampom.

---

## 2. Realizovane Izmjene po Datotekama

1. **`src/lib/constants.js`**:
   - U `APP_NAV_SECTIONS` pod `serviser` razdvojene stavke:
     - `{ id: "servisna-radionica", name: "Serviserski Portal", icon: "🔍", category: "serviser" }`
     - `{ id: "terenski-nalozi", name: "Terenski Radni Nalozi", icon: "📱", category: "serviser", hasBadge: true }`
   - Dodana stranica `"terenski-nalozi"` u `EDITABLE_PAGE_IDS`.
   - Ažurirana funkcija `getRolePagePermission` i `DEFAULT_APP_ROLES` (`superadmin`, `warehouse_specialist`, `serviser`, `mobile_serviser`, `viewer`, `editor`).
2. **`src/components/serviser/ServiserDashboard.jsx`**:
   - Vraćena čista, elegantna pretraga sa tastaturnom navigacijom, nedavnim pretragama i donjim statistikama bez radnih naloga.
   - Dodano dugme za brzi prelazak na `Terenski Nalozi`.
3. **`src/components/serviser/FieldOrdersDashboard.jsx`** *(NOVA DATOTEKA)*:
   - Kreirana namjenska komponenta za upravljanje radnim nalozima i terenskim unosom sa podrškom za mobilne servisere i desktope.
4. **`src/components/modals/EditRoleModal.jsx`**:
   - U `ALL_PAGES` razdvojene stranice `servisna-radionica` i `terenski-nalozi` za podešavanje korisničkih uloga.
5. **`src/app/page.jsx`**:
   - Dodani slugovi `terenski-nalozi` i `terenski-unos` u `PAGE_SLUG_MAPPINGS`.
   - Implementirano zasebno rutiranje za `activePage === "servisna-radionica"` i `activePage === "terenski-nalozi"`.

---

## 3. Verifikacija
- `npm run build`: Uspješno izgrađeno u 6.0s bez ikakvih grešaka ili upozorenja.
- `next dev`: Uspješno pokrenut u 873ms.
