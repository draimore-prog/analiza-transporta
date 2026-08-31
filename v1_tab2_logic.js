ypeAllTotals = {};
            let totalParts = 0, totalServices = 0;
            let typeMonthDaily = {};
            let typeSegmentMap = {};
            let allSegments = new Set();
            data.forEach(item => {
                let tip = item.tipMehan;
                typeAllTotals[tip] = (typeAllTotals[tip] || 0) + item.cost;
                
                totalParts += item.costPart;
                totalServices += item.costService;
                if (!typeMonthDaily[tip]) typeMonthDaily[tip] = { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0, 10:0, 11:0, 12:0 };
                typeMonthDaily[tip][item.month] += item.cost;
                if (!typeSegmentMap[tip]) typeSegmentMap[tip] = {};
                typeSegmentMap[tip][item.segment] = (typeSegmentMap[tip][item.segment] || 0) + item.cost;
                allSegments.add(item.segment);
            });
            let typeVehicleSets = {};
            let typeYearTotals = {};
            dailyDataYear.forEach(item => {
                let tip = item.tipMehan;
                if (!typeVehicleSets[tip]) typeVehicleSets[tip] = new Set();
                typeVehicleSets[tip].add(item.reg);
                typeYearTotals[tip] = (typeYearTotals[tip] || 0) + item.cost;
            });
            // Fleets i Costs po godinama iz KPI Total
            let yearKpiFleet = kpiTotalFleetByYear[periodInfo.targetYear] || {};
            let yearKpiCosts = kpiTotalCostsByYear[periodInfo.targetYear] || {};
            let yearTotalFleetCount = yearKpiFleet.Total || 938;
            document.getElementById('tab2DailyTitle').innerHTML = `<span>Prosječan Trošak PO JEDINICI (Vozilu) – za ${periodInfo.periodLabel}</span>`;
            document.getElementById('tab2PeriodSubtitle').innerText = `Detektovano ${periodInfo.monthsCount} mj. / ${periodInfo.daysCount} dana u ${periodInfo.targetYear}. g. (Struktura iz tabele KPI Total)`;
            document.getElementById('masterFleetCountBadge').innerText = yearTotalFleetCount.toLocaleString('bs-BA');
            const gridContainer = document.getElementById('dailyTypeKpiGrid');
            let kpiCardsHTML = [];
            
            // 6 GLAVNIH TIPOVA IZ TABELE KPI TOTAL
            let sortedTypes = ['Teretna vozila', 'Putnička vozila', 'Skladišna mehanizacija', 'Priključna vozila', 'Radna mašina', 'Servis motornih vozila'];
            sortedTypes.forEach(tip => {
                let yearTot = typeYearTotals[tip] !== undefined && typeYearTotals[tip] > 0 ? typeYearTotals[tip] : (yearKpiCosts[tip] || 0);
                
                let vehicleCount = 0;
                if (fleetMode === 'master') {
                    vehicleCount = yearKpiFleet[tip] !== undefined ? yearKpiFleet[tip] : (typeVehicleSets[tip] ? typeVehicleSets[tip].size : 0);
                } else {
                    vehicleCount = typeVehicleSets[tip] ? typeVehicleSets[tip].size : 0;
                }
                
                let dailyPerVehicle = (vehicleCount > 0 && periodInfo.daysCount > 0) ? (yearTot / (vehicleCount * periodInfo.daysCount)) : 0;
                let monthlyPerVehicle = (vehicleCount > 0 && periodInfo.monthsCount > 0) ? (yearTot / (vehicleCount * periodInfo.monthsCount)) : 0;
                kpiCardsHTML.push(`
                    <div class="card border-l-4 border-indigo-600 bg-gradient-to-br from-white to-indigo-50/30 shadow-sm">
                        <div class="flex justify-between items-start">
                            <span class="text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider">${tip}</span>
                            <span class="text-[11px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">${vehicleCount} vozila</span>
                        </div>
                        <h4 class="text-2xl font-black text-slate-900 mt-2">${dailyPerVehicle.toLocaleString('bs-BA', {minimumFractionDigits: 2, maximumFractionDigits: 2})} KM <span class="text-xs font-semibold text-slate-500">/ dan</span></h4>
                        <p class="text-xs font-bold text-indigo-700 mt-1">🗓️ ${monthlyPerVehicle.toLocaleString('bs-BA', {minimumFractionDigits: 2, maximumFractionDigits: 2})} KM <span class="font-normal text-slate-500">/ mjesečno</span></p>
                        <div class="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                            <span class="text-slate-500">Trošak u ${periodInfo.targetYear}.:</span>
                            <span class="font-bold text-slate-800">${yearTot.toLocaleString('bs-BA', {minimumFractionDigits: 0, maximumFractionDigits: 0})} KM</span>
                        </div>
                    </div>
                `);
            });
            gridContainer.innerHTML = kpiCardsHTML.join('');
        }
        // ================= TAB 3 PROCESSOR (YOY KOMPARACIJA & KPI MJESEČNI) =================
        function populateTab3Controls() {
            const yearASelect = document.getElementById('compYearA');
            const yearBSelect = document.getElementById('compYearB');
            if (!yearASelect || !yearBSelect) return;
            let sortedYears = Array.from(yearsSet).sort((a, b) => b - a);
            if (sortedYears.length === 0) return;
            let latest = sortedYears[0];
            let previous = sortedYears.length > 1 ? sortedYears[1] : latest - 1;
            let currentA = yearASelect.value || latest.toString();
            let currentB = yearBSelect.value || previous.toString();
            let optionsA = [];
            let optionsB = [];
            sortedYears.forEach(y => {
                let selA = y.toString() === currentA ? 'selected' : '';
                let selB = y.toString() === currentB ? 'selected' : '';
                optionsA.push(`<option value="${y}" ${selA}>${y}. godina</option>`);
                optionsB.push(`<option value="${y}" ${selB}>${y}. godina</option>`);
            });
            yearASelect.innerHTML = optionsA.join('');
            yearBSelect.innerHTML = optionsB.join('');
        }
        function triggerTab3Comparison() {
            if (typeof globalData !== 'undefined' && globalData.length > 0) {
                processTab3(getTab3BaseData());
            }
        }
        function exportComparisonTableToExcel(containerId, title) {
            const table = document.querySelector(`#${containerId} table`);
            if (!table) {
                alert("Tabela nije pronađena za izvoz.");
                return;
            }
            const wb = XLSX.utils.table_to_book(table, { sheet: "Komparacija" });
            XLSX.writeFile(wb, `${title.replace(/[^a-zA-Z0-9_]/g, '_')}.xlsx`);
        }
        function exportAllComparisonToExcel() {
            if (typeof XLSX === 'undefined') return;
            const wb = XLSX.utils.book_new();
            const gridIds = ['ytdTypeGrid', 'ytdSegmentGrid', 'yoyMonthTypeGrid', 'momMonthTypeGrid'];
            const sheetNames = ['YTD_Tip_Mehanizacije', 'YTD_Segmenti', 'YoY_Mjesečno', 'MoM_Mjesečno'];
            
            gridIds.forEach((id, idx) => {
                const table = document.querySelector(`#${id} table`);
                if (table) {
                    const ws = XLSX.utils.table_to_sheet(table);
                    XLSX.utils.book_append_sheet(wb, ws, sheetNames[idx]);
                }
            });
            XLSX.writeFile(wb, `Komparativni_Izvjestaj_Troskova_${new Date().toISOString().slice(0,10)}.xlsx`);
        }
        function printComparisonReport() {
            window.print();
        }
        function processTab3(data) {
            if (!data || data.length === 0) return;
            populateTab3Controls();
            let availableYears = Array.from(yearsSet).sort((a,b) => a - b);
            let latestYear = availableYears.length > 0 ? Math.max(...availableYears) : new Date().getFullYear();
            let defaultPrevYear = availableYears.length > 1 ? availableYears[availableYears.length - 2] : latestYear - 1;
            const elemA = document.getElementById('compYearA');
            const elemB = document.getElementById('compYearB');
            const elemM = document.getElementById('compMonth');
            let currYear = elemA && elemA.value ? parseInt(elemA.value) : latestYear;
            let prevYear = elemB && elemB.value ? parseInt(elemB.value) : defaultPrevYear;
            let monthSel = elemM && elemM.value ? elemM.value : 'all';
            let yearDataCurr = data.filter(d => d.year === currYear);
            let activeMonths = Array.from(new Set(yearDataCurr.map(d => d.month))).sort((a,b) => a - b);
            if (activeMonths.length === 0) activeMonths = [1, 2, 3, 4, 5, 6];
            let targetMonth = monthSel !== 'all' ? parseInt(monthSel) : Math.max(...activeMonths);
            let prevMonth = targetMonth > 1 ? targetMonth - 1 : 12;
            let prevMonthYear = targetMonth > 1 ? currYear : currYear - 1;
            // 1. YTD / Period Komparacija
            let periodMonths = monthSel !== 'all' ? [targetMonth] : activeMonths;
            let startM = Math.min(...periodMonths);
            let endM = Math.max(...periodMonths);
            let periodLabel = monthSel !== 'all' 
                ? `${targetMonth}. mjesec (${currYear}. vs ${prevYear}.)`
                : `Period 01.0${startM}.-${endM < 10 ? '0'+endM : endM}.${currYear}. vs ${prevYear}.`;
            let currPeriodData = data.filter(d => d.year === currYear && periodMonths.includes(d.month));
            let prevPeriodData = data.filter(d => d.year === prevYear && periodMonths.includes(d.month));
            let ytdBadge = document.getElementById('ytdPeriodLabel');
            if (ytdBadge) ytdBadge.innerText = periodLabel;
            renderComparisonGrid('ytdTypeGrid', currPeriodData, prevPeriodData, 'tipMehan', currYear.toString(), prevYear.toString(), currYear, prevYear);
            renderComparisonGrid('ytdSegmentGrid', currPeriodData, prevPeriodData, 'segment', cu