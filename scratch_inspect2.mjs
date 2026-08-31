import fs from 'fs';

const html = fs.readFileSync('v1_reference.html', 'utf8');

// Let's get header
const headerStart = html.indexOf('<header');
const headerEnd = html.indexOf('</header>');
if (headerStart !== -1 && headerEnd !== -1) {
  console.log('HEADER:\n', html.substring(headerStart, headerEnd + 9));
}

// Let's get sidebar
const asideStart = html.indexOf('<aside');
const asideEnd = html.indexOf('</aside>');
if (asideStart !== -1 && asideEnd !== -1) {
  console.log('SIDEBAR LENGTH:\n', (asideEnd - asideStart));
  fs.writeFileSync('v1_sidebar.html', html.substring(asideStart, asideEnd + 8));
}
