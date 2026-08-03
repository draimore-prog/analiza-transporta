const fs = require('fs');
const https = require('https');
const path = require('path');
const XLSX = require('xlsx');

const PROJECT_ID = 'analiza-transporta-flota';
const BATCH_SIZE = 400; // Safe batch limit (Firestore max 500)

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

function commitBatch(writes) {
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
                if (res.statusCode === 200) {
                    resolve(JSON.parse(body));
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

async function runImport() {
    console.log('🚀 Starting import of "Šifrarnik 2026.xlsx" and dataset into Firestore database...');

    // 1. Direct parse of Šifrarnik 2026.xlsx (Vehicles Master)
    const xlsxPath = path.join(__dirname, '..', 'Šifrarnik 2026.xlsx');
    let vehicles = [];

    if (fs.existsSync(xlsxPath)) {
        console.log(`📑 Reading "Šifrarnik 2026.xlsx"...`);
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

        console.log(`✅ Successfully parsed ${vehicles.length} vehicle records from "Šifrarnik 2026.xlsx".`);

        // Update local fleet_master.json
        fs.writeFileSync(path.join(__dirname, '..', 'fleet_master.json'), JSON.stringify(vehicles, null, 2), 'utf8');
    } else {
        const masterPath = path.join(__dirname, '..', 'fleet_master.json');
        if (fs.existsSync(masterPath)) {
            vehicles = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
        }
    }

    if (vehicles.length > 0) {
        console.log(`📦 Uploading ${vehicles.length} vehicle records to Firestore collection 'fleet_master'...`);
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
            console.log(`   [fleet_master] Uploaded ${count} / ${vehicles.length} vehicles to Firestore.`);
        }
    }

    // 2. Import fleet_data (Maintenance Costs)
    const dataPath = path.join(__dirname, '..', 'fleet_data.json');
    if (fs.existsSync(dataPath)) {
        const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        const records = rawData.records || [];
        console.log(`📦 Uploading ${records.length} cost records to Firestore collection 'fleet_costs'...`);

        let writes = [];
        let count = 0;

        for (let idx = 0; idx < records.length; idx++) {
            let item = records[idx];
            let safeDocId = item.id || `rec_${idx}_${(item.reg || '').replace(/[^a-zA-Z0-9]/g, '_')}`;
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

    console.log('✅ COMPLETE: "Šifrarnik 2026.xlsx" and all dataset records have been imported to Cloud Firestore!');
}

runImport().catch(err => {
    console.error('❌ Import error:', err);
    process.exit(1);
});
