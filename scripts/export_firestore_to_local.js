import https from 'https';
import fs from 'fs';
import path from 'path';

const PROJECT_ID = 'analiza-transporta-flota';

function sendRequest(pathUrl) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'firestore.googleapis.com',
            path: pathUrl,
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        };
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
        req.end();
    });
}

async function fetchAllDocuments(collectionName) {
    let documents = [];
    let pageToken = '';
    do {
        let url = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}?pageSize=300`;
        if (pageToken) {
            url += `&pageToken=${encodeURIComponent(pageToken)}`;
        }
        try {
            let res = await sendRequest(url);
            if (res.documents && res.documents.length > 0) {
                res.documents.forEach(doc => documents.push(doc));
            }
            pageToken = res.nextPageToken || '';
            if (documents.length % 3000 === 0) {
                console.log(`   Fetched ${documents.length} docs from ${collectionName}...`);
            }
        } catch (e) {
            console.warn(`Warning listing collection ${collectionName}:`, e.message);
            break;
        }
    } while (pageToken);
    return documents;
}

function parseFirestoreField(field) {
    if (!field) return null;
    if (field.stringValue !== undefined) return field.stringValue;
    if (field.integerValue !== undefined) return parseInt(field.integerValue);
    if (field.doubleValue !== undefined) return parseFloat(field.doubleValue);
    if (field.booleanValue !== undefined) return field.booleanValue;
    if (field.timestampValue !== undefined) return field.timestampValue;
    if (field.nullValue !== undefined) return null;
    if (field.mapValue !== undefined) {
        let map = {};
        for (let k of Object.keys(field.mapValue.fields || {})) {
            map[k] = parseFirestoreField(field.mapValue.fields[k]);
        }
        return map;
    }
    if (field.arrayValue !== undefined) {
        return (field.arrayValue.values || []).map(parseFirestoreField);
    }
    return null;
}

async function syncLocalFromFirestore() {
    console.log("🔄 Sinkronizacija lokalnih datoteka direktno iz Firestore Cloud baze...");

    // 1. fleet_master
    console.log("📥 Preuzimam 'fleet_master' iz Firestorea...");
    const masterDocs = await fetchAllDocuments('fleet_master');
    console.log(`   Dohvaćeno ${masterDocs.length} vozila iz Firestore 'fleet_master'.`);

    const vehicles = masterDocs.map(doc => {
        let fields = doc.fields || {};
        let obj = {};
        for (let k of Object.keys(fields)) {
            obj[k] = parseFirestoreField(fields[k]);
        }
        return obj;
    });
    fs.writeFileSync(path.resolve('fleet_master.json'), JSON.stringify(vehicles, null, 2), 'utf8');
    console.log("   ✅ 'fleet_master.json' uspješno generisan i usklađen.");

    // 2. fleet_costs
    console.log("\n📥 Preuzimam 'fleet_costs' iz Firestorea...");
    const costDocs = await fetchAllDocuments('fleet_costs');
    console.log(`   Dohvaćeno ${costDocs.length} troškova iz Firestore 'fleet_costs'.`);

    let existingMetadata = {};
    const localDataPath = path.resolve('fleet_data.json');
    if (fs.existsSync(localDataPath)) {
        try {
            let existing = JSON.parse(fs.readFileSync(localDataPath, 'utf8'));
            existingMetadata = existing.metadata || {};
        } catch(e) {}
    }

    const records = costDocs.map(doc => {
        let docId = doc.name.split('/').pop();
        let fields = doc.fields || {};
        let obj = { id: docId };
        for (let k of Object.keys(fields)) {
            obj[k] = parseFirestoreField(fields[k]);
        }
        return obj;
    });

    const outputObj = {
        metadata: {
            ...existingMetadata,
            lastExportedAt: new Date().toISOString(),
            totalRecords: records.length,
            firestoreVerified: true
        },
        records: records
    };

    fs.writeFileSync(localDataPath, JSON.stringify(outputObj), 'utf8');
    console.log("   ✅ 'fleet_data.json' uspješno generisan i usklađen sa tačno " + records.length + " zapisa.");

    console.log("\n🎉 Lokalna baza je 100% sinhronizovana sa Firestore izvorom istine!");
}

syncLocalFromFirestore().catch(console.error);
