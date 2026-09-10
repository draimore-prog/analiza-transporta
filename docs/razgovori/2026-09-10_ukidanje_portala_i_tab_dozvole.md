# Zapisnik & Odluke: Ukidanje Portala i Uvođenje Granularnih Dozvola po Tabu (View / Edit)

- **Datum**: 10.09.2026.
- **Korisnik**: Emir Duraković
- **Asistent**: Antigravity AI

---

## 1. Kontekst i Poslovni Zahtjev
Aplikacija je u ranijim verzijama imala koncept "portala" (`transport`, `warehouse`, `serviser`) i postavki poput `portalAccess`, `defaultPortal`, `canSwitchPortal`. To je stvaralo redundantnost jer je nova navigacija već organizovana u 4 jasne kategorije:
1. 📊 **Analitika**
2. 🗄️ **Baza podataka**
3. 🚜 **Skladišna mehanizacija**
4. 🔧 **Servisna radionica**

Korisnik je zatražio:
- Potpuno ukidanje koncepta "portala" i prelazak na **jedinstveni sidebar sa svim stranicama**.
- Granularne dozvole po tabu:
  - Čisto analitičke stranice: **Dozvoljeno (Da/Ne)**.
  - Stranice sa unosom/izmjenama/brisanjem: **3 nivoa**:
    - `none` (Bez pristupa - skriveno u sidebaru)
    - `view` (Samo pregled - vidi tabelu, kartone i filtere, ali nema dugmadi za unos, izmjene i brisanje)
    - `edit` (Puni unos - može kreirati, uređivati i brisati)

---

## 2. Implementirane Izmjene

### 2.1. `src/lib/constants.js`
- Definisani `EDITABLE_PAGE_IDS`:
  - `maticna-baza-flote`
  - `tabela-servisa`
  - `skladiste-sifrarnik`
  - `skladiste-opravke`
  - `skladiste-nalozi`
  - `servisna-radionica`
- Implementirane pomoćne funkcije:
  - `isEditablePage(pageId)`: provjerava podržava li stranica 3-state nivoe unosa.
  - `getRolePagePermission(role, pageId)`: vraća nivo permisije (`none`, `view`, `edit` ili `true`/`false`) uz podršku za novu mapu `pagePermissions` i potpuni fallback za postojeće uloge u Firestore bazi.
  - `hasPageAccess(role, pageId)`: provjerava vidljivost stranice.
  - `canEditPage(role, pageId)`: provjerava ima li korisnik `edit` pravo na datoj stranici (ili je superadmin).
- Ažurirani `DEFAULT_APP_ROLES` sa definisanim početnim stranicama (`defaultPage`) i matricom `pagePermissions`.

### 2.2. `src/components/modals/EditRoleModal.jsx`
- Redizajniran modal za uređivanje uloga:
  - Zamijenjen "Default Portal" sa dropdownom **Početna Stranica (Default)**.
  - Kategorizovani prikaz svih tabova po 4 sekcije.
  - Za editable tabove: elegantni segmentirani birač sa 3 opcije (`🚫 Bez pristupa`, `👁️ Samo Pregled`, `✏️ Puni Unos (Edit)`).
  - Za analitičke tabove: prekidač `Dozvoljeno / Onemogućeno`.
  - Sinhronizacija `navigationPanels` i sistemskih permisija pri snimanju radi unazadne kompatibilnosti sa Firestore ulogama.

### 2.3. `src/components/layout/Sidebar.jsx` i `src/components/layout/Header.jsx`
- `Sidebar.jsx`: Uklonjena zastarjela `portal` logika; stranice se filtriraju direktno preko `hasPageAccess(currentRole, item.id)`. Prazne kategorije se automatski skrivaju.
- `Header.jsx`: Dugmad `+ Novo Vozilo` i `+ Unos Troška` se prikazuju isključivo ako korisnik ima `canEditPage` na odgovarajućim bazama.

### 2.4. Zaštita Unosa na Tabelama i Formama
- `MasterFleetTable.jsx`: `canEdit` kontroliše dugme `+ Dodaj Novo Vozilo` i akciju `Uredi` na svakom vozilu. Pregled `📋 Karton` ostaje omogućen za `view` korisnike.
- `WarehouseFleet.jsx`: `canEdit` kontroliše `Uredi` akciju nad skladišnom mašinom.
- `WarehouseWorkOrders.jsx`: `canEdit` kontroliše `+ Novi Radni Nalog`, `Generiši Primjer Naloga`, `📱 Terenski Unos`, te gumbe `Odobri` i `Obriši`. Pregled detalja i `Štampa A4` ostaju dostupni za `view` korisnike.
- `ServiserDashboard.jsx`: Ako uloga ima samo `view`, blokira se terenski unos i nalog se može samo pregledati ili štampati.
- `page.jsx`: Ako korisnik u URL-u pokuša otvoriti stranicu za koju nema pravo, sistem ga automatski preusmjerava na njegovu početnu stranicu (`defaultPage`) ili prvu dostupnu stranicu.

---

## 3. Status Verifikacije
- `npm run build` uspješan bez grešaka (Next.js static export).
- Spremno za automatski deploy na Firebase Hosting i push na GitHub.
