const https = require('https');
const PROJECT_ID = 'analiza-transporta-flota';

function fetchPage(token) {
    let path = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/fleet_master?pageSize=1000`;
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

function deleteDocument(docPath) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'firestore.googleapis.com',
            path: '/v1/' + docPath,
            method: 'DELETE'
        }, res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                if (res.statusCode === 200) resolve(true);
                else reject(new Error(`Failed to delete ${docPath}: ${body}`));
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function run() {
    console.log("Fetching all documents...");
    let allDocs = [];
    let token = null;
    do {
        let data = await fetchPage(token);
        if (data.documents) allDocs.push(...data.documents);
        token = data.nextPageToken;
    } while(token);

    console.log(`Total documents found: ${allDocs.length}`);

    let map = {};
    allDocs.forEach(d => {
        let r = d.fields.reg ? d.fields.reg.stringValue : 'N/A';
        if (!map[r]) map[r] = [];
        map[r].push(d);
    });

    let duplicates = Object.values(map).filter(arr => arr.length > 1);
    console.log(`Found ${duplicates.length} vehicles with duplicate entries.`);

    let deletedCount = 0;
    for (let arr of duplicates) {
        // Sort by createTime DESC (newest first)
        arr.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
        
        // Keep the newest (index 0), delete the rest
        for (let i = 1; i < arr.length; i++) {
            let docToDelete = arr[i];
            console.log(`Deleting duplicate for reg ${arr[0].fields.reg.stringValue}: ${docToDelete.name.split('/').pop()} (created: ${docToDelete.createTime})`);
            await deleteDocument(docToDelete.name);
            deletedCount++;
        }
    }

    console.log(`Cleanup complete! Deleted ${deletedCount} duplicate documents.`);
}

run().catch(console.error);
