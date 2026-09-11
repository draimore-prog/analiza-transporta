const https = require('https');

const PROJECT_ID = 'analiza-transporta-flota';

function getDocumentsPage(pageToken) {
  return new Promise((resolve, reject) => {
    let url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/fleet_master?pageSize=300`;
    if (pageToken) url += `&pageToken=${pageToken}`;
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve(data);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function sendCommit(writes) {
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
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body || '{}'));
        } else {
          reject(new Error(`Firestore error ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('--- Traženje svih vozila sa testnim slikama u fleet_master ---');
  let pageToken = null;
  const docsToClean = [];

  do {
    const data = await getDocumentsPage(pageToken);
    const docs = data.documents || [];
    docs.forEach(doc => {
      const f = doc.fields || {};
      const imgUrl = f.imageUrl?.stringValue;
      const images = f.images?.arrayValue?.values || [];
      if (imgUrl || images.length > 0) {
        docsToClean.push({
          name: doc.name,
          id: doc.name.split('/').pop(),
          reg: f.reg?.stringValue || doc.name.split('/').pop()
        });
      }
    });
    pageToken = data.nextPageToken;
  } while (pageToken);

  console.log(`Pronađeno ${docsToClean.length} vozila sa testnim slikama za čišćenje.`);

  if (docsToClean.length === 0) {
    console.log('Nema vozila za čišćenje.');
    return;
  }

  const writes = docsToClean.map(item => ({
    update: {
      name: item.name,
      fields: {
        imageUrl: { stringValue: '' },
        images: { arrayValue: { values: [] } }
      }
    },
    updateMask: {
      fieldPaths: ['imageUrl', 'images']
    }
  }));

  // Slanje u batch-evima do 200
  const BATCH_SIZE = 200;
  for (let i = 0; i < writes.length; i += BATCH_SIZE) {
    const chunk = writes.slice(i, i + BATCH_SIZE);
    console.log(`Šaljem batch ${i + 1} - ${i + chunk.length} od ${writes.length}...`);
    const res = await sendCommit(chunk);
    console.log(`Batch uspješno poslan (${res.writeResults?.length || 0} zapisa ažurirano).`);
  }

  console.log('--- Uspješno očišćene sve testne slike iz fleet_master u Firestore-u! ---');
}

run().catch(console.error);
