const https = require('https');
const PROJECT_ID = 'analiza-transporta-flota';
const BATCH_SIZE = 400;

function ocistiSegment(segment, dobavljac) {
    if (dobavljac && dobavljac.toString().toLowerCase().includes('pgl')) return 'Guma';
    if (!segment) return 'Ostalo';
    
    let s = segment.toString().replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ").trim();
    if (s === '/' || s === '' || s === '-' || s.toLowerCase() === 'nepoznato') return 'Ostalo';

    let sLower = s.toLowerCase();

    // 1. Gume -> Uvijek 'Guma' (Jednina)
    if (sLower.includes('gum') || sLower.includes('pneumat')) return 'Guma';

    // 2. Hidraulika -> Uvijek 'Hidraulika' (Sa velikim H)
    if (sLower.includes('hidraul')) return 'Hidraulika';

    // 3. Ostale poznate kategorije
    if (sLower.includes('motor') || sLower.includes('agregat')) return 'Motor';
    if (sLower.includes('kočnic') || sLower.includes('kocnic') || sLower.includes('disk')) return 'Kočnice';
    if (sLower.includes('mjenjač') || sLower.includes('mjenjac') || sLower.includes('kvačil') || sLower.includes('kvacil')) return 'Mjenjač';
    if (sLower.includes('elektr') || sLower.includes('akumulat')) return 'Autoelektrika';
    if (sLower.includes('limarij') || sLower.includes('staklo') || sLower.includes('šajb') || sLower.includes('sajb')) return 'Limarija i stakla';
    if (sLower.includes('redovn') || sLower.includes('ulje') || sLower.includes('filter')) return 'Redovan servis';

    return sLower.charAt(0).toUpperCase() + sLower.slice(1);
}

function fetchPage(token) {
    let path = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/fleet_costs?pageSize=1000`;
    if (token) path += '&pageToken=' + encodeURIComponent(token);
    return new Promise((resolve, reject) => {
        https.get({hostname: 'firestore.googleapis.com', path}, res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                if (res.statusCode === 200) resolve(JSON.parse(body));
                else reject(new Error(body));
            });
        }).on('error', reject);
    });
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

async function run() {
    console.log("Fetching all cost records from Firestore...");
    let allDocs = [];
    let token = null;
    do {
        let data = await fetchPage(token);
        if (data.documents) allDocs.push(...data.documents);
        token = data.nextPageToken;
    } while(token);

    console.log(`Total cost records found: ${allDocs.length}`);
    let writes = [];
    let updateCount = 0;

    for (let doc of allDocs) {
        let segment = doc.fields.segment ? doc.fields.segment.stringValue : '';
        let dobavljac = doc.fields.dobavljacOrig ? doc.fields.dobavljacOrig.stringValue : 
                       (doc.fields.dobavljac ? doc.fields.dobavljac.stringValue : '');
        
        let cleanedSegment = ocistiSegment(segment, dobavljac);

        if (cleanedSegment !== segment) {
            updateCount++;
            
            // Build the field update
            writes.push({
                update: {
                    name: doc.name,
                    fields: {
                        ...doc.fields, // keep other fields exactly as they are
                        segment: { stringValue: cleanedSegment }
                    }
                }
            });

            if (writes.length >= BATCH_SIZE) {
                console.log(`Committing batch of ${writes.length} updates...`);
                await commitBatch(writes);
                writes = [];
            }
        }
    }

    if (writes.length > 0) {
        console.log(`Committing final batch of ${writes.length} updates...`);
        await commitBatch(writes);
    }

    console.log(`Cleanup complete! Updated ${updateCount} cost records to normalize segments.`);
}

run().catch(console.error);
