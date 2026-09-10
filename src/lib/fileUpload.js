import { storage } from "./firebase.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Optimizacija i kompresija slike putem HTML5 Canvas-a
 * Smanjuje rezoluciju i težinu (sa npr. 8MB na 250KB) uz visoki kvalitet.
 */
export async function compressImage(file, maxWidth = 1600, maxHeight = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return reject(new Error("Fajl nije slika"));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Kompresovani Data URL
        const dataUrl = canvas.toDataURL("image/jpeg", quality);

        // Također kreiraj Blob za Storage upload
        canvas.toBlob(
          (blob) => {
            resolve({ dataUrl, blob, width, height });
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Greška pri čitanju slike"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Greška pri učitavanju fajla"));
    reader.readAsDataURL(file);
  });
}

/**
 * Čitanje PDF-a ili drugog dokumenta u Data URL
 */
export async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Greška pri čitanju dokumenta"));
    reader.readAsDataURL(file);
  });
}

/**
 * Univerzalni uploader za Slike i Račune:
 * 1. Pokušava upload na Firebase Storage (u folder attachments ili vehicles)
 * 2. Ako Firebase Storage nije dostupan ili baci grešku, transparentno vraća optimizovani Data URL
 * Tako upload uvijek 100% uspije i trajno se pohranjuje u bazu!
 */
export async function uploadMediaFile(file, folder = "attachments") {
  if (!file) return null;

  const timestamp = Date.now();
  const cleanName = (file.name || "slika.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${folder}/${timestamp}_${cleanName}`;

  let compressedDataUrl = null;
  let fileToUpload = file;
  let mimeType = file.type || "image/jpeg";

  if (file.type.startsWith("image/")) {
    try {
      const comp = await compressImage(file);
      compressedDataUrl = comp.dataUrl;
      if (comp.blob) {
        fileToUpload = comp.blob;
        mimeType = "image/jpeg";
      }
    } catch (e) {
      console.warn("Canvas compression fallback:", e);
      compressedDataUrl = await readFileAsDataUrl(file);
    }
  } else {
    // PDF ili drugi format
    compressedDataUrl = await readFileAsDataUrl(file);
  }

  // Pokušaj Firebase Storage upload
  try {
    const storageRef = ref(storage, filePath);
    const metadata = { contentType: mimeType };
    const snapshot = await uploadBytes(storageRef, fileToUpload, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      url: downloadURL,
      name: file.name,
      size: file.size,
      type: mimeType,
      path: filePath,
      storageType: "firebase"
    };
  } catch (storageError) {
    console.info("Firebase Storage fallback na Data URI:", storageError?.message);
    return {
      url: compressedDataUrl,
      name: file.name,
      size: file.size,
      type: mimeType,
      path: filePath,
      storageType: "inline"
    };
  }
}

/**
 * Upload skupa slika za određeno vozilo (do 10 slika)
 */
export async function uploadVehicleImages(files, reg = "vozilo", onProgress = null) {
  if (!files || files.length === 0) return [];
  const cleanReg = (reg || "vozilo").replace(/[^a-zA-Z0-9_-]/g, "_");
  const folder = `vehicles/${cleanReg}`;

  const uploaded = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    if (onProgress) {
      onProgress({ current: i + 1, total, fileName: file.name });
    }
    const res = await uploadMediaFile(file, folder);
    if (res && res.url) {
      uploaded.push({
        url: res.url,
        name: res.name || `Slika ${i + 1}`,
        path: res.path,
        storageType: res.storageType,
        uploadedAt: new Date().toISOString()
      });
    }
  }

  return uploaded;
}
