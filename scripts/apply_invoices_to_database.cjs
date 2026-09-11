const fs = require('fs');
const path = require('path');
const https = require('https');
const XLSX = require('./../node_modules/xlsx');

const PROJECT_ID = 'analiza-transporta-flota';
const BATCH_SIZE = 350;

const fleetDataFile = path.resolve('fleet_data.json');
const publicFleetDataFile = path.resolve('public/fleet_data.json');
const excelFile = 'C:\\Users\\emir.durakovic\\Desktop\\Servisna radiona troškovi\\Uređeno\\Pregled troškova 26 02.09.2026.xlsx';

function toFirestoreValue(val) {
  if (val === null || val === undefined) {
    return { nullValue: null };
  } else if (typeof val === 'boolean') {
    return { booleanValue: val };
  } else if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { integerValue: val.toString() };
    } else {
      return { doubleValue: val };
    }
  } else if (val instanceof Date) {
    return { timestampValue: val.toISOString() };
  } else {
    return { stringValue: String(val) };
  }
}

function sendCommit(writes) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ writes });
    const req = https.request({
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body || '{}'));
        } else {
          reject(new Error(`Firestore REST Error ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function normStr(s) {
  if (!s) return '';
  return s.toString().trim().toLowerCase()
    .replace(/[čć]/g, 'c')
    .replace(/[š]/g, 's')
    .replace(/[đ]/g, 'dj')
    .replace(/[ž]/g, 'z')
    .replace(/[^a-z0-9]/g, '');
}

function normReg(s) {
  if (!s) return '';
  return s.toString().trim().toUpperCase()
    .replace(/[ČĆ]/g, 'C')
    .replace(/[Š]/g, 'S')
    .replace(/[Đ]/g, 'DJ')
    .replace(/[Ž]/g, 'Z')
    .replace(/[^A-Z0-9]/g, '');
}

function round2(val) {
  return Math.round((parseFloat(val) || 0) * 100) / 100;
}

function parseExcelDate(val, year, month) {
  if (!val) return null;
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return new Date(Date.UTC(d.y, d.m - 1, d.d)).toISOString();
  }
  if (typeof val === 'string') {
    const parts = val.split('.');
    if (parts.length >= 3) {
      const day = parseInt(parts[0]);
      const m = parseInt(parts[1]);
      const y = parseInt(parts[2]);
      if (!isNaN(day) && !isNaN(m) && !isNaN(y)) return new Date(Date.UTC(y, m - 1, day)).toISOString();
    }
  }
  if (year && month) {
    return new Date(Date.UTC(year, month - 1, 15)).toISOString();
  }
  return null;
}

const regEquivalents = {
  'MINIBAGER': ['MINICATERPILLAR', 'CATERPILLAR'],
  'MINICATERPILLAR': ['MINIBAGER', 'CATERPILLAR'],
  'CATERPILLAR': ['MINIBAGER', 'MINICATERPILLAR'],
  'TRAKTORTOMOVINKOVIC': ['SERVISMOTORNIHVOZILA'],
  'TROSKOVI': ['SERVISMOTORNIHVOZILA'],
  'AGREGATRPOPRINGIPIL': ['SERVISMOTORNIHVOZILA'],
  'AGREGATRINGIPIL': ['SERVISMOTORNIHVOZILA'],
  'SERVISMOTORNIHVOZILA': ['TRAKTORTOMOVINKOVIC', 'TROSKOVI', 'AGREGATRPOPRINGIPIL', 'AGREGATRINGIPIL'],
  'K26M074': ['K26M071'],
  'K26M071': ['K26M074'],
  'J54T570': ['J54T571'],
  'J54T571': ['J54T570']
};

async function main() {
  console.log('🚀 Započinjem proces dodjele brojeva faktura za svih 30.932 zapisa...');

  // 1. Čitanje baze naloga sa portala
  const rawFleet = JSON.parse(fs.readFileSync(fleetDataFile, 'utf8'));
  const portalRecords = rawFleet.records || rawFleet;
  console.log(`📋 Učitano ${portalRecords.length} zapisa sa portala.`);

  // 2. Čitanje Excel izvornika
  console.log(`📑 Čitam izvorni Excel: ${excelFile}`);
  const wb = XLSX.readFile(excelFile);
  const sheets = [
    'FINALDATA 2021',
    'FINALDATA 2022',
    'FINALDATA 2023',
    'FINALDATA 2024',
    'FINALDATA 2025',
    'FINALDATA 2026'
  ];

  const allExcelRows = [];
  let globalExcelIdx = 0;

  sheets.forEach(sheetName => {
    const sheet = wb.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet);
    
    rawRows.forEach((row, rowInSheet) => {
      let regRaw = row['Reg.oznaka'] || row['RegBroj'] || row['Reg. Oznaka'] || row['REG'] || row['Registracija'];
      if (!regRaw) return;
      let reg = regRaw.toString().trim().toUpperCase();
      if (reg === '' || reg === 'NEPOZNATO' || reg === '-') return;

      let cost = parseFloat(row['cijTot']) || parseFloat(row['CijRezDio']) || parseFloat(row['Cijena']) || parseFloat(row['Trošak']) || 0;
      if (isNaN(cost) || cost <= 0) return;

      let costPart = parseFloat(row['CijRezDio']) || 0;
      let costService = parseFloat(row['Cijusluge']) || 0;
      if (costPart === 0 && costService === 0 && cost > 0) {
        let vrsta = (row['VrstaTroska'] || '').toString().toLowerCase();
        if (vrsta.includes('uslug') || vrsta.includes('rad')) costService = cost;
        else costPart = cost;
      }

      let defaultYear = parseInt(sheetName.replace(/\D/g, ''));
      let year = parseInt(row['Year']) || parseInt(row['Godina']) || defaultYear;
      let month = parseInt(row['Month']) || parseInt(row['Mjesec']) || 0;

      let dobavljacOrig = (row['dobavljac'] || row['Dobavljac'] || row['Serviser'] || row['Izvođač'] || '-').toString().trim();
      let rezDio = (row['RezDio'] || row['rezervni dio'] || '-').toString();
      let vrstaTroska = (row['VrstaTroska'] || row['Opis'] || '-').toString();
      let opisPopravke = rezDio !== '-' ? rezDio : vrstaTroska;
      let brracuna = (row['brracuna'] || row['br.racuna'] || row['Broj računa'] || row['Broj racuna'] || '').toString().trim();
      let fakturaTip = (row['Faktura'] || '').toString().trim();
      let serviser = (row['Serviser'] || '').toString().trim();

      let dateIso = parseExcelDate(row['Datum'] || row['Date'], year, month);
      if (!year && dateIso) year = new Date(dateIso).getUTCFullYear();
      if (!month && dateIso) month = new Date(dateIso).getUTCMonth() + 1;

      allExcelRows.push({
        globalIdx: globalExcelIdx++,
        sheetName,
        rowInSheet,
        reg,
        regNorm: normReg(reg),
        cost: round2(cost),
        costPart: round2(costPart),
        costService: round2(costService),
        year,
        month,
        dobavljacOrig,
        dobavljacNorm: normStr(dobavljacOrig),
        opisPopravke,
        opisNorm: normStr(opisPopravke),
        datum: dateIso,
        brracuna,
        fakturaTip,
        serviser
      });
    });
  });

  console.log(`   Parsirano ${allExcelRows.length} validnih redova iz svih 6 tabova.`);

  // 3. Izvršavanje 100% uparivanja
  const usedExcel = new Set();
  const excelByReg = new Map();
  allExcelRows.forEach(erow => {
    if (!excelByReg.has(erow.regNorm)) excelByReg.set(erow.regNorm, []);
    excelByReg.get(erow.regNorm).push(erow);
  });

  function getCandidateRows(pReg) {
    let candidates = excelByReg.get(pReg) || [];
    if (regEquivalents[pReg]) {
      for (let alias of regEquivalents[pReg]) {
        if (excelByReg.has(alias)) {
          candidates = candidates.concat(excelByReg.get(alias));
        }
      }
    }
    return candidates;
  }

  let matchedCount = 0;
  const unmatched = [];

  portalRecords.forEach(prec => {
    const pReg = normReg(prec.reg);
    const pCost = round2(prec.cost);
    const pMonth = prec.month;
    const pYear = prec.year;
    const pOpis = normStr(prec.opisPopravke);
    const pDob = normStr(prec.dobavljacOrig);
    const pDate = prec.datum ? prec.datum.substring(0, 10) : null;

    const candidates = getCandidateRows(pReg);
    let bestIdx = -1;

    // L1: Reg + Year + Month + Cost + Opis + Dob + Date
    for (let erow of candidates) {
      if (usedExcel.has(erow.globalIdx)) continue;
      if (Math.abs(erow.cost - pCost) < 0.02 && erow.month === pMonth && erow.year === pYear) {
        const eDate = erow.datum ? erow.datum.substring(0, 10) : null;
        if (pDate && eDate && pDate === eDate && erow.opisNorm === pOpis && (erow.dobavljacNorm === pDob || !pDob || !erow.dobavljacNorm)) {
          bestIdx = erow.globalIdx;
          break;
        }
      }
    }

    // L2: Reg + Year + Month + Cost + Opis + Dob (Date tolerance)
    if (bestIdx === -1) {
      for (let erow of candidates) {
        if (usedExcel.has(erow.globalIdx)) continue;
        if (Math.abs(erow.cost - pCost) < 0.02 && erow.month === pMonth && erow.year === pYear) {
          if (erow.opisNorm === pOpis && (erow.dobavljacNorm === pDob || !pDob || !erow.dobavljacNorm)) {
            bestIdx = erow.globalIdx;
            break;
          }
        }
      }
    }

    // L3: Reg + Year + Cost + Opis + Dob
    if (bestIdx === -1) {
      for (let erow of candidates) {
        if (usedExcel.has(erow.globalIdx)) continue;
        if (Math.abs(erow.cost - pCost) < 0.02 && erow.year === pYear) {
          if (erow.opisNorm === pOpis && (erow.dobavljacNorm === pDob || !pDob || !erow.dobavljacNorm)) {
            bestIdx = erow.globalIdx;
            break;
          }
        }
      }
    }

    // L4: Reg + Year + Cost + Month + Opis substring
    if (bestIdx === -1) {
      for (let erow of candidates) {
        if (usedExcel.has(erow.globalIdx)) continue;
        if (Math.abs(erow.cost - pCost) < 0.02 && erow.month === pMonth && erow.year === pYear) {
          if (erow.opisNorm.slice(0, 20) === pOpis.slice(0, 20) || pOpis.includes(erow.opisNorm) || erow.opisNorm.includes(pOpis)) {
            bestIdx = erow.globalIdx;
            break;
          }
        }
      }
    }

    // L5: Reg + Year + Cost + Date
    if (bestIdx === -1 && pDate) {
      for (let erow of candidates) {
        if (usedExcel.has(erow.globalIdx)) continue;
        if (Math.abs(erow.cost - pCost) < 0.02 && erow.year === pYear) {
          const eDate = erow.datum ? erow.datum.substring(0, 10) : null;
          if (eDate && eDate === pDate) {
            bestIdx = erow.globalIdx;
            break;
          }
        }
      }
    }

    // L6: Reg + Year + Cost + Month if unique candidate
    if (bestIdx === -1) {
      const matching = candidates.filter(erow => !usedExcel.has(erow.globalIdx) && Math.abs(erow.cost - pCost) < 0.02 && erow.month === pMonth && erow.year === pYear);
      if (matching.length === 1) {
        bestIdx = matching[0].globalIdx;
      }
    }

    // L7: Cross-year candidate
    if (bestIdx === -1) {
      for (let erow of candidates) {
        if (usedExcel.has(erow.globalIdx)) continue;
        if (Math.abs(erow.cost - pCost) < 0.02) {
          if (erow.opisNorm === pOpis && (erow.dobavljacNorm === pDob || !pDob || !erow.dobavljacNorm)) {
            bestIdx = erow.globalIdx;
            break;
          }
        }
      }
    }

    // L8: Extract index from ID
    if (bestIdx === -1 && prec.id && prec.id.startsWith('cost_rec_')) {
      const parts = prec.id.split('_');
      const idx = parseInt(parts[2]);
      if (!isNaN(idx) && allExcelRows[idx] && !usedExcel.has(idx)) {
        const erow = allExcelRows[idx];
        if (Math.abs(erow.cost - pCost) < 0.02) {
          bestIdx = idx;
        }
      }
    }

    if (bestIdx !== -1) {
      usedExcel.add(bestIdx);
      matchedCount++;
      const matchedRow = allExcelRows[bestIdx];
      prec.brojRacuna = matchedRow.brracuna || '-';
      prec.fakturaTip = matchedRow.fakturaTip || (prec.type === 'Interno' ? 'Interna' : 'Eksterna');
      if (matchedRow.serviser && !prec.serviser) {
        prec.serviser = matchedRow.serviser;
      }
    } else {
      unmatched.push(prec);
    }
  });

  // Dodjela brojeva računa za 5 identičnih duplikata
  console.log(`\n🔍 Uparivanje 5 duplikata koji dijele račune sa blizancima...`);
  const duplicateInvoiceMap = {
    'cost_rec_28475_K56_O_568': { br: '3555-0013', tip: 'Eksterna' },
    'cost_rec_28486_K63_O_603': { br: 'I10-021-5290/25-s', tip: 'Eksterna' },
    'cost_rec_30361_MINI_CATERPILLAR': { br: '1050-255-01441', tip: 'Eksterna' },
    'cost_rec_30406_O58_J_554': { br: '1074/25', tip: 'Eksterna' },
    'cost_rec_30407_O59_A_462': { br: '1074/25', tip: 'Eksterna' }
  };

  unmatched.forEach(prec => {
    if (duplicateInvoiceMap[prec.id]) {
      prec.brojRacuna = duplicateInvoiceMap[prec.id].br;
      prec.fakturaTip = duplicateInvoiceMap[prec.id].tip;
      matchedCount++;
    }
  });

  console.log(`✅ USAGLAŠAVANJE ZAVRŠENO: Poklopljeno ${matchedCount} / ${portalRecords.length} (${((matchedCount/portalRecords.length)*100).toFixed(2)}%) zapisa!`);

  // 4. Ažuriranje lokalnih baza podataka (fleet_data.json i public/fleet_data.json)
  console.log('\n💾 Ažuriram lokalne baze `fleet_data.json` i `public/fleet_data.json`...');
  const outputObj = {
    metadata: {
      ...(rawFleet.metadata || {}),
      lastUpdatedWithInvoices: new Date().toISOString(),
      totalRecords: portalRecords.length,
      invoicesCovered: matchedCount
    },
    records: portalRecords
  };

  fs.writeFileSync(fleetDataFile, JSON.stringify(outputObj, null, 2), 'utf8');
  fs.writeFileSync(publicFleetDataFile, JSON.stringify(outputObj, null, 2), 'utf8');
  console.log('   ✅ `fleet_data.json` i `public/fleet_data.json` uspješno spašeni sa novim kolonama!');

  // 5. Batch commit u Cloud Firestore (kolekcija fleet_costs)
  console.log('\n☁️ Šaljem ažuriranja u Google Cloud Firestore kolekciju `fleet_costs`...');
  let writes = [];
  let updatedCount = 0;

  for (let idx = 0; idx < portalRecords.length; idx++) {
    const item = portalRecords[idx];
    const safeDocId = item.id || `cost_rec_${idx}_${(item.reg || '').replace(/[^a-zA-Z0-9]/g, '_')}`;
    const docPath = `projects/${PROJECT_ID}/databases/(default)/documents/fleet_costs/${safeDocId}`;

    const updateFields = {
      brojRacuna: toFirestoreValue(item.brojRacuna || '-'),
      fakturaTip: toFirestoreValue(item.fakturaTip || (item.type === 'Interno' ? 'Interna' : 'Eksterna'))
    };
    if (item.serviser) {
      updateFields.serviser = toFirestoreValue(item.serviser);
    }

    writes.push({
      update: {
        name: docPath,
        fields: updateFields
      },
      updateMask: {
        fieldPaths: Object.keys(updateFields)
      }
    });

    if (writes.length >= BATCH_SIZE) {
      await sendCommit(writes);
      updatedCount += writes.length;
      if (updatedCount % 3500 === 0 || updatedCount >= portalRecords.length) {
        console.log(`   [Firestore fleet_costs] Ažurirano ${updatedCount} / ${portalRecords.length} dokumenata...`);
      }
      writes = [];
    }
  }

  if (writes.length > 0) {
    await sendCommit(writes);
    updatedCount += writes.length;
    console.log(`   [Firestore fleet_costs] Ažurirano ${updatedCount} / ${portalRecords.length} dokumenata.`);
  }

  console.log('\n🎉 SVI PODACI USPJEŠNO UPISANI U FIRESTORE I LOKALNE DATASETOVE!');
}

main().catch(err => {
  console.error('❌ Greška pri upisu faktura:', err);
  process.exit(1);
});
