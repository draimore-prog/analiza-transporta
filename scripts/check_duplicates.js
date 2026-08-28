const https = require('https');
const PROJECT_ID = 'analiza-transporta-flota';

function fetchAllVehicles() {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'firestore.googleapis.com',
            path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/fleet_master?pageSize=1000`,
            method: 'GET'
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(body));
                } else {
                    reject(new Error(`Error ${res.statusCode}: ${body}`));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

fetchAllVehicles().then(data => {
    if (!data.documents) {
        console.log("No documents found");
        return;
    }
    console.log(`Total documents: ${data.documents.length}`);
    const regMap = {};
    const exactDuplicates = [];
    
    data.documents.forEach(doc => {
        let reg = 'UNKNOWN';
        if (doc.fields && doc.fields.reg && doc.fields.reg.stringValue) {
            reg = doc.fields.reg.stringValue.trim().toUpperCase();
        }
        
        let status = 'UNKNOWN';
        if (doc.fields && doc.fields.status && doc.fields.status.stringValue) {
            status = doc.fields.status.stringValue;
        }

        if (!regMap[reg]) {
            regMap[reg] = [];
        }
        regMap[reg].push({ id: doc.name.split('/').pop(), status: status });
    });

    let countDuplicates = 0;
    for (let reg in regMap) {
        if (regMap[reg].length > 1) {
            countDuplicates++;
            console.log(`Duplicate found for REG: ${reg}`);
            console.log(regMap[reg]);
        }
    }
    console.log(`Found ${countDuplicates} distinct registration numbers with duplicates.`);
}).catch(console.error);
