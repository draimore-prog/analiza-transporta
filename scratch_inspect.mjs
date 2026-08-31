import fs from 'fs';

const html = fs.readFileSync('v1_reference.html', 'utf8');

// Extract stylesheet and head styles
const styleStart = html.indexOf('<style>');
const styleEnd = html.indexOf('</style>');
const styles = html.substring(styleStart, styleEnd + 8);
console.log('STYLES LENGTH:', styles.length);

// Let's find each tab content in V1
const tabMatches = [];
let re = /id="(tabContent\d|warehouseTab\d|tab-\d|whTab\d|whContent\d|tab\dContent)"/g;
let m;
while ((m = re.exec(html)) !== null) {
  tabMatches.push({ id: m[1], index: m.index });
}
console.log('TAB MATCHES:', tabMatches);

// Let's also check all sections in <main>
const mainStart = html.indexOf('<main');
const mainEnd = html.indexOf('</main>');
const mainContent = html.substring(mainStart, mainEnd + 7);
console.log('MAIN CONTENT LENGTH:', mainContent.length);

// Save main content for detailed extraction
fs.writeFileSync('v1_main_content.html', mainContent);
console.log('Saved v1_main_content.html');
