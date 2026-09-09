const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_ID = 'analiza-transporta-flota';
const BATCH_SIZE = 250;

const DATA_FILE = path.join(__dirname, '..', 'fleet_data.json');
const PUBLIC_DATA_FILE = path.join(__dirname, '..', 'public', 'fleet_data.json');

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

async function main() {
    console.log("=== PRIMJENA IZMJENA IZ EXCELA (RUNDA 2) ===\n");

    const actionsFile = 'C:\\Users\\emir.durakovic\\Desktop\\Gemini-Files\\Work\\round2_actions.json';
    const { deleteIds, updateRecords } = JSON.parse(fs.readFileSync(actionsFile, 'utf8'));

    console.log(`Plan:`);
    console.log(`- Brisanje: ${deleteIds.length} naloga podvozara`);
    console.log(`- Ažuriranje: ${Object.keys(updateRecords).length} naloga (prebacivanje bagera u Radnu mašinu i ispravka registracija)\n`);

    // 1. Update local files
    console.log("1. Ažuriranje lokalnih baza fleet_data.json...");
    const fleetData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const delSet = new Set(deleteIds);

    const initialCount = fleetData.records.length;
    fleetData.records = fleetData.records.filter(r => !delSet.has(r.id));
    const postDeleteCount = fleetData.records.length;

    let updatedCount = 0;
    for (let r of fleetData.records) {
        if (updateRecords[r.id]) {
            Object.assign(r, updateRecords[r.id]);
            updatedCount++;
        }
    }

    fleetData.metadata.totalRecords = fleetData.records.length;
    fleetData.metadata.lastCleanedRound2 = new Date().toISOString();
    fleetData.metadata.round2DeletedCount = deleteIds.length;

    fs.writeFileSync(DATA_FILE, JSON.stringify(fleetData, null, 2), 'utf8');
    fs.writeFileSync(PUBLIC_DATA_FILE, JSON.stringify(fleetData, null, 2), 'utf8');

    console.log(`   Lokalna baza svedena sa ${initialCount} na ${postDeleteCount} zapisa (obrisano ${initialCount - postDeleteCount}).`);
    console.log(`   Lokalno ažurirano ${updatedCount} zapisa.`);

    // 2. Commit to Cloud Firestore (Deletions + Updates)
    console.log("\n2. Slanje u Cloud Firestore (fleet_costs)...");
    let writes = [];
    
    // Add deletes
    for (let docId of deleteIds) {
        const fullPath = `projects/${PROJECT_ID}/databases/(default)/documents/fleet_costs/${docId}`;
        writes.push({ delete: fullPath });
    }

    // Add updates
    for (let [sId, u] of Object.entries(updateRecords)) {
        const fullPath = `projects/${PROJECT_ID}/databases/(default)/documents/fleet_costs/${sId}`;
        const updateMaskFields = Object.keys(u);
        const fieldsMap = {};
        for (let [k, v] of Object.entries(u)) {
            fieldsMap[k] = toFirestoreValue(v);
        }
        writes.push({
            updateMask: { fieldPaths: updateMaskFields },
            update: {
                name: fullPath,
                fields: fieldsMap
            }
        });
    }

    console.log(`   Ukupno operacija za Firestore: ${writes.length} (${deleteIds.length} delete, ${Object.keys(updateRecords).length} update)`);
    await commitBatch(writes);
    console.log(`   ✅ Svi Firestore zahtjevi uspješno commitani!`);

    console.log("\n🎉 Uspješno završena runda 2 korekcija!");
}

main().catch(err => {
    console.error("Greška:", err);
    process.exit(1);
});
