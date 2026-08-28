const fs = require('fs');
let content = fs.readFileSync('dashboard12_troskova.html', 'latin1');
const re = /const emailVal([^\n]*)\r?\n\s*try\s*\{\r?\n\s*let emailToUse = (.*?);/m;
const replacement = 'const emailVal$1\n            let emailToUse = $2;\n            try {';
content = content.replace(re, replacement);
fs.writeFileSync('dashboard12_troskova.html', content, 'latin1');
