import fs from 'fs';

const html = fs.readFileSync('v1_main_content.html', 'utf8');

// Find all tab divs
const tabs = ['tabContent1', 'tabContent2', 'tabContent3', 'tabContent4', 'tabContent5'];
tabs.forEach((tabId, idx) => {
  const start = html.indexOf(`id="${tabId}"`);
  if (start !== -1) {
    const nextStart = idx < tabs.length - 1 ? html.indexOf(`id="${tabs[idx + 1]}"`) : html.length;
    const tabHtml = html.substring(start - 5, nextStart);
    fs.writeFileSync(`v1_${tabId}.html`, tabHtml);
    console.log(`Saved v1_${tabId}.html (length: ${tabHtml.length})`);
  }
});
