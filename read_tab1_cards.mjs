import fs from 'fs';

const html = fs.readFileSync('public/v1.html', 'utf8');
const tab1Idx = html.indexOf('id="tabContent1"');
const tab2Idx = html.indexOf('id="tabContent2"');
console.log(html.substring(tab1Idx, tab1Idx + 2500));
