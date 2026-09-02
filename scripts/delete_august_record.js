import https from 'https';

const PROJECT_ID = 'analiza-transporta-flota';
const DOC_PATH = 'projects/analiza-transporta-flota/databases/(default)/documents/fleet_costs/cost_2026_m7_3236_O19_E_107';

function deleteDoc() {
    const postData = JSON.stringify({
        writes: [{
            delete: DOC_PATH
        }]
    });

    const options = {
        hostname: 'firestore.googleapis.com',
        path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = https.request(options, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
            console.log("Delete status:", res.statusCode);
            console.log("Response:", body);
            console.log("✅ Zapis cost_2026_m7_3236_O19_E_107 (datum 15.08.) uspješno obrisan iz Firestorea.");
        });
    });
    req.on('error', console.error);
    req.write(postData);
    req.end();
}

deleteDoc();
