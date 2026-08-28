const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'dashboard12_troskova.html');
let content = fs.readFileSync(filePath, 'utf8');

const targetRegex = /function renderMasterFleetTable\(\) \{\s*const tbody = document\.getElementById\('masterFleetTableBody'\);\s*if \(!tbody\) return;/;

const repl = `function renderMasterFleetTable() {
            // --- AUTOMATSKO AZURIRANJE ZA 2026 NA BAZI AKTIVNIH VOZILA ---
            if (masterFleetData && masterFleetData.length > 0) {
                let counts = { Total: 0, 'Teretna vozila': 0, 'Putni\\u010Dka vozila': 0, 'Priklju\\u010Dna vozila': 0, 'Radna ma\\u0161ina': 0, 'Skladi\\u0161na mehanizacija': 0, 'Servis motornih vozila': 0 };
                masterFleetData.forEach(v => {
                    let s = v.status || 'Aktivno';
                    // Racunamo samo ako nije Prodato i nije Rashodovano i nije Neaktivno, dakle 'Aktivno'
                    if (s === 'Aktivno') {
                        counts.Total++;
                        let t = v.tipMehan ? v.tipMehan.trim() : 'Ostalo';
                        if (t.includes('Teretn')) counts['Teretna vozila']++;
                        else if (t.includes('Putni')) counts['Putni\\u010Dka vozila']++;
                        else if (t.includes('Skladi') || t.includes('vilju\\u0161') || t.includes('viljusk')) counts['Skladi\\u0161na mehanizacija']++;
                        else if (t.includes('Priklju')) counts['Priklju\\u010Dna vozila']++;
                        else if (t.includes('Radna ma') || t.includes('Radna')) counts['Radna ma\\u0161ina']++;
                        else counts['Servis motornih vozila']++;
                    }
                });
                if (typeof kpiTotalFleetByYear !== 'undefined') {
                    kpiTotalFleetByYear[2026] = counts;
                }
                
                let badge = document.getElementById('masterFleetCountBadge');
                if (badge) badge.innerText = counts.Total.toLocaleString('bs-BA');
                
                let statusSub = document.getElementById('uploadStatusSubtitle');
                if (statusSub && statusSub.innerText.includes('Firestore')) {
                     let oldText = statusSub.innerText;
                     let newText = oldText.replace(/Firestore: \\d+ vozila/, \`Firestore: \${counts.Total} vozila\`);
                     statusSub.innerText = newText;
                }
                
                // Update specific DOM elements if they are on screen, this will force them to re-render naturally later
            }
            // --- KRAJ AZURIRANJA ---

            const tbody = document.getElementById('masterFleetTableBody');
            if (!tbody) return;`;

if (targetRegex.test(content)) {
    content = content.replace(targetRegex, repl);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ dashboard12_troskova.html uspješno patchovan sa dinamičkim ažuriranjem!');
} else {
    console.log('❌ Nije pronađen ciljni string u dashboard12_troskova.html');
}
