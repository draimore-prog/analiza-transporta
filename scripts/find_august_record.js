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
                        resolve(JSON.parse(body));
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

async function findAugustRecords() {
    console.log("Tražim zapise za 2026. godinu čiji datum pripada 8. mjesecu (August)...");
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
    const augustRecords = [];
    results.forEach(r => {
        if (!r.document) return;
        const name = r.document.name;
        const docId = name.split('/').pop();
        const f = r.document.fields;
        const datum = f.datum?.stringValue || '';
        const month = f.month?.integerValue || f.month?.stringValue || '';
        if (datum.includes('2026-08-') || datum.includes('2026-07-31T22:00:00') || datum.includes('2026-07-31T23:00:00')) {
            // Check real local date
            const d = new Date(datum);
            // In UTC+1/+2 timezone, check month
            if (d.getUTCMonth() === 7 || (d.getMonth() === 7)) { // 7 is August (0-indexed)
                augustRecords.push({
                    docId,
                    docPath: name,
                    reg: f.reg?.stringValue,
                    cost: f.cost?.doubleValue || f.cost?.integerValue,
                    month,
                    datum,
                    opisPopravke: f.opisPopravke?.stringValue,
                    dobavljacOrig: f.dobavljacOrig?.stringValue
                });
            }
        }
    });

    console.log(`Pronađeno zapisa iz 8. mjeseca: ${augustRecords.length}`);
    console.log(JSON.stringify(augustRecords, null, 2));
}

findAugustRecords().catch(console.error);
