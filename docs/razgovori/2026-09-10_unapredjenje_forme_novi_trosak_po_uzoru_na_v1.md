# Zapisnik izmjena: Unapređenje forme za unos novih troškova (V1 pravila primijenjena na V2)

**Datum:** 10. septembar 2026.  
**Autor / Asistent:** Antigravity AI  
**Komponenta:** `src/components/modals/NewCostModal.jsx`  
**Referenca:** `public/v1.html` (funkcije `openNewCostModal`, `ncLockVehicleFields`, `ncOnVehicleSelect`, `ncCalculateTotal`, `handleCreateNewCost`)

---

## 1. Zahtjev korisnika
Korisnik je tražio da se forma za unos novih troškova i servisnih naloga na portalu V2 uskladi sa "savršenom" formom iz portala V1 (`public/v1.html`), koja je imala strogo definisan set pravila i ponašanja:
1. Prilikom izbora ili unosa registracije/vozila, automatski se povlače njegove generalije iz šifrarnika flote (`garazniBroj`, `godProizvodnje`, `markaVoz`, `modelVoz`, `tipMehan`).
2. Ova polja se automatski zaključavaju (`readOnly` / `disabled` sa vizuelnom oznakom `🔒 Šifrarnik`), dok se korisniku ostavlja mogućnost otključavanja po potrebi (dugme "Otključaj" / ručni unos za neregistrovana/vanšifrarnička vozila).
3. Provjera statusa: ukoliko je vozilo u statusu "PRODATO", "RASHODOVANO" ili "NEAKTIVNO", prikazuje se vizuelno upozorenje.
4. Zadržavanje i unaprjeđenje opcije za automatsko povlačenje kilometraže sa najbližim točenjem goriva (`⚡ Poklopi sa točenjem goriva`).
5. Dinamička polja prema tipu mehanizacije:
   - **Teretna i Putnička vozila**: Prikazuje se kilometraža + dugme za točenje goriva.
   - **Skladišna mehanizacija**: Prikazuju se radni sati (h), dok je kilometraža skrivena.
   - **Priključna vozila i Radne mašine**: Skrivena su i kilometraža i radni sati (postavljaju se na `null`).
6. Unos i razdvajanje troškova (po uzoru na Sekciju 4 iz V1):
   - Cijena rezervnog dijela (KM)
   - Cijena usluge / rada (KM)
   - Total Trošak (KM sa PDV) - automatski zbraja dijelove i uslugu ili prihvata direktan unos.
7. Kategorizacija i fakturisanje:
   - Segment troška (Redovan servis, Mehanika, Guma, Elektronika, Hidraulika, Signalizacija, Tečnost, Ostalo)
   - Vrsta troška (Eksterni dobavljač, Interni rad / servis, Rezervni dio, Ostalo)
   - Vrsta fakture (Kombinovana faktura, Faktura za dijelove, Faktura za uslugu, Interni nalog)
   - Broj računa / RN
   - Serviser / Izvođač sa predlaganjem najčešćih dobavljača
   - Cloud upload računa/fakture na Firebase Storage sa mogućnošću zamjene ili uklanjanja.

---

## 2. Implementirane izmjene
U datoteci `src/components/modals/NewCostModal.jsx`:
- **State varijable:**
  - `isVehicleLocked`: boolean indikator zaključavanja polja šifrarnika.
  - `godProizvodnje`: evidentira godište vozila (po uzoru na V1).
  - `brojRacuna`: evidentira broj računa / radnog naloga.
  - `vrstaTroska` i `vrstaFakture`: kategorizacija naloga.
  - `costPart` i `costService`: cijena dijela i cijena usluge sa automatskom kalkulacijom zbira u `cost`.
  - `vehicleStatusWarning`: upozorenje za neaktivna/rashodovana/prodata vozila.
- **Smart matching:**
  - Omogućava pretragu po registraciji ili po garažnom broju (npr. unos `40567` automatski pronalazi vozilo i puni registraciju `M04-E-456`).
- **Vizuelni dizajn:**
  - Usklađen sa V1 i modernim Tailwind standardom (zeleni emerald akcenti, podrška za dark mode, jasne sekcije 1-4).

---

## 3. Verifikacija
- `npm run build`: uspješno kompajlirano bez grešaka.
- Testiran mehanizam automatskog zaključavanja polja, kalkulacija cijene i povezivanje točenja goriva.
