# Standardizacija i Normalizacija Statusa Vozila u Matičnoj Bazi

**Datum:** 10.09.2026.  
**Projekat:** Analiza Transporta i Skladišne Mehanizacije (BINGO d.o.o. Tuzla)  
**URL:** [https://analiza-transporta-flota.web.app/?portal=transport&stranica=maticna-baza-flote](https://analiza-transporta-flota.web.app/?portal=transport&stranica=maticna-baza-flote)

---

## 1. Identifikovani Problem

Korisnik je prijavio nekonzistentnost u prikazu statusa vozila u matičnoj bazi voznog parka:
1. Neka vozila sa statusom **"Rashodovano"** su imala **zelenu** oznaku (kao aktivna vozila), dok su druga imala **crvenu** oznaku.
2. Statusi su bili ispisani miješano velikim i malim slovima (`rashodovano` vs `Rashodovano`, `prodato` vs `Prodato`).

---

## 2. Analiza Uzroka (Root Cause Analysis)

Detaljnim pregledom podataka u `public/fleet_master.json` (ukupno 1.252 unosa) utvrđeno je:
- `Aktivno`: 939 vozila
- `Prodato`: 257 vozila
- `Rashodovano`: 34 vozila
- `prodato`: 3 vozila (mala slova: npr. `M06-T-413`, `M47-A-818`, `O03-T-237`)
- `rashodovano`: 16 vozila (mala slova: npr. reg/GB `304`, `263`, `226`, `223`, `212`, `206`, `346`, `189`, `175`, `125 i`, `121i`, `116 i`, `83 i`, `68`, `33`, `20`)
- `aktivno`: 1 vozilo (`O47-T-868`)
- `undefined`: 2 oštećena zapisa bez registracije (indeksi 1027 i 1188)

### Zašto je dio rashodovanih bio zelen, a dio crven?
U komponentama `MasterFleetTable.jsx`, `WarehouseFleet.jsx` i `Header.jsx`, provjera statusa je bila striktna:
```javascript
const st = v.status || "Aktivno";
let stClass = "bg-emerald-100 text-emerald-800 ..."; // ZELENA PO DEFAULTU!
if (st === "Prodato") {
  stClass = "bg-purple-100 text-purple-900 ...";
} else if (st === "Rashodovano") {
  stClass = "bg-red-100 text-red-900 ..."; // Strogo poređenje sa velikim R!
}
```
Kada je `v.status` bio `"rashodovano"` (sa malim `r`), strogo poređenje `st === "Rashodovano"` je vraćalo `false`. Kod je propadao na defaultnu vrijednost `stClass`, koja je bila **zelena** (`bg-emerald-100`), a tekst se renderovao u malim slovima `"rashodovano"`. S druge strane, 34 zapisa sa velikim `"Rashodovano"` su bila crvena.

Dodatno, u `VehicleCardModal.jsx` (linija 479) status bedž u zaglavlju kartona vozila je bio hardkodiran na zeleno (`bg-emerald-500/30 text-emerald-300`).

---

## 3. Implementirana Rješenja

### 1. Centralni pomoćni moduli (`src/lib/calculations.js`)
Kreirane su i izvezene funkcije:
- `normalizeVehicleStatus(status)`: automatski mapira bilo koje varijacije (`rashod`, `neaktiv`, `prodat`, `aktiv`) na tačno 3 kanonska statusa:
  - **`Aktivno`**
  - **`Prodato`**
  - **`Rashodovano`**
- `getVehicleStatusBadge(status)`: vraća kanonski status, CSS klase za tabele, zaglavlja modala i ikonicu/tačku boje:
  - `Aktivno` -> 🟢 Zeleno (`bg-emerald-100 text-emerald-800 border-emerald-300`)
  - `Prodato` -> 🟣 Ljubičasto (`bg-purple-100 text-purple-900 border-purple-300`)
  - `Rashodovano` -> 🔴 Crveno (`bg-red-100 text-red-900 border-red-300`)

### 2. Čišćenje i normalizacija baze (`public/fleet_master.json`)
- Uklonjena 2 oštećena zapisa bez registarske oznake.
- Normalizovani svi statusi na kanonska velika slova.
- Konačni brojevi:
  - `Aktivno`: **940**
  - `Prodato`: **260**
  - `Rashodovano`: **50**
  - Ukupno: **1.250** validnih vozila

### 3. Zaštita na nivou učitavanja i sinhronizacije (`src/hooks/useFleetData.js`)
- `loadMasterFleet`: filtrira prazne registracije i primjenjuje `normalizeVehicleStatus`.
- Firestore real-time listener: primjenjuje `normalizeVehicleStatus`.
- `saveVehicle`: garantuje da se pri svakom spremanju/uređivanju vozila status sprema kao kanonski.

### 4. Ažuriranje korisničkog interfejsa
- `MasterFleetTable.jsx`: koristi `normalizeVehicleStatus` za filtriranje i `getVehicleStatusBadge` za rendering bedža.
- `WarehouseFleet.jsx`: koristi `normalizeVehicleStatus` za filtriranje i `getVehicleStatusBadge` za rendering bedža.
- `Header.jsx`: koristi `normalizeVehicleStatus` i `getVehicleStatusBadge` u pretrazi vozila.
- `VehicleCardModal.jsx`: dinamički prilagođava boju bedža u zavisnosti od stvarnog statusa vozila.
- `EditVehicleModal.jsx`: automatski postavlja normalizovani status u formi za izmjenu.
- `exportExcel.js`: u Excel izvozu garantuje normalizovan status.

---

## 4. Verifikacija
- Pokrenut `npm run build` -> Uspješan Next.js build bez grešaka.
- Aplikacija deployovana na Firebase Hosting.
- Izmjene commitovane i pushovane na `origin/master`.
