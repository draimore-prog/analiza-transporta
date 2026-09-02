import https from 'https';
import XLSX from 'xlsx';
import path from 'path';

const PROJECT_ID = 'analiza-transporta-flota';

function runStructuredQuery(query) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(query);
        const options = {
            hostname: 'firestore.googleapis.com',
            path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(body));
                    } catch (e) {
                        resolve([]);
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function fetchFirestore2026() {
    console.log("Fetching all 2026 records from Firestore...");
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
    const docs = [];
    for (const r of results) {
        if (!r.document) continue;
        const name = r.document.name;
        const id = name.split('/').pop();
        const f = r.document.fields;
        docs.push({
            id,
            reg: (f.reg?.stringValue || '').trim().toUpperCase(),
            month: parseInt(f.month?.integerValue || f.month?.stringValue || 0),
            year: parseInt(f.year?.integerValue || f.year?.stringValue || 0),
            cost: parseFloat(f.cost?.doubleValue || f.cost?.integerValue || 0),
            costPart: parseFloat(f.costPart?.doubleValue || f.costPart?.integerValue || 0),
            costService: parseFloat(f.costService?.doubleValue || f.costService?.integerValue || 0),
            datum: f.datum?.stringValue || '',
            opisPopravke: (f.opisPopravke?.stringValue || '').trim(),
            dobavljacOrig: (f.dobavljacOrig?.stringValue || '').trim(),
            segment: f.segment?.stringValue || '',
            tipMehan: f.tipMehan?.stringValue || '',
            garazniBroj: f.garazniBroj?.stringValue || '',
            godProizvodnje: f.godProizvodnje?.stringValue || ''
        });
    }
    return docs;
}

function normalizeStr(s) {
    if (!s) return '';
    return s.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function reconcile() {
    const fsDocs = await fetchFirestore2026();
    console.log(`Loaded ${fsDocs.length} records from Firestore for 2026.`);

    // Read Excel
    const filePath = path.resolve('Za portal.xlsx');
    const workbook = XLSX.readFile(filePath, { cellDates: true });
    const sheet = workbook.Sheets['FINALDATA 2026'];
    const excelRows = XLSX.utils.sheet_to_json(sheet);
    console.log(`Loaded ${excelRows.length} rows from Excel FINALDATA 2026.`);

    // Build index of Firestore records
    // Multi-key matching: reg + month + cost + short opis or date
    const fsKeyCount = new Map();
    fsDocs.forEach(d => {
        const keyExact = `${d.reg}|${d.month}|${d.cost.toFixed(2)}|${normalizeStr(d.opisPopravke).slice(0, 30)}`;
        fsKeyCount.set(keyExact, (fsKeyCount.get(keyExact) || 0) + 1);
    });

    const byMonthReport = {};
    for (let m = 1; m <= 12; m++) {
        byMonthReport[m] = {
            excelRows: 0,
            alreadyInFs: 0,
            newToInsert: 0,
            excelTotalCost: 0,
            newTotalCost: 0,
            newSamples: []
        };
    }

    const newRowsToInsert = [];

    excelRows.forEach((row, rowIdx) => {
        const m = parseInt(row['Month']);
        const y = parseInt(row['Year']) || 2026;
        if (isNaN(m)) return;

        const reg = (row['Reg.oznaka'] || row['RegBroj'] || '').toString().trim().toUpperCase();
        const cost = Math.round((parseFloat(row['cijTot']) || 0) * 100) / 100;
        const opis = (row['RezDio'] || row['Opis'] || '').toString().trim();
        const rep = byMonthReport[m];
        if (!rep) return;

        rep.excelRows++;
        rep.excelTotalCost += cost;

        // Check if excluded (e.g. Month 8)
        if (m === 8) {
            return; // excluded per user instruction!
        }

        const keyExact = `${reg}|${m}|${cost.toFixed(2)}|${normalizeStr(opis).slice(0, 30)}`;
        const availableInFs = fsKeyCount.get(keyExact) || 0;

        if (availableInFs > 0) {
            rep.alreadyInFs++;
            fsKeyCount.set(keyExact, availableInFs - 1); // consume match
        } else {
            rep.newToInsert++;
            rep.newTotalCost += cost;
            if (rep.newSamples.length < 3) {
                rep.newSamples.push({ reg, cost, opis, datum: row['Datum'] });
            }
            newRowsToInsert.push({
                rowIdx,
                row,
                reg,
                month: m,
                year: y,
                cost,
                opis
            });
        }
    });

    console.log("\n=======================================================");
    console.log("RECONCILIATION SUMMARY (Excel vs Firestore 2026)");
    console.log("=======================================================");
    for (let m = 1; m <= 8; m++) {
        const r = byMonthReport[m];
        console.log(`\n--- Month ${m} ---`);
        console.log(`  Excel rows: ${r.excelRows} | Excel cost: ${r.excelTotalCost.toFixed(2)} KM`);
        if (m === 8) {
            console.log(`  ⛔ STATUS: EXCLUDED (Month 8 skipped as requested by user)`);
        } else {
            console.log(`  Already in Firestore: ${r.alreadyInFs}`);
            console.log(`  NEW to insert: ${r.newToInsert} | New cost: ${r.newTotalCost.toFixed(2)} KM`);
            if (r.newSamples.length > 0) {
                console.log(`  Samples of new items:`, JSON.stringify(r.newSamples, null, 2));
            }
        }
    }

    console.log(`\nTOTAL NEW ROWS TO INSERT (Months 1-7): ${newRowsToInsert.length}`);
    const totalNewCost = newRowsToInsert.reduce((sum, item) => sum + item.cost, 0);
    console.log(`TOTAL NEW COST TO INSERT: ${totalNewCost.toFixed(2)} KM`);
}

reconcile().catch(console.error);
