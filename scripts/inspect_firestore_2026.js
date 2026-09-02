import https from 'https';

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
                        const parsed = JSON.parse(body);
                        resolve(parsed);
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

async function check2026Firestore() {
    console.log("Fetching all 2026 documents from Firestore fleet_costs...");
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
    console.log(`Received ${results.length} query results for year 2026.`);
    
    const monthCounts = {};
    const monthSums = {};
    let validDocs = 0;

    for (const r of results) {
        if (!r.document) continue;
        validDocs++;
        const f = r.document.fields;
        const m = f.month ? (f.month.integerValue || f.month.stringValue) : 'unknown';
        const cost = f.cost ? (parseFloat(f.cost.doubleValue || f.cost.integerValue) || 0) : 0;
        
        monthCounts[m] = (monthCounts[m] || 0) + 1;
        monthSums[m] = (monthSums[m] || 0) + cost;
    }

    console.log(`\nValid 2026 documents in Firestore: ${validDocs}`);
    for (let m = 1; m <= 12; m++) {
        if (monthCounts[m] !== undefined) {
            console.log(`Firestore 2026 Month ${m}: ${monthCounts[m]} rows | Total Cost: ${monthSums[m].toFixed(2)} KM`);
        }
    }
}

check2026Firestore().catch(console.error);
