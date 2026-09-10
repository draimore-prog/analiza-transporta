# Zapisnik izmjene: Faza 1 - Modul Radnih Naloga i Preventivnih Pregleda Skladišne Mehanizacije

**Datum:** 10. septembar 2026.  
**Portal:** Logistika - Servis motornih vozila i skladišne mehanizacije  
**Zahtjev:** Pokrenuti izradu hibridnog sistema radnih naloga i preventivnih pregleda skladišne mehanizacije. Implementirati Fazu 1 – uspostavljanje Firestore strukture, prijem radnih naloga na portalu, pregled sa 8-dijelnom ček-listom i 5 fotografija, uređivanje i verifikacija, A4 obrazac za printanje, te sistem real-time notifikacija i dispečinga.

---

### 1. Uvedene komponente i funkcionalnosti

1. **Firestore Kolekcija i Hook (`useWarehouseWorkOrders.js`)**:
   - Povezivanje na kolekciju `warehouse_work_orders` sa automatskim generisanjem rednog broja (`RN-SM-YYYYMM-XXXX`).
   - Real-time sinhronizacija `onSnapshot` naloga razvrstanih po statusima (`pending`, `in_progress`, `completed`, `approved`).
   - Metode za kreiranje, ažuriranje, odobravanje (`approved`) i brisanje radnih naloga.
   - Praćenje broja naloga koji čekaju pregled voditelja (`pendingReviewCount`).

2. **Novi Tab 6 na Portalu Skladišne Mehanizacije (`WarehouseWorkOrders.jsx`)**:
   - Dodan tab 6: *Radni Nalozi & Pregledi* 📋 sa URL slugom `?portal=skladisna-mehanizacija&stranica=radni-nalozi`.
   - 4 KPI kartice na vrhu: Ukupno naloga, Čeka pregled voditelja (sa animiranim indikatorom), Zadano/U toku na terenu i Odobreni nalozi.
   - Brza pretraga po broju naloga, ID-u viljuškara, modelu, lokaciji/PJ i serviseru.
   - Filteri po statusu i tipu rada (preventivni pregled vs. servis kvara).
   - Mogućnost instantnog generisanja oglednog primjera naloga jednim klikom (`Generiši Primjer Naloga`).

3. **Detaljan Pregled Radnog Naloga (`WorkOrderDetailModal.jsx`)**:
   - Prikaz generalija mašine (Tip, Proizvođač, Model, Serijski broj, PJ, kreirao).
   - 8-dijelna kontrolna ček-lista sa zelenim (Ispravno) i crvenim (Defekt sa napomenom) indikatorima:
     - Točkovi i gume
     - Kran, viljuške i lanci
     - Baterija i punjač
     - Hidraulika i ulje
     - Kočioni sistem
     - Ruda i elektronika
     - Šasija i sjedište
     - Signalizacija i sigurnost
   - Polja za opis izvršenih radova, utrošeni materijal i radne sate (MTH).
   - Galerija 5 fotografija sa terena (Naprijed, Nazad, Lijevo, Desno, Tabla sa satima/Unutrašnjost) sa lightbox modalnim uvećanjem.
   - Mogućnost uređivanja podataka i odobravanja naloga od strane voditelja.

4. **A4 Zvanični Print Ready Šablon (`WorkOrderPrintModal.jsx`)**:
   - Memorandum BINGO d.o.o. Tuzla – Služba Transporta i Skladišne Mehanizacije.
   - Tabela osnovnih podataka, tabela ček-liste ispravnosti, opis radova i utrošeni dijelovi.
   - Potpisne linije za servisera i rukovodioca skladišta/mehanizacije.

5. **Dispečing Zadataka (`CreateWorkOrderModal.jsx`)**:
   - Mogućnost kreiranja naloga od strane voditelja s pretragom mehanizacije iz baze od 594 jedinice.
   - Odabir prioriteta (Normalno, Hitno, Kritično) i unos uputstva za servisera.

6. **Notifikacijski Sistem (`Header.jsx` & `Sidebar.jsx`)**:
   - Zvonce u zaglavlju sa brojačem i brzim padajućim menijem pristiglih naloga sa terena.
   - Pulsirajući bedž na Tabu 6 u navigacionoj traci kad postoje nalozi koji čekaju verifikaciju.

---

### 2. Modifikovani i kreirani fajlovi
- `src/hooks/useWarehouseWorkOrders.js` [NEW]
- `src/components/warehouse/WarehouseWorkOrders.jsx` [NEW]
- `src/components/warehouse/WorkOrderDetailModal.jsx` [NEW]
- `src/components/warehouse/WorkOrderPrintModal.jsx` [NEW]
- `src/components/warehouse/CreateWorkOrderModal.jsx` [NEW]
- `src/lib/constants.js` [MODIFY]
- `src/components/layout/Sidebar.jsx` [MODIFY]
- `src/components/layout/Header.jsx` [MODIFY]
- `src/app/page.jsx` [MODIFY]
