function renderLongTermKPI() {
            if (typeof globalData === 'undefined' || !globalData || globalData.length === 0) return;
            const dynamic26 = calculateDynamic2026();
            const renderTable = (tbodyId, cat, fixedData, fixedPercs, dynamicData, isCost) => {
                let html = "";
                let totals = { 2021:0, 2022:0, 2023:0, 2024:0, 2025:0, 2026:0 };
                
                let keys = Object.keys(fixedData);
                
                keys.forEach(k => {
                    let v21 = fixedData[k][2021];
                    let v22 = fixedData[k][2022];
                    let v23 = fixedData[k][2023];
                    let v24 = fixedData[k][2024];
                    let v25 = fixedData[k][2025];
                    let v26 = dynamicData[k] || 0;
                    totals[2021] += v21; totals[2022] += v22; totals[2023] += v23;
                    totals[2024] += v24; totals[2025] += v25; totals[2026] += v26;
                    let p21_22 = fixedPercs[k]["21/22"];
                    let p22_23 = fixedPercs[k]["22/23"];
                    let p23_24 = fixedPercs[k]["23/24"];
                    let p24_25 = fixedPercs[k]["24/25"];
                    
                    let p25_26 = v25 === 0 ? 0 : Math.round(((v26 - v25) / v25) * 100);
                    let p21_26 = v21 === 0 ? 0 : Math.round(((v26 - v21) / v21) * 100);
                    let fmt21 = isCost ? v21.toLocaleString('bs-BA',{minimumFractionDigits:0, maximumFractionDigits:0}) : v21;
                    let fmt22 = isCost ? v22.toLocaleString('bs-BA',{minimumFractionDigits:0, maximumFractionDigits:0}) : v22;
                    let fmt23 = isCost ? v23.toLocaleString('bs-BA',{minimumFractionDigits:0, maximumFractionDigits:0}) : v23;
                    let fmt24 = isCost ? v24.toLocaleString('bs-BA',{minimumFractionDigits:0, maximumFractionDigits:0}) : v24;
                    let fmt25 = isCost ? v25.toLocaleString('bs-BA',{minimumFractionDigits:0, maximumFractionDigits:0}) : v25;
                    let fmt26 = isCost ? v26.toLocaleString('bs-BA',{minimumFractionDigits:0, maximumFractionDigits:0}) : v26;
                    html += `
                        <tr class="hover:bg-slate-50 transition-colors">
                            <td class="py-1.5 px-2 border-r border-slate-100">${k}</td>
                            <td class="py-1.5 px-2 ${isCost?'text-right':'text-center'}">${fmt21}</td>
                            <td class="py-1.5 px-2 ${isCost?'text-right':'text-center'}">${fmt22}</td>
                            <td class="py-1.5 px-2 ${isCost?'text-right':'text-center'}">${fmt23}</td>
                            <td class="py-1.5 px-2 ${isCost?'text-right':'text-center'}">${fmt24}</td>
                            <td class="py-1.5 px-2 ${isCost?'text-right':'text-center'}">${fmt25}</td>
                            <td class="py-1.5 px-2 ${isCost?'text-right':'text-center'} font-bold text-indigo-700 bg-indigo-50/20">${fmt26}</td>
                            <td class="py-1.5 px-1 text-center bg-slate-50 border-l border-slate-100">${formatLtYoy(p21_22, isCost)}</td>
                            <td class="py-1.5 px-1 text-center bg-slate-50">${formatLtYoy(p22_23, isCost)}</td>
                            <td class="py-1.5 px-1 text-center bg-slate-50">${formatLtYoy(p23_24, isCost)}</td>
                            <td class="py-1.5 px-1 text-center bg-slate-50">${formatLtYoy(p24_25, isCost)}</td>
                            <td class="py-1.5 px-1 text-center bg-indigo-50/50">${formatLtYoy(p25_26, isCost)}</td>
                            <td class="py-1.5 px-1 text-center bg-indigo-100/50 border-l border-indigo-200/50">${formatLtYoy(p21_26, isCost)}</td>
                        </tr>
                    `;
                });
                // Grand total
                let tp21_22 = fixedPercs["Grand Total"]["21/22"];
                let tp22_23 = fixedPercs["Grand Total"]["22/23"];
       