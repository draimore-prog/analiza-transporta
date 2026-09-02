import https from 'https';

const PROJECT_ID = 'analiza-transporta-flota';

function getSampleCost() {
    const options = {
        hostname: 'firestore.googleapis.com',
        path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/fleet_costs?pageSize=3`,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    };
    const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            const data = JSON.parse(body);
            console.log("Sample documents from fleet_costs:");
            if (data.documents) {
                data.documents.forEach(doc => {
                    console.log("Doc ID:", doc.name.split('/').pop());
                    console.log("Fields:", JSON.stringify(doc.fields, null, 2));
                });
            } else {
                console.log(data);
            }
        });
    });
    req.on('error', console.error);
    req.end();
}

getSampleCost();
