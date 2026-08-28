const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'dashboard12_troskova.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Zamjena footera u modalu
const target1 = /<div class="flex justify-end gap-3 pt-4 border-t border-slate-200">\s*<button type="button" onclick="closeEditVehicleModal\(\)" class="px-5 py-2\.5 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors">\s*Odustani\s*<\/button>\s*<button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-2\.5 rounded-xl shadow-lg transition-all text-xs flex items-center gap-2">\s*<span>💾 Sačuvaj u Šifrarnik<\/span>\s*<\/button>\s*<\/div>/;

const repl1 = `<div class="flex justify-between items-center pt-4 border-t border-slate-200 w-full">
                    <div id="evDeleteContainer">
                        <!-- Ovdje se dinamički ubacuje dugme za brisanje (Samo za superadmina) -->
                    </div>
                    <div class="flex justify-end gap-3">
                        <button type="button" onclick="closeEditVehicleModal()" class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors">
                            Odustani
                        </button>
                        <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-lg transition-all text-xs flex items-center gap-2">
                            <span>💾 Sačuvaj u Šifrarnik</span>
                        </button>
                    </div>
                </div>`;

// 2. Dodavanje logike u openEditVehicleModal
const target2 = /document\.getElementById\('evBrojSasije'\)\.value = '';\s*document\.getElementById\('evStatus'\)\.value = 'Aktivno';\s*}\s*document\.getElementById\('editVehicleMasterModal'\)\.classList\.remove\('hidden'\);\s*}/;

const repl2 = `document.getElementById('evBrojSasije').value = '';
                document.getElementById('evStatus').value = 'Aktivno';
            }

            const delContainer = document.getElementById('evDeleteContainer');
            if (delContainer) {
                let isSuper = activeUser && (activeUser.username.toLowerCase() === 'emir.durakovic' || activeUser.role === 'superadmin');
                if (regToEdit && isSuper) {
                    delContainer.innerHTML = \`<button type="button" onclick="deleteVehicleMaster('\${regToEdit}')" class="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs transition-colors shadow-sm">🗑️ Obriši Vozilo</button>\`;
                } else {
                    delContainer.innerHTML = '';
                }
            }

            document.getElementById('editVehicleMasterModal').classList.remove('hidden');
        }`;

// 3. Dodavanje deleteVehicleMaster funkcije
const target3 = /function closeEditVehicleModal\(\) \{\s*document\.getElementById\('editVehicleMasterModal'\)\.classList\.add\('hidden'\);\s*\}\s*async function handleSaveVehicleMaster\(event\) \{/;

const repl3 = `function closeEditVehicleModal() {
            document.getElementById('editVehicleMasterModal').classList.add('hidden');
        }

        async function deleteVehicleMaster(reg) {
            if (!activeUser || (activeUser.username.toLowerCase() !== 'emir.durakovic' && activeUser.role !== 'superadmin')) {
                alert("Pristup odbijen! Samo Super Administrator može brisati vozila iz šifrarnika.");
                return;
            }
            if (!confirm(\`Da li ste sigurni da želite TRAJNO OBRISATI vozilo sa registracijom \${reg} iz šifrarnika? Ova akcija se ne može poništiti!\`)) {
                return;
            }
            try {
                let safeDocId = reg.replace(/[\\/\\\\#\\?]/g, '_');
                if (window.db) {
                    await window.db.collection('fleet_master').doc(safeDocId).delete();
                }
                masterFleetData = masterFleetData.filter(v => v.reg !== reg);
                if (typeof _saveCache === 'function') {
                    _saveCache(MASTER_CACHE_KEY, masterFleetData);
                }
                closeEditVehicleModal();
                renderMasterFleetTable();
                alert(\`Vozilo \${reg} je uspješno obrisano.\`);
            } catch (err) {
                console.error("Greška pri brisanju vozila:", err);
                alert("Dogodila se greška pri brisanju vozila.");
            }
        }

        async function handleSaveVehicleMaster(event) {`;

let updated = false;

if (target1.test(content)) { content = content.replace(target1, repl1); updated = true; }
else console.warn('Target 1 not found');

if (target2.test(content)) { content = content.replace(target2, repl2); updated = true; }
else console.warn('Target 2 not found');

if (target3.test(content)) { content = content.replace(target3, repl3); updated = true; }
else console.warn('Target 3 not found');

if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fajl uspesno apdejtovan!');
} else {
    console.log('Nijedna izmena nije napravljena, proverite target stringove.');
}
