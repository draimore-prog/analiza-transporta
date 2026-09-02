# Zapisnik i Odluka: Izmještanje Dark Mode i V1 Dugmeta

- **Datum**: 02. septembar 2026.
- **Autor / Agencija**: Antigravity AI & Bingo Flota Tim
- **Kontekst**: Reorganizacija navigacijskih i administrativnih dugmadi po zahtjevu korisnika.

---

## 1. Korisnički Zahtjev
> *"izbrisi dark mode sa dna sidebara ostavi ga samo u headeru a dugme iz headera V1 prebaci u "Admin" modal"*

---

## 2. Izvršene Izmjene

1. **Uklanjanje Dark Mode dugmeta sa dna sidebara**:
   - U datoteci [`Sidebar.jsx`](file:///c:/Users/Bingo/Desktop/Analiza%20transporta/src/components/layout/Sidebar.jsx), uklonjeno je duplicirano dugme za promjenu teme na dnu bočnog menija.
   - Dugme za prebacivanje teme (Svijetla / Tamna tema) ostaje aktivno isključivo u gornjem desnom uglu glavnog zaglavlja ([`Header.jsx`](file:///c:/Users/Bingo/Desktop/Analiza%20transporta/src/components/layout/Header.jsx)), čime je oslobođen prostor u bočnom meniju.

2. **Izmještanje V1 dugmeta u Admin panel**:
   - Iz zaglavlja ([`Header.jsx`](file:///c:/Users/Bingo/Desktop/Analiza%20transporta/src/components/layout/Header.jsx)) je uklonjeno dugme *"🏛️ V1 Originalni Pregled"*.
   - Dugme je prebačeno direktno u modal administracije sistema ([`AdminPanelModal.jsx`](file:///c:/Users/Bingo/Desktop/Analiza%20transporta/src/components/modals/AdminPanelModal.jsx)), unutar trake sa akcijama u zaglavlju tabova.
   - Administratori i ovlašteni korisnici mogu pristupiti klasičnom V1 pregledu jednim klikom iz Admin panela.

---

## 3. Verifikacija i Deploy
- `npm run build` izvršen uspješno bez grešaka (`Compiled successfully in 11.4s`).
- Deployano na Firebase Hosting (`https://analiza-transporta-flota.web.app`).
- Commitano i pushano na GitHub `origin/master`.
