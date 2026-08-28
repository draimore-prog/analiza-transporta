const fs = require('fs');

try {
    let content = fs.readFileSync('dashboard12_troskova.html', 'latin1');
    const target = `<!-- ================= TAB 3`;
    const injection = `
              <!-- ================= KPI TOTAL SECTION (2021-2026) ================= -->
              <div class="mt-10 pt-8 border-t-2 border-slate-200/60">
                  <div class="mb-6">
                      <h2 class="text-xl font-black text-slate-800 flex items-center gap-2">
                          <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                          <span>Dugoroèni KPI (Pregled trendova kroz godine)</span>
                      </h2>
                      <p class="text-sm text-slate-500 mt-1">Strateški pregled promjena od 2021. do 2026. godine na osnovu cjelokupne baze (svi podaci).</p>
                  </div>
                  
                  <div class="grid grid-cols-1 gap-8">
                      
                      <!-- 1. Broj jedinica kroz godine po tipu -->
                      <div class="card overflow-hidden shadow-sm border border-slate-200">
                          <div class="p-4 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
                              <h3 class="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                                  <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                  Broj jedinica (vozila/mehanizacije) kroz godine po tipu
                              </h3>
                          </div>
                          <div class="overflow-x-auto">
                              <table class="min-w-full text-xs text-left">
                                  <thead class="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                                      <tr>
                                          <th class="py-3 px-4">Tip Vozila</th>
                                          <th class="py-3 px-4 text-center">2021</th><th class="py-3 px-4 text-center">2022</th>
                                          <th class="py-3 px-4 text-center">2023</th><th class="py-3 px-4 text-center">2024</th>
                                          <th class="py-3 px-4 text-center">2025</th><th class="py-3 px-4 text-center">2026</th>
                                          <th class="py-3 px-4 text-right bg-slate-100/50">21/22 (%)</th><th class="py-3 px-4 text-right bg-slate-100/50">22/23 (%)</th>
                                          <th class="py-3 px-4 text-right bg-slate-100/50">23/24 (%)</th><th class="py-3 px-4 text-right bg-slate-100/50">24/25 (%)</th>
                                          <th class="py-3 px-4 text-right bg-slate-100/50">25/26 (%)</th><th class="py-3 px-4 text-right bg-indigo-50/50">21/26 (%)</th>
                                      </tr>
                                  </thead>
                                  <tbody id="kpiTableUnits" class="divide-y divide-slate-100"></tbody>
                              </table>
                          </div>
                      </div>

                      <!-- 2. Trošak po tipu mehanizacije kroz godine -->
                      <div class="card overflow-hidden shadow-sm border border-slate-200">
                          <div class="p-4 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
                              <h3 class="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                                  <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                  Trošak po tipu mehanizacije kroz godine
                              </h3>
                          </div>
                          <div class="overflow-x-auto">
                              <table class="min-w-full text-xs text-left">
                                  <thead class="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                                      <tr>
                                          <th class="py-3 px-4">Tip Vozila</th>
                                          <th class="py-3 px-4 text-right">2021</th><th class="py-3 px-4 text-right">2022</th>
                                          <th class="py-3 px-4 text-right">2023</th><th class="py-3 px-4 text-right">2024</th>
                                          <th class="py-3 px-4 text-right">2025</th><th class="py-3 px-4 text-right">2026</th>
                                          <th class="py-3 px-4 text-right bg-slate-100/50">21/22 (%)</th><th class="py-3 px-4 text-right bg-slate-100/50">22/23 (%)</th>
                                          <th class="py-3 px-4 text-right bg-slate-100/50">23/24 (%)</th><th class="py-3 px-4 text-right bg-slate-100/50">24/25 (%)</th>
                                          <th class="py-3 px-4 text-right bg-slate-100/50">25/26 (%)</th><th class="py-3 px-4 text-right bg-indigo-50/50">21/26 (%)</th>
                                      </tr>
                                  </thead>
                                  <tbody id="kpiTableCostByType" class="divide-y divide-slate-100"></tbody>
                              </table>
                          </div>
                      </div>

                      <!-- 3. Trošak po segmentu kroz godine -->
                      <div class="card overflow-hidden shadow-sm border border-slate-200">
                          <div class="p-4 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
                              <h3 class="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                                  <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
                                  Trošak po segmentu kroz godine
                              </h3>
                          </div>
                          <div class="overflow-x-auto">
                              <table class="min-w-full text-xs text-left">
                                  <thead class="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                                      <tr>
                                          <th class="py-3 px-4">Segment</th>
                                          <th class="py-3 px-4 text-right">2021</th><th class="py-3 px-4 text-right">2022</th>
                                          <th class="py-3 px-4 text-right">2023</th><th class="py-3 px-4 text-right">2024</th>
                                          <th class="py-3 px-4 text-right">2025</th><th class="py-3 px-4 text-right">2026</th>
                                          <th class="py-3 px-4 text-right bg-slate-100/50">21/22 (%)</th><th class="py-3 px-4 text-right bg-slate-100/50">22/23 (%)</th>
                                          <th class="py-3 px-4 text-right bg-slate-100/50">23/24 (%)</th><th class="py-3 px-4 text-right bg-slate-100/50">24/25 (%)</th>
                                          <th class="py-3 px-4 text-right bg-slate-100/50">25/26 (%)</th><th class="py-3 px-4 text-right bg-indigo-50/50">21/26 (%)</th>
                                      </tr>
                                  </thead>
                                  <tbody id="kpiTableCostBySegment" class="divide-y divide-slate-100"></tbody>
                              </table>
                          </div>
                      </div>

                      <!-- 4. Broj intervencija kroz godine -->
                      <div class="card overflow-hidden shadow-sm border border-slate-200">
                          <div class="p-4 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
                              <h3 class="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                                  <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                  Broj opravki (intervencija) kroz godine po tipu
                              </h3>
                          </div>
                          <div class="overflow-x-auto">
                              <table class="min-w-full text-xs text-left">
                                  <thead class="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                                      <tr>
                                          <th class="py-3 px-4">Tip Vozila</th>
                                          <th class="py-3 px-4 text-center">2021</th><th class="py-3 px-4 text-center">2022</th>
                                          <th class="py-3 px-4 text-center">2023</th><th class="py-3 px-4 text-center">2024</th>
                                          <th class="py-3 px-4 text-center">2025</th><th class="py-3 px-4 text-center">2026</th>
                                          <th class="py-3 px-4 text-right bg-slate-100/50">21/22 (%)</th><th class="py-3 px-4 text-right bg-slate-100/50">22/23 (%)</th>
                                          <th class="py-3 px-4 text-right bg-slate-100/50">23/24 (%)</th><th class="py-3 px-4 text-right bg-slate-100/50">24/25 (%)</th>
                                          <th class="py-3 px-4 text-right bg-slate-100/50">25/26 (%)</th><th class="py-3 px-4 text-right bg-indigo-50/50">21/26 (%)</th>
                                      </tr>
                                  </thead>
                                  <tbody id="kpiTableInterventions" class="divide-y divide-slate-100"></tbody>
                              </table>
                          </div>
                      </div>
                      
                  </div>
              </div>
              <!-- ================= TAB 3`;

    content = content.replace(target, injection);
    fs.writeFileSync('dashboard12_troskova.html', content, 'latin1');
    console.log("Success");
} catch(e) {
    console.error(e);
}
