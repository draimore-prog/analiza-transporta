const fs = require('fs');
const https = require('https');
const path = require('path');
const XLSX = require('xlsx');

const PROJECT_ID = 'analiza-transporta-flota';
const BATCH_SIZE = 400;

function mapVrsta(raw) {
    if (!raw) return 'Teretna vozila';
    let s = String(raw).trim();
    if (s.includes('Teretn')) return 'Teretna vozila';
    if (s.includes('Putničk')) return 'Putnička vozila';
    if (s.includes('Skladišn')) return 'Skladišna mehanizacija';
    if (s.includes('Priključn')) return 'Priključna vozila';
    if (s.includes('Radn')) return 'Radna mašina';
    if (s.includes('Servis')) return 'Servis motornih vozila';
    return s;
}

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

function sendRequest(pathUrl, method = 'GET', bodyData = null) {
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
                    resolve(body ? JSON.parse(body) : {});
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

async function fetchAllDocumentPaths(collectionName) {
    let docPaths = [];
    let pageToken = '';

    do {
        let url = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}?pageSize=300`;
        if (pageToken) {
            url += `&pageToken=${encodeURIComponent(pageToken)}`;
        }
        try {
            let res = await sendRequest(url, 'GET');
            if (res.documents && res.documents.length > 0) {
                res.documents.forEach(doc => docPaths.push(doc.name));
            }
            pageToken = res.nextPageToken || '';
        } catch (e) {
            console.warn(`Warning listing collection ${collectionName}:`, e.message);
            break;
        }
    } while (pageToken);

    return docPaths;
}

async function cleanCollection(collectionName) {
    console.log(`🧹 Listing all documents in '${collectionName}' to wipe existing data...`);
    let docPaths = await fetchAllDocumentPaths(collectionName);
    console.log(`🔍 Found ${docPaths.length} documents in '${collectionName}'. Deleting in batches...`);

    let writes = [];
    let deletedCount = 0;

    for (let pathStr of docPaths) {
        writes.push({ delete: pathStr });
        if (writes.length >= BATCH_SIZE) {
            await commitBatch(writes);
            deletedCount += writes.length;
            console.log(`   [${collectionName}] Wiped ${deletedCount} / ${docPaths.length} documents...`);
            writes = [];
        }
    }

    if (writes.length > 0) {
        await commitBatch(writes);
        deletedCount += writes.length;
        console.log(`   [${collectionName}] Wiped ${deletedCount} / ${docPaths.length} documents.`);
    }

    console.log(`✨ Collection '${collectionName}' is completely cleaned!`);
}

async function runCleanAndReimport() {
    console.log('🧼 Starting COMPLETE WIPE and FRESH RE-IMPORT into Firestore Cloud Database...');

    // Step 1: Wipe existing fleet_costs and fleet_master collections in Firestore
    await cleanCollection('fleet_costs');
    await cleanCollection('fleet_master');

    // Step 2: Import vehicles from Šifrarnik 2026.xlsx
    const xlsxPath = path.join(__dirname, '..', 'Šifrarnik 2026.xlsx');
    let vehicles = [];

    if (fs.existsSync(xlsxPath)) {
        console.log(`\n📑 Parsing "Šifrarnik 2026.xlsx"...`);
        const wb = XLSX.readFile(xlsxPath);
        const sheetName = wb.SheetNames[0];
        const rawRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);

        vehicles = rawRows.map((r, idx) => {
            let reg = (r['reg.oznaka'] || r['reg'] || '').toString().trim().toUpperCase();
            let gb = (r['G.Broj'] || r['garazniBroj'] || '-').toString().trim();
            let tip = mapVrsta(r['vrsta']);
            let marka = (r['Naziv sredstva'] || r['markaVoz'] || '-').toString().trim();
            let model = (r['Tip'] || r['modelVoz'] || marka).toString().trim();
            let god = (r['god.pr.'] || r['godProizvodnje'] || '-').toString().trim();
            let vin = (r['br.šasije'] || r['brojSasije'] || '-').toString().trim();

            return {
                rb: r['r.br.'] || (idx + 1),
                reg: reg,
                garazniBroj: gb,
                tipMehan: tip,
                markaVoz: marka,
                modelVoz: model,
                godProizvodnje: god,
                brojSasije: vin,
                status: 'Aktivno'
            };
        }).filter(v => v.reg && v.reg !== '-');

        console.log(`✅ Parsed ${vehicles.length} clean vehicle records from "Šifrarnik 2026.xlsx".`);
        fs.writeFileSync(path.join(__dirname, '..', 'fleet_master.json'), JSON.stringify(vehicles, null, 2), 'utf8');
    }

    if (vehicles.length > 0) {
        console.log(`📦 Re-importing ${vehicles.length} vehicles to 'fleet_master'...`);
        let writes = [];
        let count = 0;

        for (let v of vehicles) {
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

            if (writes.length >= BATCH_SIZE) {
                await commitBatch(writes);
                count += writes.length;
                console.log(`   [fleet_master] Uploaded ${count} / ${vehicles.length} vehicles...`);
                writes = [];
            }
        }

        if (writes.length > 0) {
            await commitBatch(writes);
            count += writes.length;
            console.log(`   [fleet_master] Uploaded ${count} / ${vehicles.length} vehicles.`);
        }
    }

    // Step 3: Import cost records from fleet_data.json with deterministic document IDs
    const dataPath = path.join(__dirname, '..', 'fleet_data.json');
    if (fs.existsSync(dataPath)) {
        const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        const records = rawData.records || [];
        console.log(`\n📦 Re-importing ${records.length} cost records to 'fleet_costs' with deterministic IDs...`);

        let writes = [];
        let count = 0;

        for (let idx = 0; idx < records.length; idx++) {
            let item = records[idx];
            // Deterministic Document ID to guarantee NO duplicates!
            let safeDocId = item.id || `cost_rec_${idx}_${(item.reg || '').replace(/[^a-zA-Z0-9]/g, '_')}`;
            let docPath = `projects/${PROJECT_ID}/databases/(default)/documents/fleet_costs/${safeDocId}`;

            let fields = {};
            for (let k of Object.keys(item)) {
                fields[k] = toFirestoreValue(item[k]);
            }

            writes.push({
                update: {
                    name: docPath,
                    fields: fields
                }
            });

            if (writes.length >= BATCH_SIZE) {
                await commitBatch(writes);
                count += writes.length;
                if (count % 4000 === 0 || count >= records.length) {
                    console.log(`   [fleet_costs] Uploaded ${count} / ${records.length} cost records...`);
                }
                writes = [];
            }
        }

        if (writes.length > 0) {
            await commitBatch(writes);
            count += writes.length;
            console.log(`   [fleet_costs] Uploaded ${count} / ${records.length} cost records.`);
        }
    }

    console.log('\n🎉 SUCCESS: Firestore Cloud database fully cleaned and freshly populated with ZERO duplicates!');
}

runCleanAndReimport().catch(err => {
    console.error('❌ Clean & Import Error:', err);
    process.exit(1);
});
