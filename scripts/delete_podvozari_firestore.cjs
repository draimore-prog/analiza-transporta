const fs = require('fs');
const https = require('https');
const path = require('path');

const PROJECT_ID = 'analiza-transporta-flota';
const BATCH_SIZE = 100;

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
    const idsFile = 'C:\\Users\\emir.durakovic\\Desktop\\Gemini-Files\\Reports\\podvozari_ids_to_delete.json';
    if (!fs.existsSync(idsFile)) {
        throw new Error("Cannot find IDs file: " + idsFile);
    }
    const ids = JSON.parse(fs.readFileSync(idsFile, 'utf8'));
    console.log(`Loaded ${ids.length} document IDs to delete from Firestore collection 'fleet_costs'...`);

    let writes = [];
    let deletedCount = 0;

    for (let docId of ids) {
        let fullPath = `projects/${PROJECT_ID}/databases/(default)/documents/fleet_costs/${docId}`;
        writes.push({ delete: fullPath });

        if (writes.length >= BATCH_SIZE) {
            await commitBatch(writes);
            deletedCount += writes.length;
            console.log(`   Deleted ${deletedCount} / ${ids.length} docs from Firestore...`);
            writes = [];
        }
    }

    if (writes.length > 0) {
        await commitBatch(writes);
        deletedCount += writes.length;
        console.log(`   Deleted ${deletedCount} / ${ids.length} docs from Firestore.`);
    }

    console.log(`\n🎉 Successfully deleted all ${deletedCount} podvozari documents from Firestore 'fleet_costs'!`);
}

run().catch(err => {
    console.error("Error during Firestore deletion:", err);
    process.exit(1);
});
