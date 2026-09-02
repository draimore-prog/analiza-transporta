import https from 'https';
import XLSX from 'xlsx';
import path from 'path';

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
                    resolve(JSON.parse(body));
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

async function checkFleetMaster() {
    console.log("Checking fleet_master for all vehicles in the 497 new records...");
    const query = {
        structuredQuery: {
            from: [{ collectionId: 'fleet_master' }]
        }
    };
    const results = await runStructuredQuery(query);
    const existingVehicles = new Set();
    for (const r of results) {
        if (r.document && r.document.fields) {
            const reg = (r.document.fields.reg?.stringValue || '').trim().toUpperCase();
            if (reg) existingVehicles.add(reg);
        }
    }
    console.log(`Existing vehicles in fleet_master: ${existingVehicles.size}`);

    // Read excel 2026
    const filePath = path.resolve('Za portal.xlsx');
    const wb = XLSX.readFile(filePath);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets['FINALDATA 2026']);

    const missingInFleetMaster = new Map();

    rows.forEach(r => {
        const m = parseInt(r['Month']);
        if (m > 7) return; // skip 8+
        const reg = (r['Reg.oznaka'] || r['RegBroj'] || '').toString().trim().toUpperCase();
        if (!reg || reg === '-' || reg === 'NEPOZNATO') return;

        if (!existingVehicles.has(reg)) {
            if (!missingInFleetMaster.has(reg)) {
                missingInFleetMaster.set(reg, {
                    reg,
                    garazniBroj: (r['MT'] || '-').toString(),
                    tipMehan: r['TipMehan'] || 'Teretno',
                    markaVoz: r['MarkaVoz'] || 'Nepoznato',
                    godProizvodnje: (r['God.'] || '-').toString(),
                    count: 1
                });
            } else {
                missingInFleetMaster.get(reg).count++;
            }
        }
    });

    console.log(`Vehicles in 2026 data not in fleet_master: ${missingInFleetMaster.size}`);
    for (const [reg, data] of missingInFleetMaster.entries()) {
        console.log(`  - ${reg} (${data.tipMehan} / ${data.markaVoz}, GB: ${data.garazniBroj}) - appears in ${data.count} rows`);
    }
}

checkFleetMaster().catch(console.error);
