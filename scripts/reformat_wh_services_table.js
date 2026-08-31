const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'dashboard12_troskova.html');
const indexFile = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Replace whTabContent3 markup with exact Tabela Servisa structure
const oldWhTab3Start = '<div id="whTabContent3" class="hidden space-y-6">';
const oldWhTab3End = '                <!-- TAB W4: SEGMENTI & DIJELOVI (CLICKABLE SEGMENTS!) -->';

const startIndex = content.indexOf(oldWhTab3Start);
const endIndex = content.indexOf(oldWhTab3End);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find whTabContent3 boundaries!');
    process.exit(1);
}

const newWhTab3HTML = `<div id="whTabContent3" class="hidden space-y-6">
                    <div class="card">
                        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div>
                                <h3 class="text-base font-extrabold text-slate-800 dark:text-white">📋 Tabela filtriranih servisa i opravki skladišne mehanizacije</h3>
                                <p class="text-xs text-slate-500 mt-0.5" id="whTableRecordCount">Prikazano 0 zapisa</p>
                            </div>
                            <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                                <!-- Filter Godine -->
                                <div>
                                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Godina</label>
                                    <select id="whServYearFilter" onchange="filterWhServices()" class="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200">
                                        <option value="all">Sve godine</option>
                                    </select>
                                </div>
                                <!-- Sortiranje po datumu/iznosu -->
                                <div>
                                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Sortiranje / Novi unosi</label>
                                    <select id="whServSortFilter" onchange="filterWhServices()" class="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200">
                                        <option value="new-first">🆕 Novi unosi na vrhu + Datum (Najnovije)</option>
                                        <option value="date-desc">📅 Datum (Najnovije prvo)</option>
                                        <option value="date-asc">📅 Datum (Najstarije prvo)</option>
                                        <option value="cost-desc">💰 Trošak (Najveći prvo)</option>
                                        <option value="cost-asc">💰 Trošak (Najmanji prvo)</option>
                                    </select>
                                </div>
                                <!-- Pretraga -->
                                <div>
                                    <label class="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Pretraga</label>
                                    <input type="text" id="whServSearchInput" onkeyup="filterWhServices()" placeholder="🔍 Pretraži reg, opis ili servisera..." class="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 w-full sm:w-56 focus:ring-2 focus:ring-amber-500 font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                </div>
                                <!-- Export Excel dugme -->
                                <div class="flex items-end">
                                    <button onclick="exportWarehouseServicesToExcel()" class="bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold px-3 py-1.5 rounded-lg text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer mt-3 sm:mt-0">
                                        <span>📥 Izvezi Excel</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="overflow-x-auto max-h-[550px] border border-slate-200 dark:border-slate-800 rounded-lg">
                            <table class="min-w-full text-xs text-left">
                                <thead class="bg-slate-100 dark:bg-slate-900 sticky top-0 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th class="py-2.5 px-3">Datum</th>
                                        <th class="py-2.5 px-3">Registracija / Oznaka</th>
                                        <th class="py-2.5 px-3">Garažni Broj</th>
                                        <th class="py-2.5 px-3">Tip Mehanizacije</th>
                                        <th class="py-2.5 px-3">Marka</th>
                                        <th class="py-2.5 px-3">Segment</th>
                                        <th class="py-2.5 px-3">Opis Popravke</th>
                                        <th class="py-2.5 px-3">Serviser / Dobavljač</th>
                                        <th class="py-2.5 px-3 text-right">Trošak (KM)</th>
                                    </tr>
                                </thead>
                                <tbody id="whServicesTableBody" class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                    <!-- Pune se redovi identično tabeli servisa -->
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- PAGINACIJA ZA TABELU SERVISA SKLADIŠTA -->
                        <div class="flex items-center justify-between mt-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg">
                            <button id="whTransPrevBtn" onclick="prevWhTransPage()" class="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer">
                                ⬅️ Prethodna
                            </button>
                            <span id="whTransCurrentPageDisplay" class="text-xs font-bold text-slate-600 dark:text-slate-400">
                                Stranica 1 od 1
                            </span>
                            <button id="whTransNextBtn" onclick="nextWhTransPage()" class="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer">
                                Sljedeća ➡️
                            </button>
                        </div>
                    </div>
                </div>\n\n`;

content = content.substring(0, startIndex) + newWhTab3HTML + content.substring(endIndex);

// 2. Replace populateWarehouseServiceFilters, filterWhServices, renderWarehouseServicesTable, and pagination in JS
const oldJSBlockStart = '// ================= WAREHOUSE SERVICES & REPAIRS (TAB 3) =================';
const oldJSBlockEnd = '// ================= WAREHOUSE SEGMENTS (TAB 4 - CLICKABLE) =================';

const jsStartIndex = content.indexOf(oldJSBlockStart);
const jsEndIndex = content.indexOf(oldJSBlockEnd);

if (jsStartIndex === -1 || jsEndIndex === -1) {
    console.error('Could not find JS block boundaries!');
    process.exit(1);
}

const newJSBlock = `// ================= WAREHOUSE SERVICES & REPAIRS (TAB 3 - EXACT SAME AS TABELA SERVISA) =================
        let whTransPage = 1;
        const whTransPerPage = 100;
        let whFilteredServices = [];

        function populateWarehouseServiceFilters() {
            let whCosts = getWarehouseData();
            let yearSelect = document.getElementById('whServYearFilter');
            if (yearSelect) {
                let currentVal = yearSelect.value || 'all';
                let yearsArr = Array.from(new Set(whCosts.map(i => i.year))).sort((a,b) => b - a);
                let options = ['<option value="all">Sve godine</option>'];
                yearsArr.forEach(y => {
                    let sel = (y.toString() === currentVal) ? 'selected' : '';
                    options.push(\`<option value="\${y}" \${sel}>\${y}. godina</option>\`);
                });
                yearSelect.innerHTML = options.join('');
            }
        }

        function filterWhServices() {
            let whCosts = getWarehouseData();
            let term = (document.getElementById('whServSearchInput')?.value || '').trim().toLowerCase();
            let selectedYear = document.getElementById('whServYearFilter') ? document.getElementById('whServYearFilter').value : 'all';
            let sortMode = document.getElementById('whServSortFilter') ? document.getElementById('whServSortFilter').value : 'new-first';

            let filtered = whCosts.filter(item => {
                let matchYear = selectedYear === 'all' || item.year === parseInt(selectedYear);
                let matchTerm = !term ||
                    (item.reg && item.reg.toLowerCase().includes(term)) ||
                    (item.garazniBroj && item.garazniBroj.toLowerCase().includes(term)) ||
                    (item.opisPopravke && item.opisPopravke.toLowerCase().includes(term)) ||
                    (item.dobavljacOrig && item.dobavljacOrig.toLowerCase().includes(term)) ||
                    (item.segment && item.segment.toLowerCase().includes(term));
                return matchYear && matchTerm;
            });

            if (sortMode === 'new-first') {
                filtered.sort((a, b) => {
                    if (a.isNewCustom && !b.isNewCustom) return -1;
                    if (!a.isNewCustom && b.isNewCustom) return 1;
                    return (b.datumObj || 0) - (a.datumObj || 0);
                });
            } else if (sortMode === 'date-desc') {
                filtered.sort((a, b) => (b.datumObj || 0) - (a.datumObj || 0));
            } else if (sortMode === 'date-asc') {
                filtered.sort((a, b) => (a.datumObj || 0) - (b.datumObj || 0));
            } else if (sortMode === 'cost-desc') {
                filtered.sort((a, b) => b.cost - a.cost);
            } else if (sortMode === 'cost-asc') {
                filtered.sort((a, b) => a.cost - b.cost);
            }

            whFilteredServices = filtered;
            whTransPage = 1;
            renderWarehouseServicesTable();
        }

        function renderWarehouseServicesTable() {
            let filtered = whFilteredServices;
            const countElem = document.getElementById('whTableRecordCount');
            if (countElem) countElem.innerText = \`Prikazano ukupno \${filtered.length.toLocaleString('bs-BA')} servisa skladišne mehanizacije\`;

            let totalPages = Math.ceil(filtered.length / whTransPerPage) || 1;
            if (whTransPage > totalPages) whTransPage = totalPages;
            if (whTransPage < 1) whTransPage = 1;

            const tbody = document.getElementById('whServicesTableBody');
            if (!tbody) return;

            let rowsHTML = [];
            let startIdx = (whTransPage - 1) * whTransPerPage;
            let endIdx = Math.min(startIdx + whTransPerPage, filtered.length);

            filtered.slice(startIdx, endIdx).forEach(item => {
                let dateStr = "-";
                if (item.datumObj && !isNaN(item.datumObj)) {
                    dateStr = ("0" + item.datumObj.getDate()).slice(-2) + "." + ("0" + (item.datumObj.getMonth() + 1)).slice(-2) + "." + item.datumObj.getFullYear() + ".";
                }
                let newBadge = item.isNewCustom ? \`<span class="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-extrabold ml-1">🆕 Novo</span>\` : '';
                rowsHTML.push(\`
                    <tr class="hover:bg-amber-50/60 dark:hover:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 transition-colors \${item.isNewCustom ? 'bg-emerald-50/30 font-medium' : ''}">
                        <td class="py-2 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">\${dateStr} \${newBadge}</td>
                        <td class="py-2 px-3 font-bold text-amber-700 dark:text-amber-400 cursor-pointer hover:underline" onclick="openVehicleModal('\${item.reg}')">\${item.reg}</td>
                        <td class="py-2 px-3 font-mono font-semibold text-slate-600 dark:text-slate-400">\${item.garazniBroj || '-'}</td>
                        <td class="py-2 px-3 text-slate-600 dark:text-slate-400">\${item.tipMehan || 'Skladišna mehanizacija'}</td>
                        <td class="py-2 px-3 text-slate-600 dark:text-slate-400">\${item.markaVoz || '-'}</td>
                        <td class="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">\${item.segment || '-'}</td>
                        <td class="py-2 px-3 text-slate-900 dark:text-white font-semibold break-words max-w-[220px]">\${item.opisPopravke || '-'}</td>
                        <td class="py-2 px-3 text-slate-600 dark:text-slate-400 text-xs truncate max-w-[150px]" title="\${item.dobavljacOrig}">\${item.dobavljacOrig || '-'}</td>
                        <td class="py-2 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                            <div class="flex items-center justify-end gap-1.5">
                                <span>\${item.cost.toLocaleString('bs-BA', {minimumFractionDigits: 2, maximumFractionDigits: 2})} KM</span>
                                \${(item.isNewCustom === true && activeUser && (activeUser.role === 'superadmin' || activeUser.role === 'editor' || activeUser.role === 'warehouse_specialist')) ? \`<button onclick="deleteCostRecord('\${item.id}')" class="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded font-bold text-xs no-print transition-all" title="Obriši ovaj ručno uneseni trošak">🗑️</button>\` : ''}
                            </div>
                        </td>
                    </tr>
                \`);
            });

            if (filtered.length === 0) {
                tbody.innerHTML = \`<tr><td colspan="9" class="py-8 text-center text-slate-400 font-medium italic">Nema popravki skladišne mehanizacije koje odgovaraju odabranim filterima.</td></tr>\`;
            } else {
                tbody.innerHTML = rowsHTML.join('');
            }

            let pageDisp = document.getElementById('whTransCurrentPageDisplay');
            if (pageDisp) pageDisp.innerText = \`Stranica \${whTransPage} od \${totalPages}\`;
            let prevBtn = document.getElementById('whTransPrevBtn');
            if (prevBtn) prevBtn.disabled = whTransPage <= 1;
            let nextBtn = document.getElementById('whTransNextBtn');
            if (nextBtn) nextBtn.disabled = whTransPage >= totalPages;
        }

        function prevWhTransPage() {
            if (whTransPage > 1) {
                whTransPage--;
                renderWarehouseServicesTable();
            }
        }

        function nextWhTransPage() {
            let totalPages = Math.ceil(whFilteredServices.length / whTransPerPage) || 1;
            if (whTransPage < totalPages) {
                whTransPage++;
                renderWarehouseServicesTable();
            }
        }

        function exportWarehouseServicesToExcel() {
            if (typeof XLSX === 'undefined') {
                alert("XLSX biblioteka nije učitana.");
                return;
            }
            let cleanRows = whFilteredServices.map((c, i) => {
                let dateStr = "-";
                if (c.datumObj && !isNaN(c.datumObj)) {
                    dateStr = ("0" + c.datumObj.getDate()).slice(-2) + "." + ("0" + (c.datumObj.getMonth() + 1)).slice(-2) + "." + c.datumObj.getFullYear() + ".";
                }
                return {
                    'R.b.': i + 1,
                    'Datum': dateStr,
                    'Godina': c.year || '-',
                    'Mjesec': c.month || '-',
                    'Garažni Broj': c.garazniBroj || '-',
                    'Interna Oznaka / Reg': c.reg || '-',
                    'Tip Mehanizacije': c.tipMehan || 'Skladišna mehanizacija',
                    'Marka': c.markaVoz || '-',
                    'Segment': c.segment || 'Ostalo',
                    'Opis Popravke': c.opisPopravke || '-',
                    'Serviser / Dobavljač': c.dobavljacOrig || c.dobavljac || 'Vlastita Radionica',
                    'Trošak (KM)': c.cost || 0
                };
            });

            let ws = XLSX.utils.json_to_sheet(cleanRows);
            let wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Skladisne_Opravke");
            XLSX.writeFile(wb, "Skladisna_Mehanizacija_Tabela_Servisa.xlsx");
        }
\n        `;

content = content.substring(0, jsStartIndex) + newJSBlock + content.substring(jsEndIndex);

fs.writeFileSync(targetFile, content, 'utf8');
fs.writeFileSync(indexFile, content, 'utf8');

console.log('🎉 Successfully applied identical Tabela Servisa structure to Skladišna Mehanizacija!');
