# Zapisnik: Odvajanje kolona fakture i centriranje tabela servisa i kartona vozila

**Datum:** 11. septembar 2026.  
**Autor:** Antigravity AI & Emir Duraković  
**Status:** Završeno & Deployano na produkciju  

---

## 1. Zahtjevi korisnika
1. **Odvajanje fakture u dvije kolone:**
   - Umjesto kombinovanog prikaza broja računa i tipa (interni/eksterni) u jednoj koloni, napraviti dvije zasebne kolone:
     - **Broj Fakture**: Prikazuje broj računa sa pretragom/filterom po broju.
     - **Interno / Eksterno**: Prikazuje bedž sa tipom (Eksterni/Interni) sa brzim selektorom (Svi / Eksterni / Interni).
   - Izvoz u Excel (`exportExcel.js`) takođe mora sadržavati dvije zasebne kolone: `"Broj Fakture"` i `"Interno / Eksterno"`.

2. **Centriranje podataka u svim kolonama:**
   - Sve kolone, zaglavlja (`<th>`), filteri (`<input>`, `<select>`) i ćelije (`<td>`) u tabelama servisa i troškova (`ServiceTable.jsx`) i kartonu vozila (`VehicleCardModal.jsx`) moraju biti centrirane (`text-center`, `justify-center`), umjesto miješanog poravnanja (lijevo/desno/sredina), čime se postiže ujednačen i čist vizuelni pregled.

---

## 2. Realizovane izmjene

1. **`src/components/transport/ServiceTable.jsx`:**
   - Razdvojeno u dvije kolone sa centriranim naslovima:
     - `Broj Fakture` (sa centriranim search inputom)
     - `Interno / Eksterno` (sa centriranim dropdown filterom)
   - Sva zaglavlja (`<th>`), ćelije (`<td>`) i filteri stilizovani sa `text-center`, a elementi unutar fleks kontejnera centrirani sa `justify-center`.
   - Zadržana interaktivna dugmad za pregled računa (spajalica) i brisanje naloga, centrirani unutar ćelije troška.

2. **`src/components/modals/VehicleCardModal.jsx`:**
   - Dodate dvije zasebne kolone za `Broj Fakture` i `Interno / Eksterno`.
   - Centriran sav sadržaj tabele, uključujući zaglavlja, datume, dobavljače, brojeve računa, statuse, kilometraže i troškove.
   - Ažuriran `colSpan` i centriranje u footeru sume stavki.

3. **`src/lib/exportExcel.js`:**
   - Ažurirana definicija kolona i mapiranje podataka za Excel izvoz, tako da su sada prisutna dva nezavisna polja: `"Broj Fakture"` i `"Interno / Eksterno"`.

---

## 3. Verifikacija & Deploy
- **Build test:** `npm run build` prošao uredno bez grešaka.
- **Git:** Promjene commitovane i pushane na `origin/master`.
- **Firebase Hosting:** Uspješno deployano na `https://analiza-transporta-flota.web.app`.
