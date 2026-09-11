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

async function run() {
  let pageToken = null;
  let total = 0;
  const withImages = [];
  do {
    const data = await getDocumentsPage(pageToken);
    const docs = data.documents || [];
    total += docs.length;
    docs.forEach(doc => {
      const fields = doc.fields || {};
      const imgUrl = fields.imageUrl?.stringValue;
      const images = fields.images?.arrayValue?.values || [];
      if (imgUrl || images.length > 0) {
        withImages.push({
          id: doc.name.split('/').pop(),
          reg: fields.reg?.stringValue,
          garazniBroj: fields.garazniBroj?.stringValue,
          imgUrl,
          imagesCount: images.length
        });
      }
    });
    pageToken = data.nextPageToken;
  } while (pageToken);

  console.log(`Total fleet_master docs: ${total}`);
  console.log(`Found ${withImages.length} vehicles with images in fleet_master:`);
  console.log(JSON.stringify(withImages, null, 2));
}

run().catch(console.error);
