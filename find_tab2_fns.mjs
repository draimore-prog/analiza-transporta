import fs from 'fs';

const html = fs.readFileSync('public/v1.html', 'utf8');

['changeTab2Year', 'setFleetMode', 'tab2YearSelect', 'tab2DailyTitle', 'renderMultiYearMatrices'].forEach(term => {
  let idx = 0;
  while ((idx = html.indexOf(term, idx)) !== null && idx !== -1) {
    console.log(`Found ${term} at char ${idx}`);
    console.log(html.substring(idx - 50, idx + 400));
    console.log('---------------------------------');
    idx += term.length;
  }
});
