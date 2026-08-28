const fs = require('fs');

try {
    let content = fs.readFileSync('dashboard12_troskova.html', 'latin1');
    const target = `                  options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: { x: { stacked: true }, y: { stacked: true } }
                  }
              });`;
              
    const injection = target + `
              
              // Render new KPI Total sections
              renderKPITotalTables(transportData);
          }
          
          function renderKPITotalTables(allData) {
              // 1. Calculate base data
              let stats = {
                  units: {}, // tip -> { year: count }
                  costByType: {}, // tip -> { year: cost }
                  costBySegment: {}, // segment -> { year: cost }
                  interventions: {} // tip -> { year: count }
              };
              
              let allTypes = new Set();
              let allSegments = new Set();
              
              // We need to count unique vehicles per type per year.
              let uniqueVehicles = {}; // type -> year -> set of garazniBroj/reg
              
              allData.forEach(item => {
                  let y = item.year;
                  if (y < 2021 || y > 2026) return; // Only 2021-2026
                  
                  let tip = item.tipMehan || "Nepoznato";
                  let seg = item.segment || "Nepoznato";
                  let vozilo = item.garazniBroj || item.reg || "Nepoznato";
                  
                  allTypes.add(tip);
                  allSegments.add(seg);
                  
                  // Init structures
                  if (!stats.costByType[tip]) stats.costByType[tip] = {};
                  if (!stats.costByType[tip][y]) stats.costByType[tip][y] = 0;
                  
                  if (!stats.costBySegment[seg]) stats.costBySegment[seg] = {};
                  if (!stats.costBySegment[seg][y]) stats.costBySegment[seg][y] = 0;
                  
                  if (!stats.interventions[tip]) stats.interventions[tip] = {};
                  if (!stats.interventions[tip][y]) stats.interventions[tip][y] = 0;
                  
                  if (!uniqueVehicles[tip]) uniqueVehicles[tip] = {};
                  if (!uniqueVehicles[tip][y]) uniqueVehicles[tip][y] = new Set();
                  
                  // Add data
                  stats.costByType[tip][y] += item.cost;
                  stats.costBySegment[seg][y] += item.cost;
                  stats.interventions[tip][y] += 1;
                  uniqueVehicles[tip][y].add(vozilo);
              });
              
              // Populate units count from uniqueVehicles
              for (let tip in uniqueVehicles) {
                  stats.units[tip] = {};
                  for (let y in uniqueVehicles[tip]) {
                      stats.units[tip][y] = uniqueVehicles[tip][y].size;
                  }
              }
              
              // Helper to calculate YoY %
              function calcYoy(curr, prev) {
                  if (!prev || prev === 0) return "-";
                  let val = (curr - prev) / prev;
                  return (val * 100).toFixed(1) + "%";
              }
              
              // Helper to color YoY %
              // isCost = true -> green if negative (savings). false -> green if positive (growth).
              function formatYoyHtml(val, isCost) {
                  if (val === "-") return '<span class="text-slate-400">-</span>';
                  let num = parseFloat(val);
                  if (num === 0) return '<span class="text-slate-500">0.0%</span>';
                  
                  let isPositive = num > 0;
                  let colorClass = "";
                  
                  if (isCost) {
                      colorClass = isPositive ? "text-red-600 font-bold" : "text-emerald-600 font-bold";
                  } else {
                      colorClass = isPositive ? "text-emerald-600 font-bold" : "text-red-600 font-bold";
                  }
                  
                  let prefix = isPositive ? "+" : "";
                  return \`<span class="\${colorClass}">\${prefix}\${val}</span>\`;
              }
              
              // Render a specific table
              function generateTableHTML(rowKeys, dataObj, isCost, totalLabel = "Grand Total") {
                  let html = "";
                  let totals = { 2021:0, 2022:0, 2023:0, 2024:0, 2025:0, 2026:0 };
                  
                  Array.from(rowKeys).sort().forEach(key => {
                      let r21 = dataObj[key][2021] || 0;
                      let r22 = dataObj[key][2022] || 0;
                      let r23 = dataObj[key][2023] || 0;
                      let r24 = dataObj[key][2024] || 0;
                      let r25 = dataObj[key][2025] || 0;
                      let r26 = dataObj[key][2026] || 0;
                      
                      totals[2021] += r21; totals[2022] += r22; totals[2023] += r23;
                      totals[2024] += r24; totals[2025] += r25; totals[2026] += r26;
                      
                      let v21 = isCost ? r21.toLocaleString('bs-BA',{minimumFractionDigits:2, maximumFractionDigits:2}) : r21;
                      let v22 = isCost ? r22.toLocaleString('bs-BA',{minimumFractionDigits:2, maximumFractionDigits:2}) : r22;
                      let v23 = isCost ? r23.toLocaleString('bs-BA',{minimumFractionDigits:2, maximumFractionDigits:2}) : r23;
                      let v24 = isCost ? r24.toLocaleString('bs-BA',{minimumFractionDigits:2, maximumFractionDigits:2}) : r24;
                      let v25 = isCost ? r25.toLocaleString('bs-BA',{minimumFractionDigits:2, maximumFractionDigits:2}) : r25;
                      let v26 = isCost ? r26.toLocaleString('bs-BA',{minimumFractionDigits:2, maximumFractionDigits:2}) : r26;
                      
                      html += \`
                          <tr class="hover:bg-slate-50 transition-colors">
                              <td class="py-2.5 px-4 font-semibold text-slate-700">\${key}</td>
                              <td class="py-2.5 px-4 \${isCost?'text-right':'text-center'}">\${v21}</td>
                              <td class="py-2.5 px-4 \${isCost?'text-right':'text-center'}">\${v22}</td>
                              <td class="py-2.5 px-4 \${isCost?'text-right':'text-center'}">\${v23}</td>
                              <td class="py-2.5 px-4 \${isCost?'text-right':'text-center'}">\${v24}</td>
                              <td class="py-2.5 px-4 \${isCost?'text-right':'text-center'}">\${v25}</td>
                              <td class="py-2.5 px-4 \${isCost?'text-right':'text-center'} font-bold">\${v26}</td>
                              <td class="py-2.5 px-4 text-right bg-slate-50/50">\${formatYoyHtml(calcYoy(r22, r21), isCost)}</td>
                              <td class="py-2.5 px-4 text-right bg-slate-50/50">\${formatYoyHtml(calcYoy(r23, r22), isCost)}</td>
                              <td class="py-2.5 px-4 text-right bg-slate-50/50">\${formatYoyHtml(calcYoy(r24, r23), isCost)}</td>
                              <td class="py-2.5 px-4 text-right bg-slate-50/50">\${formatYoyHtml(calcYoy(r25, r24), isCost)}</td>
                              <td class="py-2.5 px-4 text-right bg-slate-50/50">\${formatYoyHtml(calcYoy(r26, r25), isCost)}</td>
                              <td class="py-2.5 px-4 text-right bg-indigo-50/50 font-bold border-l border-indigo-100/50">\${formatYoyHtml(calcYoy(r26, r21), isCost)}</td>
                          </tr>
                      \`;
                  });
                  
                  // Total Row
                  let t21 = isCost ? totals[2021].toLocaleString('bs-BA',{minimumFractionDigits:2, maximumFractionDigits:2}) : totals[2021];
                  let t22 = isCost ? totals[2022].toLocaleString('bs-BA',{minimumFractionDigits:2, maximumFractionDigits:2}) : totals[2022];
                  let t23 = isCost ? totals[2023].toLocaleString('bs-BA',{minimumFractionDigits:2, maximumFractionDigits:2}) : totals[2023];
                  let t24 = isCost ? totals[2024].toLocaleString('bs-BA',{minimumFractionDigits:2, maximumFractionDigits:2}) : totals[2024];
                  let t25 = isCost ? totals[2025].toLocaleString('bs-BA',{minimumFractionDigits:2, maximumFractionDigits:2}) : totals[2025];
                  let t26 = isCost ? totals[2026].toLocaleString('bs-BA',{minimumFractionDigits:2, maximumFractionDigits:2}) : totals[2026];
                  
                  html += \`
                      <tr class="bg-slate-100 font-extrabold text-slate-800 border-t-2 border-slate-200">
                          <td class="py-3 px-4 uppercase text-xs">\${totalLabel}</td>
                          <td class="py-3 px-4 \${isCost?'text-right':'text-center'}">\${t21}</td>
                          <td class="py-3 px-4 \${isCost?'text-right':'text-center'}">\${t22}</td>
                          <td class="py-3 px-4 \${isCost?'text-right':'text-center'}">\${t23}</td>
                          <td class="py-3 px-4 \${isCost?'text-right':'text-center'}">\${t24}</td>
                          <td class="py-3 px-4 \${isCost?'text-right':'text-center'}">\${t25}</td>
                          <td class="py-3 px-4 \${isCost?'text-right':'text-center'} text-indigo-700">\${t26}</td>
                          <td class="py-3 px-4 text-right bg-slate-200/50">\${formatYoyHtml(calcYoy(totals[2022], totals[2021]), isCost)}</td>
                          <td class="py-3 px-4 text-right bg-slate-200/50">\${formatYoyHtml(calcYoy(totals[2023], totals[2022]), isCost)}</td>
                          <td class="py-3 px-4 text-right bg-slate-200/50">\${formatYoyHtml(calcYoy(totals[2024], totals[2023]), isCost)}</td>
                          <td class="py-3 px-4 text-right bg-slate-200/50">\${formatYoyHtml(calcYoy(totals[2025], totals[2024]), isCost)}</td>
                          <td class="py-3 px-4 text-right bg-slate-200/50">\${formatYoyHtml(calcYoy(totals[2026], totals[2025]), isCost)}</td>
                          <td class="py-3 px-4 text-right bg-indigo-100 text-indigo-800">\${formatYoyHtml(calcYoy(totals[2026], totals[2021]), isCost)}</td>
                      </tr>
                  \`;
                  return html;
              }
              
              document.getElementById('kpiTableUnits').innerHTML = generateTableHTML(allTypes, stats.units, false);
              document.getElementById('kpiTableCostByType').innerHTML = generateTableHTML(allTypes, stats.costByType, true);
              document.getElementById('kpiTableCostBySegment').innerHTML = generateTableHTML(allSegments, stats.costBySegment, true);
              document.getElementById('kpiTableInterventions').innerHTML = generateTableHTML(allTypes, stats.interventions, false);`;

    content = content.replace(target, injection);
    fs.writeFileSync('dashboard12_troskova.html', content, 'latin1');
    console.log("Success");
} catch(e) {
    console.error(e);
}
