import { LOCKED_2026_BASELINE } from "./constants.js";

export function cleanVehicleType(tipRaw) {
  if (!tipRaw) return 'Servis motornih vozila';
  const tip = tipRaw.trim();
  const lower = tip.toLowerCase();

  if (lower.includes('teretn')) return 'Teretna vozila';
  if (lower.includes('putničk') || lower.includes('putnick')) return 'Putnička vozila';
  if (lower.includes('priključn') || lower.includes('prikljucn')) return 'Priključna vozila';
  if (lower.includes('radn')) return 'Radna mašina';
  if (lower.includes('skladi') || lower.includes('viljuš') || lower.includes('viljusk')) return 'Skladišna mehanizacija';
  if (lower.includes('servis') || lower === 'ostalo' || lower.includes('služb') || lower.includes('sluzb')) return 'Servis motornih vozila';

  return 'Servis motornih vozila';
}

export function cleanBrandName(brandRaw) {
  if (!brandRaw) return '-';
  const b = brandRaw.trim();
  const bLow = b.toLowerCase();

  if (bLow.includes('mercedes')) return 'Mercedes Benz';
  if (bLow.includes('volkswagen') || bLow === 'vw') return 'Volkswagen';
  if (bLow.includes('linde')) return 'Linde';
  if (bLow.includes('jungheinrich')) return 'Jungheinrich';
  if (bLow.includes('still')) return 'Still';
  if (bLow.includes('toyota')) return 'Toyota';
  if (bLow.includes('iveco')) return 'Iveco';
  if (bLow.includes('man')) return 'MAN';
  if (bLow.includes('scania') || bLow.includes('skanija')) return 'Scania';
  if (bLow.includes('schmitz')) return 'Schmitz';
  if (bLow.includes('krone')) return 'Krone';
  if (bLow.includes('caterpillar') || bLow === 'cat') return 'Caterpillar';
  if (bLow.includes('komatsu')) return 'Komatsu';
  if (bLow.includes('hyster')) return 'Hyster';
  if (bLow.includes('yale')) return 'Yale';
  if (bLow.includes('ep equipment') || bLow.startsWith('ep ')) return 'EP Equipment';

  return b;
}

export function calculateFleetByYear(masterFleet) {
  const dynamic2026 = calculateDynamic2026(masterFleet);
  return {
    2021: 1046,
    2022: 1083,
    2023: 1113,
    2024: 1079,
    2025: 1079,
    2026: dynamic2026.total
  };
}

export function calculateDynamic2026(masterFleet) {
  if (!masterFleet || masterFleet.length === 0) {
    return { ...LOCKED_2026_BASELINE };
  }

  let r = 0, p = 0, pr = 0, t = 0, s = 0;
  masterFleet.forEach((v) => {
    const status = (v.status || 'Aktivno').toLowerCase();
    if (status.includes('prodat') || status.includes('rashod') || status.includes('neaktivno')) {
      return;
    }
    const cleanType = cleanVehicleType(v.tipMehan);
    if (cleanType === 'Radna mašina') r++;
    else if (cleanType === 'Putnička vozila') p++;
    else if (cleanType === 'Priključna vozila') pr++;
    else if (cleanType === 'Teretna vozila') t++;
    else if (cleanType === 'Skladišna mehanizacija') s++;
  });

  return {
    radna: r,
    putnicka: p,
    prikljucna: pr,
    teretna: t,
    skladisna: s,
    total: r + p + pr + t + s
  };
}

export function formatKM(val) {
  const num = Number(val);
  if (val === null || val === undefined || isNaN(num)) return '0,00 KM';
  return num.toLocaleString('bs-BA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' KM';
}

export function formatDate(d) {
  if (!d) return '-';
  let dateObj = d;
  try {
    if (typeof d === 'object' && d !== null) {
      if (typeof d.toDate === 'function') {
        dateObj = d.toDate();
      } else if (typeof d.getTime === 'function') {
        dateObj = d;
      } else if (d.seconds !== undefined) {
        dateObj = new Date(d.seconds * 1000);
      } else {
        dateObj = new Date(d);
      }
    } else if (typeof d === 'string' || typeof d === 'number') {
      dateObj = new Date(d);
    }
  } catch (e) {
    return '-';
  }

  if (!dateObj || typeof dateObj.getTime !== 'function' || isNaN(dateObj.getTime())) {
    return '-';
  }
  const day = ('0' + dateObj.getDate()).slice(-2);
  const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
  const year = dateObj.getFullYear();
  return `${day}.${month}.${year}.`;
}

export function formatMileage(val) {
  const num = Number(val);
  if (val === null || val === undefined || isNaN(num)) return '-';
  return Math.round(num).toLocaleString('bs-BA') + ' km';
}

export function formatOperatingHours(val) {
  const num = Number(val);
  if (val === null || val === undefined || isNaN(num)) return '0 h';
  return Math.round(num).toLocaleString('bs-BA') + ' h';
}

export function formatServiceUsage(item) {
  if (!item) return '-';
  const cleanType = cleanVehicleType(item.tipMehan);
  if (cleanType === 'Priključna vozila') return '-';
  if (cleanType === 'Radna mašina' || cleanType === 'Skladišna mehanizacija') {
    return formatOperatingHours(item.radniSati ?? 0);
  }
  if (cleanType === 'Teretna vozila' || cleanType === 'Putnička vozila') {
    return item.kilometraza != null ? formatMileage(item.kilometraza) : '-';
  }
  return '-';
}
