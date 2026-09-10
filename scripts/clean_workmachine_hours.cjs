const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_ID = 'analiza-transporta-flota';
const BATCH_SIZE = 400; // Safe Firestore batch size (limit is 500)
const FLEET_DATA_PATH = path.join(__dirname, '..', 'public', 'fleet_data.json');

function cleanVehicleType(tip) {
  if (!tip) return 'Teretna vozila';
  const t = tip.toString().trim().toLowerCase();
  if (t.includes('priključ') || t.includes('prikljuc') || t.includes('poluprikolica') || t.includes('prikolica')) return 'Priključna vozila';
  if (t.includes('radn')) return 'Radna mašina';
  if (t.includes('skladišn') || t.includes('skladisn') || t.includes('viljuškar') || t.includes('viljuskar') || t.includes('mehanizac')) return 'Skladišna mehanizacija';
  if (t.includes('putničk') || t.includes('putnick') || t.includes('osobn') || t.includes('auto')) return 'Putnička vozila';
  return 'Teretna vozila';
}

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

async function main() {
  console.log("=== UKLANJANJE RADNIH SATI SA RADNIH MAŠINA ===\n");

  if (!fs.existsSync(FLEET_DATA_PATH)) {
    throw new Error("Cannot find fleet_data.json at: " + FLEET_DATA_PATH);
  }

  const raw = JSON.parse(fs.readFileSync(FLEET_DATA_PATH, 'utf8'));
  const records = raw.records;
  console.log(`Ukupno zapisa u fleet_data.json: ${records.length}`);

  const radneMasineIds = [];
  let updatedInJson = 0;

  for (const r of records) {
    const cleanType = cleanVehicleType(r.tipMehan);
    if (cleanType === 'Radna mašina') {
      if (r.radniSati !== null) {
        r.radniSati = null;
        updatedInJson++;
      }
      if (r.id) {
        radneMasineIds.push(r.id);
      }
    }
  }

  console.log(`Pronađeno radnih mašina: ${radneMasineIds.length}`);
  console.log(`Ažurirano radnih sati na null u JSON-u: ${updatedInJson}`);

  // Spasi ažurirani public/fleet_data.json
  fs.writeFileSync(FLEET_DATA_PATH, JSON.stringify(raw, null, 2), 'utf8');
  console.log("✅ public/fleet_data.json uspješno spašen.");

  // Sada ažuriramo Firestore za sve ove zapise
  console.log(`\nPokrećem ažuriranje Firestore 'fleet_costs' za ${radneMasineIds.length} zapisa...`);

  let writes = [];
  let count = 0;
  let batchIndex = 1;
  const totalBatches = Math.ceil(radneMasineIds.length / BATCH_SIZE);

  for (let docId of radneMasineIds) {
    const fullPath = `projects/${PROJECT_ID}/databases/(default)/documents/fleet_costs/${docId}`;

    writes.push({
      updateMask: { fieldPaths: ['radniSati'] },
      update: {
        name: fullPath,
        fields: {
          radniSati: { nullValue: null }
        }
      }
    });

    count++;

    if (writes.length >= BATCH_SIZE || count === radneMasineIds.length) {
      console.log(`[Batch ${batchIndex}/${totalBatches}] Ažuriram ${writes.length} zapisa u Firestore (ukupno: ${count}/${radneMasineIds.length})...`);
      await commitBatch(writes);
      writes = [];
      batchIndex++;
      await new Promise(r => setTimeout(r, 100)); // Respect Firestore rate limits
    }
  }

  console.log(`\n🎉 Uspješno ažurirano svih ${count} zapisa u Cloud Firestore 'fleet_costs' (radniSati = null)!`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
