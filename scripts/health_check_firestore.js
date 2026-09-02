import https from 'https';

const PROJECT_ID = 'analiza-transporta-flota';

function sendRequest(pathUrl, method = 'GET') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'firestore.googleapis.com',
            path: pathUrl,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
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
        req.end();
    });
}

async function fetchAllDocuments(collectionName) {
    let documents = [];
    let pageToken = '';
    do {
        let url = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}?pageSize=300`;
        if (pageToken) {
            url += `&pageToken=${encodeURIComponent(pageToken)}`;
        }
        try {
            let res = await sendRequest(url, 'GET');
            if (res.documents && res.documents.length > 0) {
                res.documents.forEach(doc => documents.push(doc));
            }
            pageToken = res.nextPageToken || '';
        } catch (e) {
            console.warn(`Warning listing collection ${collectionName}:`, e.message);
            break;
        }
    } while (pageToken);
    return documents;
}

function getValue(field) {
    if (!field) return undefined;
    if (field.stringValue !== undefined) return field.stringValue;
    if (field.integerValue !== undefined) return parseInt(field.integerValue, 10);
    if (field.doubleValue !== undefined) return parseFloat(field.doubleValue);
    return undefined;
}

async function runHealthCheck() {
    console.log('Započinjem provjeru zdravlja baze podataka (Health Check)...');
    
    try {
        console.log('\n--- Provjera kolekcije fleet_master ---');
        const vozilaDocs = await fetchAllDocuments('fleet_master');
        console.log(`Ukupan broj registriranih vozila u bazi: ${vozilaDocs.length}`);
        
        let vozilaBezRegistracije = 0;
        vozilaDocs.forEach(doc => {
            const data = doc.fields || {};
            const reg = getValue(data['reg']);
            if (!reg) {
                vozilaBezRegistracije++;
            }
        });
        if (vozilaBezRegistracije > 0) {
            console.log(`⚠️ Upozorenje: Pronađeno ${vozilaBezRegistracije} vozila bez jasno definirane registracije.`);
        } else {
            console.log('✅ Sva vozila imaju validan ID (registraciju).');
        }

        console.log('\n--- Provjera kolekcije fleet_costs ---');
        const troskoviDocs = await fetchAllDocuments('fleet_costs');
        console.log(`Ukupan broj zapisa o troškovima: ${troskoviDocs.length}`);
        
        let missingVozilo = 0;
        let missingIznos = 0;
        let missingDatum = 0;
        let negativeIznos = 0;
        let totalIznos = 0;
        
        troskoviDocs.forEach(doc => {
            const data = doc.fields || {};
            
            const vozilo = getValue(data['reg']);
            if (!vozilo || String(vozilo).trim() === '') {
                missingVozilo++;
            }
            
            const iznos = getValue(data['cost']);
            if (iznos === undefined || iznos === null || isNaN(iznos)) {
                missingIznos++;
            } else if (iznos < 0) {
                negativeIznos++;
                totalIznos += iznos;
            } else {
                totalIznos += iznos;
            }
            
            const datum = getValue(data['datum']);
            if (!datum || String(datum) === '') {
                missingDatum++;
            }
        });
        
        console.log(`Ukupan zbroj svih troškova u bazi: ${totalIznos.toFixed(2)} EUR`);
        
        if (missingVozilo > 0) console.log(`⚠️ Upozorenje: Pronađeno ${missingVozilo} troškova bez unesenog vozila.`);
        else console.log('✅ Svi troškovi su povezani s nekim vozilom.');
            
        if (missingIznos > 0) console.log(`⚠️ Upozorenje: Pronađeno ${missingIznos} troškova s neispravnim ili nedostajućim iznosom.`);
        else console.log('✅ Svi troškovi imaju validan iznos.');
            
        if (negativeIznos > 0) console.log(`ℹ️ Info: Pronađeno ${negativeIznos} troškova s negativnim iznosom.`);
            
        if (missingDatum > 0) console.log(`⚠️ Upozorenje: Pronađeno ${missingDatum} troškova bez unesenog datuma.`);
        else console.log('✅ Svi troškovi imaju definiran datum.');

        console.log('\n--- Health Check završen ---');
        
    } catch (error) {
        console.error('Dogodila se greška tijekom provjere:', error);
    }
}

runHealthCheck();
