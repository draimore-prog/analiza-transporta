# 📊 Detaljna Analiza i Strateški Prijedlozi Unapređenja Procesa
**Služba održavanja transporta i skladišne mehanizacije — BINGO d.o.o. Tuzla**
*Datum zabilješke: 31.08.2026.*

---

## 🎯 Izvršni Sažetak (Executive Summary)

Sistem za analizu transporta i održavanja voznog parka upravlja sa preko **1.236 motornih vozila** (od čega 938 aktivnih u transportu) i **595 jedinica skladišne mehanizacije (viljuškara)**, sa bazom od preko **30.800 servisnih intervencija** vrijednih više miliona KM.

Kako bi se operativni troškovi minimizirali, dostupnost flote povećala iznad 98%, a administrativni rad automatizovao, u nastavku je izrađena detaljna analiza:
1. **10 postojećih procesa** sa konkretnim slabostima i prijedlozima za njihovu optimizaciju.
2. **10 potpuno novih procesa** koji donose digitalnu transformaciju, preventivno održavanje i kontrolu troškova.

---

## 🛠️ DIO I: Analiza i Unapređenje 10 Postojećih Procesa

| # | Postojeći Proces | Trenutno Stanje & Slabosti | Prijedlog Unapređenja & Korist |
|---|---|---|---|
| **1** | **Evidencija i unos servisnih naloga / troškova** | Ručni unos podataka (reg, datum, opis, dobavljač, iznos). Iako je omogućen upload računa, podaci se prepisuju ručno. | **AI/OCR Automatsko skeniranje faktura**: Prilikom uploada računa, OCR automatski iščitava broj fakture, dobavljača, datum, stavke i ukupan iznos, smanjujući vrijeme unosa za 80%. |
| **2** | **Karton i historijat vozila (Vehicle Card Modal)** | Prikazuje dosadašnje troškove, YoY i mesečne bar grafove i tabelu popravki. Fokus je pretežno na historijatu. | **Preventivni statusni semafor (Traffic Light Status)**: Dodavanje indikatora statusa (npr. ZELENO: Servisiran, ŽUTO: Bliži se redovan servis, CRVENO: Prekoračen servisni interval) direktno na vrhu kartona. |
| **3** | **Evidencija troškova guma (Tire Costs)** | Gume se vode kao jedna od stavki u segmentu "Guma" bez evidencije pozicije, sezone i pređene kilometraže. | **Digitalna matrica pneumatika po osovinama**: Pozicioniranje guma (prednja leva, pogonska, prikolica), praćenje brenda (Michelin, Sava, Bridgestone), dubine šare u milimetrima i kalkulacija cijene po pređenom kilometru (KM/km). |
| **4** | **Matični registar voznog parka (Master Fleet Table)** | Čuva statičke podatke: reg, garažni broj, marka, model, godište, šasija i status. | **Digitalni pasoš vozila & Istek dokumentacije**: Dodavanje polja za istek registracije, 6-mjesečnog tehničkog pregleda, kalibracije tahografa, ADR certifikata i kasko police sa automatskim upozorenjima 30/15/7 dana prije isteka. |
| **5** | **Analiza i benchmarking dobavljača (Supplier Analytics)** | Prikaz zbirnih troškova, udjela i segmenta popravki po eksternim servisima. | **SLA ocjenjivanje servisa & Indeks ponovljenih kvarova**: Praćenje prosječnog vremena zadržavanja vozila u servisu (Lead Time) i detekcija ponovljenih kvarova na istom sklopu unutar 30 dana radi ocjene kvaliteta partnera. |
| **6** | **Interno vs Eksterno održavanje (Make-or-Buy)** | Praćenje omjera troškova (46% Bingo radionica vs 54% vanjski servisi). | **Analizator kapaciteta vlastite radionice**: Kalkulator uštede vlastitog servisa u odnosu na norm-sat ovlaštenih kuća, sa praćenjem radnih sati internih mehaničara po tipu zahvata. |
| **7** | **Pregled i analitika skladišne mehanizacije (Viljuškari)** | Pregled 595 viljuškara i njihovih popravki po segmentima i godinama. | **Trošak po radnom satu (KM/h) & Zdravlje baterija**: Integracija unosa radnih sati viljuškara (motohours) radi dobijanja troška po radnom satu, uz praćenje ciklusa i stanja vučnih baterija za električne viljuškare. |
| **8** | **YoY i Periodični Finansijski Izvještaji** | Interaktivno poređenje godina, mjeseci i matrica rasta/pada troškova. | **Jednoklikni C-Level Menadžerski Izvještaj (PDF Digest)**: Generisanje sažetog A4 izvršnog rezimea za upravu sa ključnim KPI-jevima, top 5 najskupljih kvarova i preporukama za uštedu. |
| **9** | **Upravljanje ulogama i pravima pristupa (RBAC)** | Korisnički nalozi, uloge (Superadmin, Editor, Preglednik, itd.) i definisane permisije. | **Audit Trail (Dnevnik aktivnosti)**: Detaljno logovanje svake akcije (ko je kada promijenio podatke o vozilu, obrisao trošak ili ažurirao ulogu) radi potpune transparentnosti i sigurnosti. |
| **10** | **Pretraga, filtriranje i tabelarni prikazi** | Brzi search u zaglavlju, kolonski filteri, Excel izvoz i inkrementalni scroll. | **Prilagođeni Sačuvani Pogledi (Saved Views / Presets)**: Mogućnost da korisnik sačuva svoje omiljene kombinacije filtera (npr. "Šleperi MAN na Mehanici 2026") i otvori ih jednim klikom. |

---

## 🚀 DIO II: Prijedlog 10 Potpuno Novih Poslovnih Procesa

### 1. 📅 Preventivni Plan Održavanja i Servisni Kalendar (Scheduled Maintenance Engine)
- **Opis**: Umjesto isključivo reaktivnog bilježenja popravki kada dođe do kvara, kreira se plan redovnih servisa na bazi kilometraže (npr. svakih 30.000 / 60.000 km) ili radnih sati (viljuškari na 500 h).
- **Vrijednost**: Smanjuje skupe vanredne havarije motora i mjenjača za 35%, produžava radni vijek flote i smanjuje zastoje na linijama snabdijevanja Bingo marketa.

### 2. 🚨 Expiry Radar (Nadzorna ploča isteka registracija, tehničkih i tahografa)
- **Opis**: Automatizovana ploča sa kalendarom i notifikacijama koja vizuelno označava vozila čija registracija, 6-mjesečni periodični pregled, kalibracija tahografa ili baždarenje vage ističu u narednih 30 dana.
- **Vrijednost**: Potpuno eliminisanje kazni u saobraćaju i zastoja zbog neproduženih dokumenata za 900+ kamiona.

### 3. 📱 Digitalna Prijava Kvara putem QR Koda (Driver Issue Ticket)
- **Opis**: Svako vozilo i viljuškar dobija unikatnu QR naljepnicu na šoferšajbi/volanu. Vozač mobilnim telefonom skenira kod, fotografiše problem (npr. curenje zraka, istrošene kočnice) i šalje tiket u bazu bez papira.
- **Vrijednost**: Informacija o kvaru stiže radionici u sekundi; dispečer odmah može pripremiti dijelove prije povratka kamiona u bazu.

### 4. 📦 Upravljanje Radioničkim Lagerom Rezervnih Dijelova (Spare Parts Inventory)
- **Opis**: Modul za praćenje stanja zaliha u vlastitim radionicama (filteri, ulja, kočione pločice, jastuci, remenje, sijalice). Prilikom unosa servisa, dijelovi se automatski razdužuju sa lagera.
- **Vrijednost**: Uvid u stvarno stanje lagera, sprečavanje krađa i manjkova, te postavljanje minimalnih zaliha za automatsku narudžbu.

### 5. 🛡️ Sistem za Automatsko Praćenje Garancija na Dijelove i Popravke (Warranty Tracker)
- **Opis**: Kada se na vozilu zamijeni skupi sklop (npr. turbina, kompresor, alternator, kvačilo), sistem automatski postavlja garancijski period (npr. 12 ili 24 mjeseca). Ako se na istom vozilu ponovo unese popravka istog sklopa u garantnom roku, sistem alarmira: *"OVAJ DIO JE POD GARANCIJOM KOD DOBAVLJAČA X"*.
- **Vrijednost**: Direktna finansijska ušteda – izbjegava se dvostruko plaćanje dijelova koji podliježu garanciji.

### 6. ⏱️ Praćenje Radnih Naloga i Norm-Sati Mehaničara (Workshop Labor Tracking)
- **Opis**: Svakom internom mehaničaru se dodjeljuje nalog sa normiranim vremenom (npr. zamjena pločica 1.5h). Mehaničar startuje/završava rad.
- **Vrijednost**: Mjerenje efikasnosti vlastitog tima, ravnomjerno opterećenje radnika i realna procjena kapaciteta vlastite radionice.

### 7. ⚖️ TCO (Total Cost of Ownership) & Kalkulator Isplativosti Zamjene Vozila
- **Opis**: Algoritam koji kombinuje starost vozila, ukupno uloženi novac u popravke, pređenu kilometražu i trend rasta troškova po godini. Sistem generiše preporuku: *"Vozilo A12-K-345 je prešlo prag rentabilnosti – preporučuje se rashod/prodaja i zamjena novim"*.
- **Vrijednost**: Donošenje strateških odluka o nabavkama nove flote na osnovu egzaktnih finansijskih podataka umjesto pretpostavki.

### 8. 💥 Modul za Evidenciju Štete i Saobraćajnih Nezgoda (Damage & Claims Management)
- **Opis**: Posebna evidencija vanrednih šteta (saobraćajne nezgode, oštećenja na rampama marketa, lomovi tereta). Sadrži foto-dokumentaciju, policijski zapisnik, procjenu štete i praćenje regresne naplate od osiguravajućih kuća.
- **Vrijednost**: Razdvajanje redovnog troška održavanja od vanrednih šteta prouzrokovanih nezgodama radi preciznije finansijske slike.

### 9. ⛽ Korelacija Potrošnje Goriva i Troškova Održavanja (Fuel vs Maintenance Correlation)
- **Opis**: Uvoz podataka sa kartica za točenje goriva (prosječna potrošnja l/100km). Nagli skok potrošnje goriva automatski indicira kvar na brizgaljkama, DPF filteru ili geometriji turbine prije nego što vozilo stane na cesti.
- **Vrijednost**: Rana dijagnostika kvarova i smanjenje troška goriva, koji predstavlja najveći pojedinačni operativni trošak flote.

### 10. ✍️ Digitalni Workflow Odobravanja Popravki (Approval Workflow Engine)
- **Opis**: Za sve vanjske popravke ili interne radove čija procijenjena vrijednost prelazi npr. **1.000 KM**, sistem šalje zahtjev za digitalno odobrenje (Pre-Approval) šefu službe održavanja ili tehničkom direktoru prije početka radova.
- **Vrijednost**: Apsolutna kontrola troškova, sprečavanje neovlaštenih popravki i transparentnost u saradnji sa eksternim servisima.

---

## 📈 Preporučeni Redoslijed Implementacije (Faza 1: "Quick Wins")
1. **Digitalni Pasoš & Expiry Radar** (Upozorenja o isticanju registracije i tehničkog pregleda)
2. **Warranty Tracker** (Garancije na dijelove i alarmi za duple popravke)
3. **Pre-Approval Workflow** (Digitalno odobravanje skupih popravki iznad 1.000 KM)
