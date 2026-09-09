const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_ID = 'analiza-transporta-flota';
const BATCH_SIZE = 400; // Safe Firestore batch size (limit is 500)
const UPDATES_FILE = 'C:\\Users\\emir.durakovic\\Desktop\\Gemini-Files\\Work\\warehouse_hours_updates.json';

function toFirestoreValue(val) {
    if (val === null || val === undefined) {
        return { nullValue: null };
    } else if (typeof val === 'number') {
        if (Number.isInteger(val)) {
            return { integerValue: val.toString() };
        } else {
            return { doubleValue: val };
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
    console.log("=== SINHRONIZACIJA RADNIH SATI SKLADIŠNE MEHANIZACIJE U FIRESTORE (fleet_costs) ===\n");

    if (!fs.existsSync(UPDATES_FILE)) {
        throw new Error("Cannot find updates file: " + UPDATES_FILE);
    }

    const updates = JSON.parse(fs.readFileSync(UPDATES_FILE, 'utf8'));
    const docIds = Object.keys(updates);
    console.log(`Učitano ${docIds.length} zapisa skladišne mehanizacije za ažuriranje radnih sati.`);

    let writes = [];
    let count = 0;
    let batchIndex = 1;
    const totalBatches = Math.ceil(docIds.length / BATCH_SIZE);

    for (let docId of docIds) {
        const fullPath = `projects/${PROJECT_ID}/databases/(default)/documents/fleet_costs/${docId}`;
        const hoursVal = updates[docId];

        writes.push({
            updateMask: { fieldPaths: ['radniSati'] },
            update: {
                name: fullPath,
                fields: {
                    radniSati: toFirestoreValue(hoursVal)
                }
            }
        });

        count++;

        if (writes.length >= BATCH_SIZE || count === docIds.length) {
            console.log(`[Batch ${batchIndex}/${totalBatches}] Ažuriram ${writes.length} zapisa (ukupno: ${count}/${docIds.length})...`);
            await commitBatch(writes);
            writes = [];
            batchIndex++;
            await new Promise(r => setTimeout(r, 100)); // Respect Firestore rate limits
        }
    }

    console.log(`\n🎉 Uspješno ažurirano svih ${count} zapisa radnih sati u Cloud Firestore 'fleet_costs'!`);
}

main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
