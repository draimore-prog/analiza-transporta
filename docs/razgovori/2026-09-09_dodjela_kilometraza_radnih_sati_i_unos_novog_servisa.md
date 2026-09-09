# Dodjela Kilometraža, Radnih Sati i Nadogradnja Unosa Novih Servisa

**Datum**: 09.09.2026.  
**Platforma**: Analiza Transporta (v2 Web App + Cloud Firestore)  
**Status**: Realizovano, Sinhronizovano u Firestore i Objavljeno na Firebase Hosting

---

## 1. Sažetak Zahtjeva
Korisnik je specificirao:
1. U bazi servisa dodijeliti kolonu **"Kilometraža"** za **Teretna vozila** i **Putnička vozila** sa stvarnim očitanjima sa pumpi (najbliži datum sipanja goriva).
2. Za **Priključna vozila**: ova kolona se **ne prikazuje** (sakrivena je jer poluprikolice nemaju odometre/kilometraže).
3. Za **Radne mašine** i **Skladišnu mehanizaciju**: kolona se naziva **"Radni sati"** i sve početne vrijednosti se postavljaju na `0` (jer trenutno ne postoje validna očitanja radnih sati).
4. Prilikom **unosa novog servisa** (`NewCostModal`):
   - Automatski prilagoditi prikaz polja zavisno od tipa vozila (sakriveno za priključna, "Radni sati" za skladišnu mehanizaciju i radne mašine sa zadanom `0`, "Kilometraža" za teretna i putnička).
   - Omogućiti opciju automatskog poklapanja sa evidencijom sipanja goriva na osnovu odabranog vozila i datuma (`⚡ Poklopi sa točenjem goriva`) ili ručni unos/korekciju vrijednosti.

---

## 2. Realizacija Obrade Podataka (30.990 zapisa)
Kreirana je i izvršena skripta `scripts/assign_mileage_and_hours.py`:
- Povezivanje evidencije točenja goriva ([Evidencija_Sipanja_I_Kilometraza_Flote_Azurirano.xlsx](file:///C:/Users/emir.durakovic/Desktop/Gemini-Files/Reports/Evidencija_Sipanja_I_Kilometraza_Flote_Azurirano.xlsx) - 76.918 sipanja) sa master bazom servisa ([fleet_data.json](file:///c:/Users/emir.durakovic/Desktop/analiza-transporta-master/fleet_data.json)).
- **Rezultati obrade**:
  - **Teretna vozila**: 15.482 servisa poklopljeno sa tačnom kilometražom sa pumpe (preostala samo 24 servisa na 4 nova vozila prije prve kartice točenja).
  - **Putnička vozila**: 4.698 servisa poklopljeno sa tačnom kilometražom (preostalih 175 su električna vozila Tesla i Smart EQ).
  - **Radna mašina**: 713 servisa -> dodijeljeni radni sati `0`.
  - **Skladišna mehanizacija**: 7.277 servisa -> dodijeljeni radni sati `0`.
  - **Priključna vozila**: 2.533 servisa -> kilometraža `null` i sakrivena kolona.
  - **Servis motornih vozila**: 88 zapisa -> `null`.
- Generisana je klijentska optimizovana baza točenja [`public/fleet_odometer.json`](file:///c:/Users/emir.durakovic/Desktop/analiza-transporta-master/public/fleet_odometer.json) za brzi pronalazak kilometraže na frontendu.
- Skriptom `scripts/sync_mileage_to_firestore.cjs` svih **30.990 zapisa** je ažurirano u Google Cloud Firestore kolekciji `fleet_costs` putem 78 paralelnih commit batch transakcija sa definisanim `updateMask: ['kilometraza', 'radniSati']`.

---

## 3. Izmjene u Korisničkom Interfejsu (Frontend)

### 1. `ServiceTable.jsx` (Glavna tabela servisa)
- Zaglavlje kolone dinamički prepoznaje kontekst:
  - Kada je tabela filtrirana na *Priključna vozila*: kolona je **potpuno sakrivena**.
  - Kada je filtrirana na *Radna mašina* ili *Skladišna mehanizacija*: naziv kolone je **"Radni sati"**.
  - U ostalim filterima i zbirnom prikazu: naziv je **"Kilometraža / R. sati"**.
- Prikaz ćelija po redovima:
  - Teretna i putnička vozila: formatirani kilometri (npr. `184.250 km`).
  - Radne mašine i skladišna mehanizacija: formatirani sati sa posebnom stilizacijom (npr. `0 h`).
  - Priključna vozila: crtica `-`.

### 2. `WarehouseRepairs.jsx` (Skladišna mehanizacija)
- Dodata kolona **"Radni sati"** u zaglavlju i tijelu tabele sa prikazom `{radniSati} h` (početno `0 h`).

### 3. `VehicleCardModal.jsx` (Kartica pojedinačnog vozila)
- Detektuje tip otvorenog vozila (`vehicleInfo.tipMehan`):
  - Priključna vozila (poluprikolice): kolona se **ne prikazuje**.
  - Radne mašine i viljuškari: kolona nosi naziv **"Radni sati"** (`0 h`).
  - Teretna i putnička vozila: kolona nosi naziv **"Kilometraža"** (`... km`).

### 4. `NewCostModal.jsx` (Unos novog servisa / naloga)
- Dinamička prilagodba sekcije za unos:
  - Za priključna vozila polje se ne prikazuje.
  - Za radne mašine i skladišnu mehanizaciju prikazuje se polje **"Radni Sati (h)"** sa zadanom vrijednošću `0` (omogućava ručnu promjenu).
  - Za teretna i putnička vozila prikazuje se polje **"Kilometraža (km)"** uz mogućnost ručnog unosa.
  - Ugrađeno dugme **`⚡ Poklopi sa točenjem goriva`**: automatski pretražuje točenja za odabrano vozilo i datum, pronalazi najbliže očitanje sa pumpe i ispisuje informativni bedž sa datumom točenja i odstupanjem u danima.

### 5. `exportExcel.js` & `useFleetData.js`
- U funkciju `exportTransactionsToExcel` dodana kolona `"Kilometraža / Radni sati"`.
- U `useFleetData.js` omogućeno čitanje i perzistiranje polja `kilometraza` i `radniSati`.
- Verzija keša povećana na `fleet_dataset_v16_mileage_hours` u `constants.js`.

---

## 4. Verifikacija & Deployment
1. **Lokalni build**: `next build` završen uspješno bez grešaka.
2. **Cloud Firestore**: Ažurirano svih 30.990 dokumenata.
3. **Firebase Hosting**: Uspješno postavljen live build na `https://analiza-transporta-flota.web.app`.
4. **Git Repository**: Sve izmjene pripremljene za commit i push na `origin/master`.
