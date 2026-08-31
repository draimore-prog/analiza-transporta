function renderMultiYearMatrices(data, availableYears) {
            const monthsNames = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni', 'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];
            let matrixData = {};
            monthsNames.forEach((_, idx) => {
                matrixData[idx + 1] = {};
                availableYears.forEach(y => matrixData[idx + 1][y] = 0);
            });
            let yearVehicleCounts = {};
            availableYears.forEach(y => {
                yearVehicleCounts[y] = (kpiTotalFleetByYear[y] && kpiTotalFleetByYear[y].Total) ? kpiTotalFleetByYear[y].Total : 0;
            });
            data.forEach(item => {
                if (matrixData[item.month] && matrixData[item.month][item.year] !== undefined) {
                    matrixData[item.month][item.year] += item.cost;
                }
            });
            const headerElem = document.getElementById('matrixTableHeader');
            let headerHTML = `<tr><th class="py-2.5 px-3 text-left whitespace-nowrap">Mjesec</th>`;
            availableYears.forEach(y => { 
                let vCount = yearVehicleCounts[y];
                let vLabel = vCount > 0 ? `<br><span class="text-[10px] text-slate-500 dark:text-slate-400 font-normal">(${vCount} vozila)</span>` : '';
                headerHTML += `<th class="py-2.5 px-3 text-right whitespace-nowrap">${y} (KM)${vLabel}</th>`; 
            });
            headerHTML += `<th class="py-2.5 px-3 text-right bg-blue-50 dark:bg-slate-800 text-blue-900 dark:text-blue-300 whitespace-nowrap align-top">Ukupno</th></tr>`;
            if (headerElem) headerElem.innerHTML = headerHTML;
            const bodyElem = document.getElementById('matrixTableBody');
            let bodyRows = [];
            let yearTotals = {};
            availableYears.forEach(y => yearTotals[y] = 0);
            monthsNames.forEach((mName, mIdx) => {
                let mNum = mIdx + 1;
                let rowSum = 0;
                let rowHTML = `<tr class="hover:bg-slate-50 dark:hover:bg-slate-800/60"><td class="py-2.5 px-3 text-left font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">${mName}</td>`;
                
                availableYears.forEach(y => {
                    let val = matrixData[mNum][y] || 0;
                    rowSum += val;
                    yearTotals[y] += val;
                    rowHTML += `<td class="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">${val > 0 ? val.toLocaleString('bs-BA', {minimumFractionDigits: 0, maximumFractionDigits: 0}) : '-'}</td>`;
                });
                rowHTML += `<td class="py-2.5 px-3 text-right font-mono font-bold bg-blue-50/50 dark:bg-slate-800 text-blue-900 dark:text-blue-300 whitespace-nowrap">${rowSum.toLocaleString('bs-BA', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td></tr>`;
                bodyRows.push(rowHTML);
            });
            let grandTotal = 0;
            let totalRowHTML = `<tr class="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700"><td class="py-3 px-3 text-left whitespace-nowrap">UKUPNO</td>`;
            availableYears.forEach(y => {
                let yTot = yearTotals[y] || 0;
                grandTotal += yTot;
                totalRowHTML += `<td class="py-3 px-3 text-right font-mono whitespace-nowrap">${yTot.toLocaleString('bs-BA', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>`;
            });
            totalRowHTML += `<td class="py-3 px-3 text-right font-mono bg-blue-100 dark:bg-slate-800 text-blue-950 dark:text-blue-300 whitespace-nowrap">${grandTotal.toLocaleString('bs-BA', {minimumFractionDigits: 0, maximumFractionDigits: 0})} KM</td></tr>`;
            bodyRows.push(totalRowHTML);
            if (bodyElem) bodyElem.innerHTML = bodyRows.join('');
            // Matrica postotnih razlika
            const percHeaderElem =