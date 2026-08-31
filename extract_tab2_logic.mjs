import fs from 'fs';

const html = fs.readFileSync('public/v1.html', 'utf8');
const snippet = html.substring(405000, 415000);
fs.writeFileSync('v1_tab2_logic.js', snippet, 'utf8');
console.log('Saved v1_tab2_logic.js length:', snippet.length);
