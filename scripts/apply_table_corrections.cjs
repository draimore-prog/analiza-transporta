const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_ID = 'analiza-transporta-flota';
const BATCH_SIZE = 250; // Safe Firestore batch limit

const isDryRun = process.argv.includes('--dry-run');

const EXCEL_PATH = "C:\\Users\\emir.durakovic\\Desktop\\Provjera_Servisa_Bez_MT_I_Tipova_Mehanizacije (version 1).xlsb.xlsx";
const DATA_FILE = path.join(__dirname, '..', 'fleet_data.json');
const PUBLIC_DATA_FILE = path.join(__dirname, '..', 'public', 'fleet_data.json');
const MASTER_FILE = path.join(__dirname, '..', 'fleet_master.json');
const PUBLIC_MASTER_FILE = path.join(__dirname, '..', 'public', 'fleet_master.json');

// Helper to convert JS values to Firestore Value objects
function toFirestoreValue(val) {
    if (val === null || val === undefined) {
        return { nullValue: null };
    } else if (typeof val === 'boolean') {
        return { booleanValue: val };
    } else if (typeof val === 'number') {
        if (Number.isInteger(val)) {
            return { integerValue: val.toString() };
        } else {
            return { doubleValue: val };
        }
    } else if (val instanceof Date) {
        return { timestampValue: val.toISOString() };
    } else if (typeof val === 'object') {
        if (Array.isArray(val)) {
            return { arrayValue: { values: val.map(toFirestoreValue) } };
        } else {
            let fieldsMap = {};
            for (let k of Object.keys(val)) {
                fieldsMap[k] = toFirestoreValue(val[k]);
            }
            return { mapValue: { fields: fieldsMap } };
        }
    } else {
        return { stringValue: String(val) };
    }
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
    console.log(`=== POKRETANJE PRIMJENE KOREKCIJA (Dry run: ${isDryRun}) ===\n`);

    // Load prepared updates from Python simulation
    const updatesJsonPath = 'C:\\Users\\emir.durakovic\\Desktop\\Gemini-Files\\Work\\prepared_corrections.json';
    if (!fs.existsSync(updatesJsonPath)) {
        throw new Error("Updates file does not exist: " + updatesJsonPath);
    }

    const prepared = JSON.parse(fs.readFileSync(updatesJsonPath, 'utf8'));
    const { masterUpdates, serviceUpdates } = prepared;

    console.log(`Učitano:`);
    console.log(`- Master flota ažuriranja: ${Object.keys(masterUpdates).length} vozila`);
    console.log(`- Servisi ažuriranja: ${Object.keys(serviceUpdates).length} zapisa`);

    // 1. Update local fleet_master.json
    console.log(`\n1. Ažuriranje lokalnih master baza...`);
    const masterData = JSON.parse(fs.readFileSync(MASTER_FILE, 'utf8'));
    let masterUpdatedCount = 0;
    for (let m of masterData) {
        let reg = String(m.reg || '').trim().toUpperCase();
        if (masterUpdates[reg]) {
            let u = masterUpdates[reg];
            m.tipMehan = u.target_tip;
            if (u.gb && u.gb !== '/') {
                m.garazniBroj = u.gb;
            }
            masterUpdatedCount++;
        } else if (m.tipMehan) {
            // standard trim
            if (m.tipMehan === 'Teretno vozilo') m.tipMehan = 'Teretna vozila';
            if (m.tipMehan === 'Priključno vozilo') m.tipMehan = 'Priključna vozila';
            if (m.tipMehan === 'radna mašina') m.tipMehan = 'Radna mašina';
        }
    }
    console.log(`   Lokalno u fleet_master.json ažurirano ${masterUpdatedCount} vozila.`);

    // 2. Update local fleet_data.json
    console.log(`\n2. Ažuriranje lokalnih fleet_data baza...`);
    const fleetCostData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    let serviceUpdatedCount = 0;
    for (let r of fleetCostData.records) {
        if (serviceUpdates[r.id]) {
            Object.assign(r, serviceUpdates[r.id]);
            serviceUpdatedCount++;
        }
    }
    console.log(`   Lokalno u fleet_data.json ažurirano ${serviceUpdatedCount} servisa.`);

    if (!isDryRun) {
        fs.writeFileSync(MASTER_FILE, JSON.stringify(masterData, null, 2), 'utf8');
        fs.writeFileSync(PUBLIC_MASTER_FILE, JSON.stringify(masterData, null, 2), 'utf8');
        fs.writeFileSync(DATA_FILE, JSON.stringify(fleetCostData, null, 2), 'utf8');
        fs.writeFileSync(PUBLIC_DATA_FILE, JSON.stringify(fleetCostData, null, 2), 'utf8');
        console.log(`   ✅ Spremljene lokalne datoteke u root i public/`);

        // 3. Batch update Firestore fleet_costs
        console.log(`\n3. Slanje ažuriranja u Cloud Firestore (fleet_costs)...`);
        const serviceIds = Object.keys(serviceUpdates);
        let writes = [];
        let committedServices = 0;

        for (let sId of serviceIds) {
            const u = serviceUpdates[sId];
            const fullPath = `projects/${PROJECT_ID}/databases/(default)/documents/fleet_costs/${sId}`;
            
            // Build updateMask field paths and fields map
            const updateMaskFields = [];
            const fieldsMap = {};

            for (let [fKey, fVal] of Object.entries(u)) {
                updateMaskFields.push(fKey);
                fieldsMap[fKey] = toFirestoreValue(fVal);
            }

            writes.push({
                updateMask: { fieldPaths: updateMaskFields },
                update: {
                    name: fullPath,
                    fields: fieldsMap
                }
            });

            if (writes.length >= BATCH_SIZE) {
                await commitBatch(writes);
                committedServices += writes.length;
                console.log(`   Firestore commit: ${committedServices} / ${serviceIds.length} servisa...`);
                writes = [];
            }
        }

        if (writes.length > 0) {
            await commitBatch(writes);
            committedServices += writes.length;
            console.log(`   Firestore commit: ${committedServices} / ${serviceIds.length} servisa završeno.`);
        }

        // 4. Batch update Firestore fleet_master
        console.log(`\n4. Slanje ažuriranja u Cloud Firestore (fleet_master)...`);
        const masterRegs = Object.keys(masterUpdates);
        let masterWrites = [];
        let committedMaster = 0;

        for (let reg of masterRegs) {
            const u = masterUpdates[reg];
            const fullPath = `projects/${PROJECT_ID}/databases/(default)/documents/fleet_master/${encodeURIComponent(reg)}`;
            
            const updateMaskFields = ['tipMehan'];
            const fieldsMap = {
                tipMehan: toFirestoreValue(u.target_tip)
            };

            if (u.gb && u.gb !== '/') {
                updateMaskFields.push('garazniBroj');
                fieldsMap['garazniBroj'] = toFirestoreValue(u.gb);
            }

            masterWrites.push({
                updateMask: { fieldPaths: updateMaskFields },
                update: {
                    name: fullPath,
                    fields: fieldsMap
                }
            });

            if (masterWrites.length >= BATCH_SIZE) {
                await commitBatch(masterWrites);
                committedMaster += masterWrites.length;
                console.log(`   Firestore commit master: ${committedMaster} / ${masterRegs.length} vozila...`);
                masterWrites = [];
            }
        }

        if (masterWrites.length > 0) {
            await commitBatch(masterWrites);
            committedMaster += masterWrites.length;
            console.log(`   Firestore commit master: ${committedMaster} / ${masterRegs.length} vozila završeno.`);
        }

        console.log(`\n🎉 Sve korekcije uspješno primijenjene u Firestore i lokalnim bazama!`);
    } else {
        console.log(`\n[DRY RUN]: Provjera prošla uspješno. Nema upisa u bazu dok se ne pokrene bez --dry-run.`);
    }
}

main().catch(err => {
    console.error("Greška tokom izvršavanja:", err);
    process.exit(1);
});
