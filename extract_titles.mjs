import fs from 'fs';

const html = fs.readFileSync('public/v1.html', 'utf8');

// Title
const titleMatch = html.match(/<title>(.*?)<\/title>/i);
console.log('--- DOCUMENT TITLE ---');
console.log(titleMatch ? titleMatch[1] : 'None');

// Sidebar nav
const navStart = html.indexOf('<nav');
const navEnd = html.indexOf('</nav>');
console.log('\n--- SIDEBAR NAV CONTENT IN V1 ---');
console.log(html.substring(navStart, navEnd + 6));

// Tab headings
['tabContent1', 'tabContent2', 'tabContent3', 'tabContent4', 'tabContent5', 'whTabContent1', 'whTabContent2', 'whTabContent3', 'whTabContent4', 'whTabContent5'].forEach(t => {
  const idx = html.indexOf(`id="${t}"`);
  if (idx !== -1) {
    console.log(`\n--- HEADING OF ${t} ---`);
    console.log(html.substring(idx, idx + 400));
  }
});
