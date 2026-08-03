const fs = require('fs');
const https = require('https');
const path = require('path');

const PROJECT_ID = 'analiza-transporta-flota';
const BATCH_SIZE = 400; // Safe batch limit (Firestore max 500)

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
    console.log('🚀 Starting import of Excel / JSON dataset into Firestore database...');

    // 1. Import fleet_master (Vehicles)
    const masterPath = path.join(__dirname, '..', 'fleet_master.json');
    if (fs.existsSync(masterPath)) {
        const vehicles = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
        console.log(`📦 Found ${vehicles.length} vehicles in fleet_master.json. Uploading to 'fleet_master'...`);

        let writes = [];
        let count = 0;

        for (let v of vehicles) {
            if (!v.reg) continue;
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

    // 2. Import fleet_data (Maintenance Costs)
    const dataPath = path.join(__dirname, '..', 'fleet_data.json');
    if (fs.existsSync(dataPath)) {
        const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        const records = rawData.records || [];
        console.log(`📦 Found ${records.length} cost records in fleet_data.json. Uploading to 'fleet_costs'...`);

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
                if (count % 2000 === 0 || count >= records.length) {
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

    console.log('✅ COMPLETE: All Excel / JSON data has been imported into Firestore collections!');
}

runImport().catch(err => {
    console.error('❌ Import error:', err);
    process.exit(1);
});
