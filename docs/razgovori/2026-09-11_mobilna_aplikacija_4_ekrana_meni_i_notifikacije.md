# Zapisnik: Mobilna aplikacija servisera – 4 odvojena ekrana, meni "tri linije", OTA ažuriranje i notifikacije

**Datum:** 11. septembar 2026.  
**Korisnički zahtjev:**  
"ja bi prvenstveno formu aplikacije izmjenio na način da imamo zasebne prozore za svaki dio aplikacije, da aplikacija ne radi kao scroll, nego da imamo stranica jedan na kojoj će npr biti radni nalozi i informacije o korisniku, kad otvori se aktivan nalog da onda imamo set informacija o jedinici koja se popravlja, i da onda ima dugme dalje pa na sledećoj stranici set onih gumbova za ispravno / defekt, pa na sledećoj stranici da imamo pisani unos izvršene opravke i utrošenih dijelova, i na sledećoj stranici da imamo unos radnih sati, slikanje pet slika i dugme zaključi nalog, da su segmeni aplikacije odvojeni fino i jasno, i dodaj nam gore one tri linije gdje će biti info o podacima korisnika aplikacije, broj vertzije aplikacije i dugme za OTA ažuriranje, odnosno update aplikacije ako postoji na webu, i provjeri još jednom notifikacije , sad je sve na mobitelu upaljeno, ali notifikacije ne dolaze ako je telefon zaključan, ako je aplikacija ugašena skroz, nego kad otvorim aplikaciju onda se notifikacija pojavi, ali onda i nema smisla jer mogu vidjeti kad uđem šta trebam raditi"

---

### Realizovane stavke

1. **Čarobnjak u 4 koraka (Wizard) umjesto beskonačnog scroll-a (`FieldWorkOrderForm.jsx`):**
   - **Gornji indikator koraka:** `1. Jedinica` ➔ `2. Ček-lista` ➔ `3. Radovi` ➔ `4. Sati & slike`.
   - **Korak 1:** Podaci o mašini (zaključano za dodijeljene naloge, ili pretraga za nove) + instrukcija voditelja + dugme *Dalje: Ček-lista*.
   - **Korak 2:** Kontrolna lista 8 sklopova (ispravno/defekt) sa brzim tasterom "Označi sve kao ispravno" + dugmad *Nazad* i *Dalje: Radovi*.
   - **Korak 3:** Tekstualni unos izvršene opravke (sa brzim šablonima) i utrošenog materijala + dugmad *Nazad* i *Dalje: Sati & slike*.
   - **Korak 4:** Radni sati (MTH) sa table + 5 foto slotova (prednja, zadnja, lijeva, desna, tabla) + dugme *Nazad* i veliko dugme *Zaključi i pošalji nalog*.

2. **Gornji meni "tri linije" (☰) i profil servisera (`FieldOrdersDashboard.jsx`):**
   - Na početnoj stranici istaknuta kartica korisnika i radionice.
   - Ugrađen bočni meni (Drawer):
     - Prikaz podataka korisnika (ime, prezime, rola, radionica).
     - Broj verzije (`Verzija 1.1.0`).
     - Taster za **OTA ažuriranje** aplikacije sa provjerom koda.
     - Taster za **testiranje notifikacije na zaključanom ekranu sa odgodom od 5 sekundi**.

3. **Nativni bridge i rukovanje pozadinskim notifikacijama (`servis-mobilna-app/App.js` & `app.json`):**
   - Povezan `expo-updates` za automatsko preuzimanje i primjenu OTA paketa na klik dugmeta iz menija.
   - Povezan sistemski tajmer Android notifikacija sa odgodom (`TIME_INTERVAL`) koji se okida i budi ekran čak i kad je telefon zaključan.
   - Unaprijeđena registracija push tokena u Firestore kolekciju `serviser_push_tokens`.

---

### Verifikacija
- `npm run build`: Uspješno (0 grešaka, 4.2s).
- `npx expo export --platform android`: Uspješno (676 modula u Android bundle).
