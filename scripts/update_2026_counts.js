const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '..', 'dashboard12_troskova.html');
const fleetDataPath = path.join(__dirname, '..', 'fleet_data.json');

// --- 1. Ažuriranje dashboard12_troskova.html ---
let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

const targetDashboard = /2026:\s*\{\s*Total:\s*\d+,\s*'Priključna vozila':\s*\d+,\s*'Putnička vozila':\s*\d+,\s*'Radna mašina':\s*\d+,\s*'Skladišna mehanizacija':\s*\d+,\s*'Teretna vozila':\s*\d+,\s*'Servis motornih vozila':\s*\d+\s*\}/;

const replDashboard = `2026: { Total: 938, 'Priključna vozila': 51, 'Putnička vozila': 119, 'Radna mašina': 8, 'Skladišna mehanizacija': 594, 'Teretna vozila': 166, 'Servis motornih vozila': 0 }`;

// Zbog problema s encodingom (č u utf8), mozemo koristiti regex koji hvata bilo koje znakove u nazivima
const targetDashboardEncoding = /2026:\s*\{\s*Total:\s*\d+,\s*'Priklju[^']+':\s*\d+,\s*'Putni[^']+':\s*\d+,\s*'Radna ma[^']+':\s*\d+,\s*'Skladi[^']+':\s*\d+,\s*'Teretna vozila':\s*\d+,\s*'Servis motornih vozila':\s*\d+\s*\}/;

const replDashboardEncoding = `2026: { Total: 938, 'Priklju\u010Dna vozila': 51, 'Putni\u010Dka vozila': 119, 'Radna ma\u0161ina': 8, 'Skladi\u0161na mehanizacija': 594, 'Teretna vozila': 166, 'Servis motornih vozila': 0 }`;

if (targetDashboardEncoding.test(dashboardContent)) {
    let matchStr = dashboardContent.match(targetDashboardEncoding)[0];
    // Zadržat ćemo originalne stringove za ključeve kako ne bi pokvarili encoding
    // matchStr izgleda kao: 2026: { Total: 964, 'Prikljuna vozila': 51, 'Putnika vozila': 124, ...
    let modifiedMatchStr = matchStr
        .replace(/Total:\s*\d+/, 'Total: 938')
        .replace(/'Priklju[^']+':\s*\d+/, match => match.replace(/\d+/, '51'))
        .replace(/'Putni[^']+':\s*\d+/, match => match.replace(/\d+/, '119'))
        .replace(/'Radna ma[^']+':\s*\d+/, match => match.replace(/\d+/, '8'))
        .replace(/'Skladi[^']+':\s*\d+/, match => match.replace(/\d+/, '594'))
        .replace(/'Teretna vozila':\s*\d+/, match => match.replace(/\d+/, '166'))
        .replace(/'Servis motornih vozila':\s*\d+/, match => match.replace(/\d+/, '0'));
        
    dashboardContent = dashboardContent.replace(targetDashboardEncoding, modifiedMatchStr);
    fs.writeFileSync(dashboardPath, dashboardContent, 'utf8');
    console.log('✅ dashboard12_troskova.html ažuriran!');
} else {
    console.log('❌ Nije pronađen ciljni string u dashboard12_troskova.html');
}

// --- 2. Ažuriranje fleet_data.json ---
let fleetDataContent = fs.readFileSync(fleetDataPath, 'utf8');
let fleetDataObj = JSON.parse(fleetDataContent);

if (fleetDataObj.metadata && fleetDataObj.metadata.fleetByYear && fleetDataObj.metadata.fleetByYear['2026']) {
    let fleet2026 = fleetDataObj.metadata.fleetByYear['2026'];
    
    fleet2026.Total = 938;
    
    // Tražimo ključeve s lošim encodingom
    let keys = Object.keys(fleet2026);
    for (let k of keys) {
        if (k.includes('Putni')) fleet2026[k] = 119;
        if (k.includes('Radna ma')) fleet2026[k] = 8;
        if (k.includes('Skladi')) fleet2026[k] = 594;
        if (k.includes('Teretno') || k.includes('Teretna')) fleet2026[k] = 166;
        if (k.includes('Priklju')) fleet2026[k] = 51;
        if (k.includes('Servis')) fleet2026[k] = 0;
    }
    
    // Dodajemo ako fali Priključna vozila, a postojala je kao opcija
    let hasPrikljucna = keys.some(k => k.includes('Priklju'));
    if (!hasPrikljucna) {
        fleet2026['Priključna vozila'] = 51;
    }
    
    fs.writeFileSync(fleetDataPath, JSON.stringify(fleetDataObj, null, 2), 'utf8');
    console.log('✅ fleet_data.json ažuriran!');
} else {
    console.log('❌ Nije pronađen 2026 objekt u fleet_data.json');
}
