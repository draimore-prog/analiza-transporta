# Implementacija i Uspješno Pokretanje Firebase Cloud Funkcija za Push Notifikacije

**Datum:** 11.09.2026.  
**Projekat:** Bingo Servis Mehanizacije / Analiza Transporta  

---

## 1. Problem sa klijentskim slanjem iz Web Preglednika
Kada se push notifikacije šalju direktno iz JavaScript koda web preglednika (`fetch("https://exp.host/--/api/v2/push/send")`):
- Zatvaranje modala/taba prekida asinhroni mrežni poziv.
- Adblockeri i sigurnosne ekstenzije u browseru često blokiraju vanjske domene za slanje telemetrije/notifikacija.
- Ako nalog kreira sistem, skripta ili terenski serviser, notifikacija se nije slala centralizovano.

---

## 2. Rješenje: Backend Firebase Cloud Functions (Firestore Trigger)
Uveden je modul `functions/` sa automatskim triggerima na kolekciji `warehouse_work_orders`:

### A. `onWorkOrderCreated`
- **Okidač:** `warehouse_work_orders/{orderId}` prilikom kreiranja novog dokumenta (`onCreate`).
- **Logika:**
  1. Iz baze `serviser_push_tokens` učitava sve registrovane Android tokene servisera.
  2. Generiše visoko-prioritetni paket sa `channelId: "radni-nalozi-channel"`, `priority: "high"`, `sound: "default"`, vibracijom i podacima o nalogu.
  3. Šalje zahtjev direktno sa Google Cloud servera na Expo / FCM Gateway.

### B. `onWorkOrderStatusUpdated`
- **Okidač:** `warehouse_work_orders/{orderId}` prilikom izmjene dokumenta (`onUpdate`).
- **Logika:** Kada voditelj servisa odobri radni nalog (`status === "approved"`), serviseri automatski dobijaju notifikaciju o odobrenju.

---

## 3. Status Produkcije
- Cloud funkcije su raspoređene na regiju `europe-west1`.
- Logovi potvrđuju uspješno automatsko okidanje i slanje notifikacija sa statusom `ok` na sve telefone.
- Klijentski kod web aplikacije je oslobođen slanja notifikacija i oslanja se na Firebase Cloud Backend.
