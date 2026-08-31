const fs = require('fs');
const html = fs.readFileSync('v1_reference.html', 'utf8');

// Extract stylesheet and head styles
const styleStart = html.indexOf('<style>');
const styleEnd = html.indexOf('</style>');
const styles = html.substring(styleStart, styleEnd + 8);
console.log('STYLES LENGTH:', styles.length);

// Let's find each tab content in V1
const tabMatches = [];
let re = /id="(tabContent\d|warehouseContent\d|tab\d|whContent\d|contentTab\d)"/g;
let m;
while ((m = re.exec(html)) !== null) {
  tabMatches.push({ id: m[1], index: m.index });
}
console.log('TAB MATCHES:', tabMatches);
