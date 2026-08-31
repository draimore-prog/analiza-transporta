import fs from 'fs';

const html = fs.readFileSync('public/v1.html', 'utf8');

// Extract tabContent2
const t2Start = html.indexOf('id="tabContent2"');
const t3Start = html.indexOf('id="tabContent3"');
const t4Start = html.indexOf('id="tabContent4"');

console.log('--- TAB 2 (Analiza Održavanja) ---');
const tab2Html = html.substring(html.lastIndexOf('<div', t2Start), html.lastIndexOf('<div', t3Start));
console.log('Length of Tab 2:', tab2Html.length);
fs.writeFileSync('v1_tab2_raw.html', tab2Html, 'utf8');

console.log('--- TAB 3 (YoY Komparacija) ---');
const tab3Html = html.substring(html.lastIndexOf('<div', t3Start), html.lastIndexOf('<div', t4Start));
console.log('Length of Tab 3:', tab3Html.length);
fs.writeFileSync('v1_tab3_raw.html', tab3Html, 'utf8');

// Also extract JS functions related to Tab 2 and Tab 3
console.log('\n--- JS FUNCTIONS FOR TAB 2 & TAB 3 ---');
const jsMatches = [];
['renderComparisonGrid', 'renderMultiYearMatrices', 'renderLongTermKPI', 'drawChartsTab1', 'calculateDynamic2026'].forEach(fn => {
  const fnIdx = html.indexOf(`function ${fn}`);
  if (fnIdx !== -1) {
    const fnBody = html.substring(fnIdx, fnIdx + 4000);
    console.log(`Found ${fn}: length ~${fnBody.length}`);
    fs.writeFileSync(`v1_fn_${fn}.js`, fnBody, 'utf8');
  }
});
