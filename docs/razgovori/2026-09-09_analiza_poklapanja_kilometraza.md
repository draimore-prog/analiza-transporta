# Rezultati analize poklapanja kilometraža sa servisima

**Datum:** 09.09.2026.  
**Autor:** Emir Duraković & Antigravity  

---

## 1. Rezime analize

Nakon čišćenja podvozara i usklađivanja baze na osnovu revidirane tabele, izvršena je kompletna provjera spajanja evidencije točenja goriva i kilometraža ([Evidencija_Sipanja_I_Kilometraza_Flote_Azurirano.xlsx](file:///C:/Users/emir.durakovic/Desktop/Gemini-Files/Reports/Evidencija_Sipanja_I_Kilometraza_Flote_Azurirano.xlsx)) sa bazom servisa ([fleet_data.json](file:///c:/Users/emir.durakovic/Desktop/analiza-transporta-master/fleet_data.json)).

### Ključni pokazatelji poklapanja:
* **Ukupno servisa na motornim vozilima (Putnička + Teretna):** **20.406 servisa**
* **Uspješno pronađena najbliža kilometraža:** **20.177 servisa (98,88%)**
* **Servisi bez kilometraže:** **229 servisa (1,12%)**
  * Od toga **175 servisa** pripada električnim vozilima (Tesla i Smart EQ) koja se pune na punjačima i nemaju sipanja goriva.
  * Preostala **54 servisa** pripadaju manjim eksternim nosiocima ili opremi.

---

## 2. Poklapanje na nivou vozila

Od ukupno **538 jedinstvenih putničkih i teretnih vozila** u bazi servisa:
* **Poklopljeno po registraciji ili MT:** **506 vozila (94,05%)**
* **Nepoklopljeno:** **32 vozila (5,95%)**
  * **8 električnih vozila:** Tesla (K54-O-736) i Smart EQ (E27-J-857, J68-O-952, E27-J-856, E27-J-855, T37-O-604, E27-J-858, J68-O-682) – ukupno 175 servisa.
  * **24 ostala nosioca:** Manji dio preostalih eksternih partnera (Džajić, Duka, Spole, Violeta...) i pomoćnih mašina sa MT `Tuzla Remont` – ukupno 54 servisa.

---

## 3. Vremenska preciznost pridružene kilometraže

Analiza vremenske udaljenosti između datuma servisa i najbližeg evidentiranog točenja sa kilometražom pokazuje izuzetnu tačnost:

| Vremenski raspon | Broj servisa | Procenat |
| :--- | :---: | :---: |
| **Isti dan / unutar 24h** | **6.551** | **32,47%** |
| **Unutar 7 dana** | **10.328** | **51,19%** |
| **Unutar 8 – 30 dana** | **2.236** | **11,08%** |
| **Preko 30 dana razmaka** | **1.062** | **5,26%** |
| **UKUPNO POKLOPLJENO** | **20.177** | **100,00%** |

* **Medijan odstupanja:** **2,0 dana** (pola svih servisa ima sipanje u rasponu od 48 sati).
* **Prosječno odstupanje:** 11,7 dana.
* **Ukupno unutar prve sedmice (0–7 dana):** **83,66% servisa**.

---

## 4. Zaključak i preporuka
Pokrivenost od **98,88%** i medijan od **2 dana** potvrđuju da je evidencija točenja i kilometraža u potpunosti spremna za integraciju u bazu servisa i analitički portal (TCO po kilometru, trošak po km, intervali održavanja).
