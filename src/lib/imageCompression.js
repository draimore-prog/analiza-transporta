/**
 * Klijentska automatska kompresija slika prije slanja u bazu podataka (Firestore / Storage).
 * Skalira sliku na maksimalne dimenzije (podrazumijevano 1280px) i komprimira na JPEG kvalitet 0.75.
 * Pretvara fotografije sa kamere telefona od 5-10 MB u lagane fajlove od ~150-250 KB u memoriji browsera.
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.75
  } = options;

  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      return reject(new Error("Odabrani fajl nije validna slika."));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Skaliranje uz očuvanje proporcija (aspect ratio)
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Neuspjelo kreiranje canvas konteksta za kompresiju."));
        }

        // Crtanje i skaliranje slike
        ctx.drawImage(img, 0, 0, width, height);

        // Konverzija u komprimovani JPEG Base64 data URL
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);

        // Proračun veličina
        const originalSizeKB = Math.round(file.size / 1024);
        const approxCompressedSizeKB = Math.round((compressedDataUrl.length * 3) / 4 / 1024);

        resolve({
          dataUrl: compressedDataUrl,
          originalSizeKB,
          compressedSizeKB: approxCompressedSizeKB,
          width,
          height,
          savedPercent: originalSizeKB > 0 ? Math.round(((originalSizeKB - approxCompressedSizeKB) / originalSizeKB) * 100) : 0
        });
      };

      img.onerror = (err) => {
        reject(new Error("Greška pri učitavanju slike za kompresiju: " + err));
      };
    };

    reader.onerror = (err) => {
      reject(new Error("Greška pri čitanju fajla sa uređaja: " + err));
    };
  });
}
