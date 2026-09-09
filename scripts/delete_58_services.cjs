const fs = require('fs');
const https = require('https');
const path = require('path');

const PROJECT_ID = 'analiza-transporta-flota';
const BATCH_SIZE = 100;
const IDS_FILE = 'C:\\Users\\emir.durakovic\\Desktop\\Gemini-Files\\Work\\ids_58_to_delete.json';

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

async function run() {
    console.log("=== BRISANJE 58 SPORNIH SERVISA SKLADIŠNE MEHANIZACIJE ===");

    if (!fs.existsSync(IDS_FILE)) {
        throw new Error("Cannot find IDs file: " + IDS_FILE);
    }
    const idsToDelete = JSON.parse(fs.readFileSync(IDS_FILE, 'utf8'));
    console.log(`Učitano ${idsToDelete.length} ID-jeva za brisanje iz Firestore baze...`);

    // 1. Delete from Firestore 'fleet_costs'
    let writes = [];
    let deletedCount = 0;

    for (let docId of idsToDelete) {
        let fullPath = `projects/${PROJECT_ID}/databases/(default)/documents/fleet_costs/${docId}`;
        writes.push({ delete: fullPath });
        // Also add cost_records in case any exists there
        writes.push({ delete: `projects/${PROJECT_ID}/databases/(default)/documents/cost_records/${docId}` });

        if (writes.length >= BATCH_SIZE) {
            await commitBatch(writes);
            deletedCount += (writes.length / 2);
            console.log(`   Obrisano ${deletedCount} / ${idsToDelete.length} dokumenata iz Firestorea...`);
            writes = [];
        }
    }

    if (writes.length > 0) {
        await commitBatch(writes);
        deletedCount += (writes.length / 2);
        console.log(`   Obrisano ${deletedCount} / ${idsToDelete.length} dokumenata iz Firestorea.`);
    }

    console.log("✅ Firestore kolekcija 'fleet_costs' uspješno ažurirana.");

    // 2. Filter out from local fleet_data.json and public/fleet_data.json
    const idSet = new Set(idsToDelete);
    
    const localPaths = [
        path.resolve('fleet_data.json'),
        path.resolve('public/fleet_data.json')
    ];

    for (let p of localPaths) {
        if (fs.existsSync(p)) {
            const data = JSON.parse(fs.readFileSync(p, 'utf8'));
            const beforeCount = data.records.length;
            data.records = data.records.filter(r => !idSet.has(r.id));
            const afterCount = data.records.length;
            
            if (data.metadata) {
                data.metadata.totalRecords = afterCount;
                data.metadata.lastUpdated = new Date().toISOString();
            }

            fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
            console.log(`✅ Ažurirano ${p}: Prije: ${beforeCount} -> Poslije: ${afterCount} (Obrisano tačno ${beforeCount - afterCount})`);
        }
    }

    console.log("\n🎉 Uspješno završeno brisanje svih 58 spornih servisa!");
}

run().catch(console.error);
