# Unapređenje modala "Unos novog troška" – Restrikcija na aktivna vozila, autofill i obavezna polja

**Datum:** 11. septembar 2026.  
**Komponenta:** `src/components/modals/NewCostModal.jsx`  
**Cilj:** Spriječiti unos nepostojećih ili neaktivnih vozila (prodatih/rashodovanih), automatski popuniti i trajno zaključati podatke iz šifrarnika, te osigurati obaveznost svih polja osim opcionalnog priloga računa/slike.

---

## 1. Implementirane funkcionalnosti

### A. Pretraga i selektor aktivnih vozila (`activeFleet`)
- **Striktno filtriranje:** Iz `masterFleet` se izdvajaju isključivo vozila sa statusom `"Aktivno"` (`normalizeVehicleStatus(v.status) === "Aktivno"`).
- **Searchable Combobox / Padajući meni:**
  - Korisnik može kliknuti ili pretraživati vozila po registraciji, garažnom broju, marki, modelu ili poslovnoj jedinici.
  - Prikazano je samo aktivnih vozila (npr. kamioni, putnička vozila, viljuškari, radne mašine sa statusom `Aktivno`).
  - Jasno upozorenje u realnom vremenu ako korisnik pokuša pretražiti vozilo koje u bazi ima status "Prodato" ili "Rashodovano".
  - Nakon odabira vozila prikazuje se kartica sa potvrdom: registarska oznaka, garažni broj, marka, model, tip mehanizacije i statusna značka `Aktivno`, uz mogućnost promjene odabranog vozila ("Promijeni vozilo").

### B. Autofill i trajno zaključavanje šifrarničkih podataka (🔒 Lock)
- Sljedeća polja se automatski popunjavaju iz odabranog vozila i **trajno su zaključana** (`readOnly` / `disabled`), bez mogućnosti ručne izmjene:
  - `Garažni broj (MT)` 🔒
  - `Tip mehanizacije` 🔒
  - `Godište` 🔒
  - `Marka vozila` 🔒
  - `Model vozila` 🔒
- Uklonjeno je dugme "Otključaj polja", čime se garantuje potpuna usklađenost sa matičnom bazom vozila (`masterFleet`).

### C. Stroga validacija obaveznih polja
Sva polja su obavezna osim slike/fakture:
1. **Odabir vozila (`reg` / `selectedVehicle`):** Obavezno; vozilo mora postojati u šifrarniku i imati status `Aktivno`.
2. **Datum intervencije (`datum`):** Obavezno.
3. **Broj računa / RN (`brojRacuna`):** Obavezno (dodana zvjezdica `*` i provjera).
4. **Serviser / Izvođač (`dobavljac`):** Obavezno (dodana zvjezdica `*` i provjera).
5. **Opis kvara / servisnih radova (`opis`):** Obavezno (dodana zvjezdica `*` i provjera).
6. **Segment troška (`segment`):** Obavezno.
7. **Vrsta troška (`vrstaTroska`):** Obavezno.
8. **Vrsta fakture (`vrstaFakture`):** Obavezno.
9. **Kilometraža (`kilometraza`):** Obavezna za teretna, putnička i servisna vozila.
10. **Radni sati (`radniSati`):** Obavezni za skladišnu mehanizaciju (viljuškari).
11. **Total trošak (`cost`):** Obavezan iznos veći od 0 KM.
12. **Prilog računa (`invoiceUrl`):** Ostaje opcionalan ("sem slike").

---

## 2. Verifikacija i distribucija
- **Build test:** `npm run build` završen uspješno bez grešaka (Next.js 16.3.3 Turbopack).
- **Firebase Hosting:** Aplikacija deployana na produkciju (`https://analiza-transporta-flota.web.app`).
