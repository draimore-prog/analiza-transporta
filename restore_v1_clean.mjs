import { execSync } from 'child_process';
import fs from 'fs';

console.log('Extracting clean UTF-8 dashboard from 1dc8db3:dashboard12_troskova.html...');
const buf = execSync('git show 1dc8db3:dashboard12_troskova.html', { maxBuffer: 50 * 1024 * 1024 });
let content = buf.toString('utf8');

console.log('Clean check:');
console.log('- Održavanje:', content.includes('Održavanje'));
console.log('- Skladišna:', content.includes('Skladišna'));
console.log('- Šifrarnik:', content.includes('Šifrarnik'));
console.log('- Nadzorna ploča:', content.includes('Nadzorna ploča'));

// Add return to Next.js button into header
const hIdx = content.indexOf('<header');
const endH = content.indexOf('</header>');
if (hIdx !== -1 && endH !== -1) {
  const headerContent = content.substring(hIdx, endH + 9);
  const newHeaderContent = headerContent.replace(
    '<div class="flex items-center gap-3">',
    '<div class="flex items-center gap-3">\n                <a href="/" class="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-3 py-2 rounded-lg transition-all text-xs flex items-center gap-1.5 shadow-sm border border-indigo-700 cursor-pointer">\n                    <span>⚡ Nova Verzija (Next.js)</span>\n                </a>'
  );
  content = content.substring(0, hIdx) + newHeaderContent + content.substring(endH + 9);
}

fs.writeFileSync('public/v1.html', content, 'utf8');
console.log('Successfully wrote clean public/v1.html! File size:', fs.statSync('public/v1.html').size);
