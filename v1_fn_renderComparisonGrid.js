function renderComparisonGrid(containerId, currData, prevData, groupKey, currLabel, prevLabel, yearA, yearB) {
            const container = document.getElementById(containerId);
            if (!container) return;
            let currMap = {}, prevMap = {};
            let keys = new Set();
            currData.forEach(d => {
                let k = d[groupKey] || 'Ostalo';
                if (!currMap[k]) currMap[k] = { cost: 0, count: 0 };
                currMap[k].cost += d.cost;
                currMap[k].count += 1;
                keys.add(k);
            });
            prevData.forEach(d => {
                let k = d[groupKey] || 'Ostalo';
                if (!prevMap[k]) prevMap[k] = { cost: 0, count: 0 };
                prevMap[k].cost += d.cost;
                prevMap[k].count += 1;
                keys.add(k);
            });
            let sortedKeys = Array.from(keys).sort((a,b) => {
                let cA = (currMap[a] ? currMap[a].cost : 0) + (prevMap[a] ? prevMap[a].cost : 0);
                let cB = (currMap[b] ? currMap[b].cost : 0) + (prevMap[b] ? prevMap[b].cost : 0);
                return cB - cA;
            });
            let totalCurrCost = 0;
            let totalPrevCost = 0;
            // Određujemo koja je godina novija radi poređenja (Novija vs Starija)
            let yA = yearA || 0;
            let yB = yearB || 0;
            let isANewer = yA >= yB;
            let rowsHTML = [];
            sortedKeys.forEach(k => {
                let cCost = currMap[k] ? currMap[k].cost : 0; // Godina A
                let pCost = prevMap[k] ? prevMap[k].cost : 0; // Godina B
                totalCurrCost += cCost;
                totalPrevCost += pCost;
                let newerCost = isANewer ? cCost : pCost;
                let olderCost = isANewer ? pCost : cCost;
                let diffKM = newerCost - olderCost;
                let diffPerc = olderCost > 0 ? ((newerCost - olderCost) / olderCost) * 100 : (newerCost > 0 ? 100 : 0);
                let vehicleLabelHTML = '';
                if (groupKey === 'tipMehan') {
                    let kpiA = kpiTotalFleetByYear[yA] || {};
                    let kpiB = kpiTotalFleetByYear[yB] || {};
                    let cCount = kpiA[k] || 0;
                    let pCount = kpiB[k] || 0;
                    let newerCount = isANewer ? cCount : pCount;
                    let olderCount = isANewer ? pCount : cCount;
                    if (olderCount > 0 || newerCount > 0) {
                        vehicleLabelHTML = `<div class="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">${olderCount} ➔ ${newerCount} vozila</div>`;
                    }
                }
                let badgeHTML = '';
                if (olderCost === 0 && newerCost === 0) {
                    badgeHTML = '<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">0.0%</span>';
                } else if (diffKM > 0) {
                    // Trošak u novijoj godini je veći -> VEĆI TROŠAK = RAST (🔴 RED)
                    badgeHTML = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700">🔴 +${diffPerc.toFixed(1)}%</span>`;
                } else if (diffKM < 0) {
                    // Trošak u novijoj godini je manji -> MANJI TROŠAK = UŠTEDA (🟢 GREEN)
                    badgeHTML = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">🟢 ${diffPerc.toFixed(1)}%</span>`;
                } else {
                    badgeHTML = '<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text