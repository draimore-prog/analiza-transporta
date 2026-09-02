import https from 'https';
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const PROJECT_ID = 'analiza-transporta-flota';
const BATCH_SIZE = 350;

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
    } else if (typeof val === 'object') {
        if (Array.isArray(val)) {
            return { arrayValue: { values: val.map(toFirestoreValue) } };
        } else {
            let fieldsMap = {};
            for (let k of Object.keys(val)) {
                fieldsMap[k] = toFirestoreValue(val[k]);
            }
            return { mapValue: { fields: fieldsMap } };
        }
    } else {
        return { stringValue: String(val) };
    }
}

function sendRequest(pathUrl, method = 'POST', bodyData = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'firestore.googleapis.com',
            path: pathUrl,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (bodyData) {
            options.headers['Content-Length'] = Buffer.byteLength(bodyData);
        }
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(body));
                    } catch (e) {
                        resolve({});
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                }
            });
        });
        req.on('error', reject);
        if (bodyData) req.write(bodyData);
        req.end();
    });
}

function commitBatch(writes) {
    return sendRequest(`/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit`, 'POST', JSON.stringify({ writes }));
}

function runStructuredQuery(query) {
    return sendRequest(`/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`, 'POST', JSON.stringify(query));
}

function ocistiSegment(segment, dobavljac) {
    if (dobavljac && dobavljac.toString().toLowerCase().includes('pgl')) return 'Guma';
    if (!segment) return 'Ostalo';
    
    let s = segment.toString().replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ").trim();
    if (s === '/' || s === '' || s === '-' || s.toLowerCase() === 'nepoznato') return 'Ostalo';

    let sLower = s.toLowerCase();
    if (sLower.includes('gum') || sLower.includes('pneumat')) return 'Guma';
    if (sLower.includes('hidraul')) return 'Hidraulika';
    if (sLower.includes('motor') || sLower.includes('agregat')) return 'Motor';
    if (sLower.includes('kočnic') || sLower.includes('kocnic') || sLower.includes('disk')) return 'Kočnice';
    if (sLower.includes('mjenjač') || sLower.includes('mjenjac') || sLower.includes('kvačil') || sLower.includes('kvacil')) return 'Mjenjač';
    if (sLower.includes('elektr') || sLower.includes('akumulat')) return 'Autoelektrika';
    if (sLower.includes('limarij') || sLower.includes('staklo') || sLower.includes('šajb') || sLower.includes('sajb')) return 'Limarija i stakla';
    if (sLower.includes('redovn') || sLower.includes('ulje') || sLower.includes('filter')) return 'Redovan servis';
    if (sLower.includes('tečn') || sLower.includes('tecn')) return 'Tečnost';
    if (sLower.includes('sign')) return 'Signalizacija';
    if (sLower.includes('regist') || sLower.includes('tehnički')) return 'Registracija';
    if (sLower.includes('pranj') || sLower.includes('čisć')) return 'Pranje';

    return sLower.charAt(0).toUpperCase() + sLower.slice(1);
}

function ocistiTip(tip) {
    if (!tip) return 'Teretna vozila';
    let t = tip.toString().trim();
    if (t.toLowerCase().includes('teret')) return 'Teretna vozila';
    if (t.toLowerCase().includes('putničk') || t.toLowerCase().includes('putnick')) return 'Putnička vozila';
    if (t.toLowerCase().includes('priključ') || t.toLowerCase().includes('prikol')) return 'Priključna vozila';
    if (t.toLowerCase().includes('skladiš') || t.toLowerCase().includes('viljuš') || t.toLowerCase().includes('skladis')) return 'Skladišna mehanizacija';
    if (t.toLowerCase().includes('radn')) return 'Radna mašina';
    if (t.toLowerCase().includes('servis')) return 'Servis motornih vozila';
    return t;
}

function parseExcelDate(val, year, month) {
    if (!val) return null;
    if (val instanceof Date) return val.toISOString();
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

function normalizeStr(s) {
    if (!s) return '';
    return s.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function runDeltaImport() {
    console.log("🚀 Započinjem precizan delta uvoz za 2026. godinu u Firestore...");

    // 1. Fetch current 2026 documents from Firestore fleet_costs
    console.log("📥 Dohvaćam postojeće 2026 zapise iz Firestorea radi deduplikacije...");
    const query = {
        structuredQuery: {
            from: [{ collectionId: 'fleet_costs' }],
            where: {
                fieldFilter: {
                    field: { fieldPath: 'year' },
                    op: 'EQUAL',
                    value: { integerValue: '2026' }
                }
            }
        }
    };
    const results = await runStructuredQuery(query);
    console.log(`   Dohvaćeno ${results.length} postojećih rezultata za 2026. iz Firestorea.`);

    const fsKeyCount = new Map();
    results.forEach(r => {
        if (!r.document) return;
        const f = r.document.fields;
        const reg = (f.reg?.stringValue || '').trim().toUpperCase();
        const month = parseInt(f.month?.integerValue || f.month?.stringValue || 0);
        const cost = parseFloat(f.cost?.doubleValue || f.cost?.integerValue || 0);
        const opis = (f.opisPopravke?.stringValue || '').trim();
        const keyExact = `${reg}|${month}|${cost.toFixed(2)}|${normalizeStr(opis).slice(0, 30)}`;
        fsKeyCount.set(keyExact, (fsKeyCount.get(keyExact) || 0) + 1);
    });

    // 2. Fetch fleet_master to identify if any vehicles need insertion
    console.log("📋 Provjeravam fleet_master...");
    const masterQuery = {
        structuredQuery: {
            from: [{ collectionId: 'fleet_master' }]
        }
    };
    const masterResults = await runStructuredQuery(masterQuery);
    const existingVehicles = new Set();
    masterResults.forEach(r => {
        if (r.document && r.document.fields) {
            const reg = (r.document.fields.reg?.stringValue || '').trim().toUpperCase();
            if (reg) existingVehicles.add(reg);
        }
    });
    console.log(`   Postojećih vozila u fleet_master: ${existingVehicles.size}`);

    // 3. Read Excel file
    const filePath = path.resolve('Za portal.xlsx');
    console.log(`📑 Čitam Excel datoteku: ${filePath}`);
    const wb = XLSX.readFile(filePath, { cellDates: true });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets['FINALDATA 2026']);
    console.log(`   Ukupno redova u tabu FINALDATA 2026: ${rows.length}`);

    const newCostRecords = [];
    const missingVehicles = new Map();

    rows.forEach((row, idx) => {
        const reg = (row['Reg.oznaka'] || row['RegBroj'] || row['Reg. Oznaka'] || '').toString().trim().toUpperCase();
        if (!reg || reg === '-' || reg === 'NEPOZNATO') return;

        let y = parseInt(row['Year']) || 2026;
        let m = parseInt(row['Month']);

        // DERIVE MONTH AND YEAR PRIMARILY FROM "Datum" TO AVOID TYPOS IN "Month" COLUMN
        const dateIso = parseExcelDate(row['Datum'], y, m);
        if (dateIso) {
            const parsedDateObj = new Date(dateIso);
            m = parsedDateObj.getUTCMonth() + 1;
            y = parsedDateObj.getUTCFullYear();
        }

        if (isNaN(m)) return;

        // CRITICAL FILTER: EXCLUDE MONTH 8 (AUGUST 2026) PER USER REQUIREMENT!
        if (m === 8) {
            return;
        }

        const cost = Math.round((parseFloat(row['cijTot']) || 0) * 100) / 100;
        if (isNaN(cost) || cost <= 0) return;

        const opis = (row['RezDio'] || row['Opis'] || '-').toString().trim();
        const keyExact = `${reg}|${m}|${cost.toFixed(2)}|${normalizeStr(opis).slice(0, 30)}`;
        const availableInFs = fsKeyCount.get(keyExact) || 0;

        if (availableInFs > 0) {
            // Already in Firestore -> skip
            fsKeyCount.set(keyExact, availableInFs - 1);
        } else {
            // NEW RECORD TO INSERT!
            let costPart = parseFloat(row['CijRezDio']); if (isNaN(costPart)) costPart = 0;
            let costService = parseFloat(row['Cijusluge']); if (isNaN(costService)) costService = 0;
            if (costPart === 0 && costService === 0 && cost > 0) {
                let vrsta = (row['VrstaTroska'] || '').toString().toLowerCase();
                if (vrsta.includes('uslug') || vrsta.includes('rad')) costService = cost;
                else costPart = cost;
            }

            const dobavljacOrig = (row['dobavljac'] || row['Dobavljac'] || row['Serviser'] || '-').toString().trim();
            const isInternal = dobavljacOrig.toLowerCase().includes('intern');
            const segment = ocistiSegment(row['Segment'], dobavljacOrig);
            const tipMehan = ocistiTip(row['TipMehan']);
            const markaVoz = (row['MarkaVoz'] || 'Nepoznato').toString().trim();
            const garazniBroj = (row['MT'] || row['GB'] || '-').toString().trim();
            const godProizvodnje = (row['God.'] || row['Godište'] || '-').toString().trim();
            const dateIso = parseExcelDate(row['Datum'], y, m);

            newCostRecords.push({
                excelIdx: idx,
                reg,
                cost,
                costPart: Math.round(costPart * 100) / 100,
                costService: Math.round(costService * 100) / 100,
                year: y,
                month: m,
                segment,
                type: isInternal ? 'Interno' : 'Eksterno',
                dobavljacOrig,
                datum: dateIso,
                opisPopravke: opis,
                tipMehan,
                markaVoz,
                garazniBroj,
                godProizvodnje
            });

            if (!existingVehicles.has(reg) && !missingVehicles.has(reg)) {
                missingVehicles.set(reg, {
                    reg,
                    garazniBroj,
                    tipMehan,
                    markaVoz,
                    modelVoz: markaVoz,
                    godProizvodnje,
                    brojSasije: '-',
                    status: 'Aktivno'
                });
            }
        }
    });

    console.log(`\n✨ Pronađeno novih troškova za unos: ${newCostRecords.length}`);
    console.log(`✨ Pronađeno novih vozila za fleet_master: ${missingVehicles.size}`);

    // 4. Insert missing vehicles into fleet_master if any
    if (missingVehicles.size > 0) {
        console.log(`\n🚘 Unosim ${missingVehicles.size} vozila u 'fleet_master'...`);
        let writes = [];
        for (const v of missingVehicles.values()) {
            let safeDocId = v.reg.replace(/[\/\\#\?]/g, '_').trim();
            let docPath = `projects/${PROJECT_ID}/databases/(default)/documents/fleet_master/${safeDocId}`;
            let fields = {};
            for (let k of Object.keys(v)) {
                fields[k] = toFirestoreValue(v[k]);
            }
            writes.push({
                update: {
                    name: docPath,
                    fields: fields
                }
            });
        }
        await commitBatch(writes);
        console.log("   ✅ Sva nova vozila uspješno upisana u 'fleet_master'.");
    }

    // 5. Insert new cost records into fleet_costs with deterministic unique IDs
    console.log(`\n💳 Unosim ${newCostRecords.length} novih troškova u 'fleet_costs'...`);
    let costWrites = [];
    let uploadedCount = 0;

    for (let i = 0; i < newCostRecords.length; i++) {
        const item = newCostRecords[i];
        // Unique deterministic ID based on year, month, index, and sanitized reg
        const safeReg = item.reg.replace(/[^a-zA-Z0-9]/g, '_');
        const docId = `cost_2026_m${item.month}_${item.excelIdx}_${safeReg}`;
        const docPath = `projects/${PROJECT_ID}/databases/(default)/documents/fleet_costs/${docId}`;

        const fields = {};
        for (let k of Object.keys(item)) {
            if (k === 'excelIdx') continue;
            fields[k] = toFirestoreValue(item[k]);
        }

        costWrites.push({
            update: {
                name: docPath,
                fields: fields
            }
        });

        if (costWrites.length >= BATCH_SIZE) {
            await commitBatch(costWrites);
            uploadedCount += costWrites.length;
            console.log(`   [fleet_costs] Upisano ${uploadedCount} / ${newCostRecords.length} zapisa...`);
            costWrites = [];
        }
    }

    if (costWrites.length > 0) {
        await commitBatch(costWrites);
        uploadedCount += costWrites.length;
        console.log(`   [fleet_costs] Upisano ${uploadedCount} / ${newCostRecords.length} zapisa.`);
    }

    console.log("\n🎉 Uspješno završen kompletan delta uvoz u Firestore Cloud!");
}

runDeltaImport().catch(err => {
    console.error("❌ Greška tokom uvoza:", err);
    process.exit(1);
});
