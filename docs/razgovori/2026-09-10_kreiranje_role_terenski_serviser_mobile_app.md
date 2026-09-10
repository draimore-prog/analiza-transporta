# Zapisnik Implementacije - Nova Uloga: Terenski Serviser (Mobilna Aplikacija)

**Datum:** 10.09.2026.  
**Projekat:** Analiza Transporta i Održavanja Voznog Parka (Bingo d.o.o. Tuzla)  
**Tema:** Kreiranje namjenske uloge (App Role) za korisnike terenske mobilne aplikacije  

---

## 1. Zahtjev Korisnika
Kreirati namensku ulogu (`mobile_serviser`) u administratorskom panelu sa restriktivnim dozvolama, tako da administrator prilikom kreiranja ili uređivanja novog korisničkog naloga može dodijeliti tu ulogu. Korisnik sa ovom ulogom ima pristup isključivo mobilnoj aplikaciji (radni nalozi skladišne mehanizacije, preventivni pregledi, ček-lista, radni sati i kamera) bez mogućnosti prelaska na transportni ili skladišni portal i bez pristupa finansijskim tabelama.

---

## 2. Realizovane Izmjene

1. **Definicija role u `src/lib/constants.js`:**
   - Dodana uloga `mobile_serviser` u `DEFAULT_APP_ROLES`:
     - **Naziv:** `Terenski Serviser (Mobilna Aplikacija)`
     - **Bedž:** `📱 Terenski Serviser (Mobile App)`
     - **Default Portal:** `serviser`
     - **Dozvoljeni portali:** `['serviser']`
     - **Permisije:** Sve administrativne i finansijske permisije (`canSwitchPortal`, `canUploadExcel`, `canInputCost`, `canRegisterVehicle`, itd.) postavljene na `false`.

2. **Administratorski panel (`AdminPanelModal.jsx`):**
   - U formi za kreiranje novog korisnika dodana opcija u padajući meni:
     `📱 Terenski Serviser (Samo Mobilna Aplikacija)`
   - U tabeli postojećih korisnika dodat poseban smaragdni (emerald) bedž za prepoznavanje mobilnih korisnika.

3. **Uređivanje korisnika (`EditUserModal.jsx`):**
   - Dodana ista opcija `mobile_serviser` u listu uloga pri izmjeni postojećih naloga.

4. **Karton vozila i mehanizacije (`VehicleCardModal.jsx`):**
   - Proširena provjera `isServiser` tako da obuhvata i `mobile_serviser`, čime se skrivaju cijene, a prikazuju samo tehnički detalji i zamijenjeni dijelovi.

5. **Rutiranje i kontrola pristupa (`useAuth.js` i `page.jsx`):**
   - Korisnik sa ulogom `mobile_serviser` se prilikom prijave automatski i bezuvjetno usmjerava na serviserski mobilni portal.
   - Uklonjeno dugme za prebacivanje na transportni portal, čime je korisnik zaključan u mobilnom interfejsu.
