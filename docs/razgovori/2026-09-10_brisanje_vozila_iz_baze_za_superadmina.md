# Implementacija brisanja vozila iz baze voznog parka za Superadmina

## Datum: 10.09.2026.

### Zahtjev korisnika
Omogućiti korisnicima sa ulogom Super Administrator (`superadmin`) mogućnost trajnog brisanja vozila iz baze podataka voznog parka.

### Arhitektura rješenja
1. **Perzistencija u Firestore (`fleet_master`)**:
   - Baza voznog parka kombinuje inicijalni JSON dataset (`master_fleet.json`) sa Firestore kolekcijom `fleet_master`.
   - Kako bi se osiguralo da obrisano vozilo trajno nestane i nikada se više ne učita nakon osvježavanja stranice ili ponovnog učitavanja iz keša/JSON-a, u Firestore dokumentu `fleet_master/{docId}` postavlja se zastavica `isDeleted: true` uz datum brisanja (`deletedAt`).
   - Funkcija `loadMasterFleet` i real-time listener `onSnapshot` automatski filtriraju sva vozila koja imaju `isDeleted: true`.
2. **Optimizam i trenutni odziv**:
   - Odmah po potvrdi brisanja, vozilo se uklanja iz React stanja `masterFleet`, a time automatski i iz `warehouseMasterFleet` (skladišne mehanizacije) i IndexedDB keša.
3. **Prava pristupa (Superadmin samo)**:
   - Dugmad za brisanje prikazuju se isključivo ako je korisnik Superadmin (`activeUser.role === 'superadmin'` ili `currentRole.roleId === 'superadmin'` ili korisničko ime `emir.durakovic`).
   - Zahtijeva se eksplicitna potvrda prije brisanja (`confirm` dijalog sa registracijom vozila).

### Mjesta gdje je dodana opcija brisanja
1. **Matična baza voznog parka** (`MasterFleetTable.jsx`):
   - U svakom redu tabele, pored dugmadi "📋 Karton" i "✏️ Uredi", dodano je crveno dugme "🗑️ Obriši".
2. **Šifrarnik skladišne mehanizacije** (`WarehouseFleet.jsx`):
   - U svakom redu tabele skladišne mehanizacije dodano je crveno dugme "🗑️ Obriši".
3. **Servisna kartica vozila** (`VehicleCardModal.jsx`):
   - U zaglavlju kartona vozila, pored dugmadi "✏️ Uredi Vozilo" i "🖨️ Štampaj", dodano je crveno dugme "🗑️ Obriši Vozilo".
4. **Modal za uređivanje vozila** (`EditVehicleModal.jsx`):
   - U podnožju modala (lijevi ugao) dodano je dugme "🗑️ Obriši Vozilo" kada se uređuje postojeće vozilo.

### Modifikovani fajlovi
- `src/hooks/useFleetData.js`
- `src/components/transport/MasterFleetTable.jsx`
- `src/components/warehouse/WarehouseFleet.jsx`
- `src/components/modals/VehicleCardModal.jsx`
- `src/components/modals/EditVehicleModal.jsx`
- `src/app/page.jsx`

### Verifikacija i Deploy
- Pokrenut `npm run build` – uspješno kompajlirano (kod 0).
- Izmjene commitovane i pushane na GitHub (`origin/master`).
- Izvršen deploy na Firebase Hosting (`https://analiza-transporta-flota.web.app`).
