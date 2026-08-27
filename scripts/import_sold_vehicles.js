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
    console.log('🚀 Starting import of "Evidencija prodatih vozila.xlsx" into Firestore database...');

    const xlsxPath = path.join(__dirname, '..', 'Evidencija prodatih vozila.xlsx');
    let vehicles = [];

    if (!fs.existsSync(xlsxPath)) {
        console.error(`❌ File not found: ${xlsxPath}`);
        process.exit(1);
    }

    console.log(`📑 Reading "Evidencija prodatih vozila.xlsx"...`);
    const wb = XLSX.readFile(xlsxPath);
    const sheetName = wb.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);

    vehicles = rawRows.map((r, idx) => {
        let rawReg = r['Registarska oznaka'] || r['reg.oznaka'] || r['reg'] || '';
        let reg = rawReg.toString().trim().toUpperCase();
        let gb = (r['G.Broj'] || r['garazniBroj'] || '-').toString().trim();
        let rawTip = (r['Tip'] || '').toString().trim();
        let tip = mapVrsta(rawTip);
        let marka = (r['Proizvođač'] || r['Naziv sredstva'] || r['markaVoz'] || '-').toString().trim();
        let model = (r['Tip_1'] || r['Tip'] || r['modelVoz'] || marka).toString().trim();
        let god = (r['Godište'] || r['god.pr.'] || r['godProizvodnje'] || '-').toString().trim();
        let vin = (r['Broj šasije'] || r['br.šasije'] || r['brojSasije'] || '-').toString().trim();
        
        let status = 'Prodato';
        if (tip === 'Skladišna mehanizacija') {
            status = 'Rashodovano';
        }

        return {
            rb: r['R.br.'] || (idx + 1),
            reg: reg,
            garazniBroj: gb,
            tipMehan: tip,
            markaVoz: marka,
            modelVoz: model,
            godProizvodnje: god,
            brojSasije: vin,
            status: status
        };
    }).filter(v => v.reg && v.reg !== '-');

    console.log(`✅ Successfully parsed ${vehicles.length} vehicle records.`);

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

    console.log('✅ COMPLETE: "Evidencija prodatih vozila.xlsx" records have been imported to Cloud Firestore!');
}

runImport().catch(err => {
    console.error('❌ Import error:', err);
    process.exit(1);
});
