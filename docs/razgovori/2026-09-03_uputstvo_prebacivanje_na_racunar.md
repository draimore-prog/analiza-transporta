# Uputstvo za prebacivanje projekta sa laptopa na računar

**Datum**: 03.09.2026.  
**Projekat**: Analiza Transporta - Održavanje Flote (`analiza-transporta-flota`)

---

## 1. Web Pristup (Najbrži način bez instalacije)
Za rad i korištenje aplikacije na novom računaru (pregled analitike, uvoz novih Excel fajlova, rad sa kartonima vozila):
- Otvoriti web preglednik na računaru i ići na adresu: **`https://analiza-transporta-flota.web.app`**
- Svi podaci se automatski učitavaju iz Google Cloud Firestore baze podataka u realnom vremenu.

---

## 2. Razvojno okruženje (Kloniranje koda na novi računar)

Ako na novom računaru želite raditi izmjene koda ili vršiti uvoz podataka putem skripti:

1. **Instalacija alata na računaru**:
   - Git: [https://git-scm.com/](https://git-scm.com/)
   - Node.js (v18+): [https://nodejs.org/](https://nodejs.org/)

2. **Kloniranje repozitorija**:
   ```bash
   git clone https://github.com/draimore-prog/analiza-transporta.git
   cd analiza-transporta
   ```

3. **Instalacija zavisnosti**:
   ```bash
   npm install
   ```

4. **Autentifikacija na Firebase (opcionalno za deploy)**:
   ```bash
   npx firebase-tools login
   ```

5. **Pokretanje lokalno**:
   ```bash
   npm run dev
   ```

6. **Objava izmjena (Deploy na Firebase Hosting)**:
   ```bash
   npx firebase-tools deploy --only hosting
   ```

---

## 3. Napomena o podacima (Single Source of Truth)
Baza podataka **Google Cloud Firestore** (`analiza-transporta-flota`) je jedini izvor istine. Svi podaci od 2021. do 2026. godine su pohranjeni u oblaku i sinhronizovani, tako da nema potrebe za ručnim prenošenjem baza ili Excel fajlova između laptopa i računara.
