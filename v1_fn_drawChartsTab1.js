function drawChartsTab1(trendData, intCost, extCost, byVehicle, bySegment, bySupplier, isAllYears, trendMode, selectedYear, selectedMonth, internalCostByYear = {}) {
            if(chartTrend) chartTrend.destroy(); if(chartIntExt) chartIntExt.destroy(); if(chartVehicles) chartVehicles.destroy(); if(chartSegments) chartSegments.destroy(); if(chartSuppliers) chartSuppliers.destroy();
            const ctx1 = document.getElementById('chartTrend').getContext('2d');
            if (trendMode === 'yoy') {
                document.getElementById('title-trend').innerText = 'Poređenje svih godina po mjesecima (YoY Trend)';
                let datasets = [], colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'], colorIdx = 0;
                Object.keys(trendData).sort().forEach(year => {
                    let monthData = []; for(let i=1; i<=12; i++) monthData.push(trendData[year][i]);
                    datasets.push({ label: year.toString(), data: monthData, borderColor: colors[colorIdx % colors.length], backgroundColor: 'transparent', tension: 0.3, borderWidth: 2.5 });
                    colorIdx++;
                });
                chartTrend = new Chart(ctx1, { type: 'line', data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'], datasets: datasets }, options: { responsive: true, maintainAspectRatio: false } });
            
            } else if (trendMode === 'monthly') {
                document.getElementById('title-trend').innerText = `Interno vs Eksterno troškovi po mjesecima (${selectedYear}. godina)`;
                let months = Object.keys(trendData).sort((a,b) => parseInt(a) - parseInt(b));
                chartTrend = new Chart(ctx1, {
                    type: 'bar',
                    data: { labels: months.map(m => m + '. mjesec'), datasets: [{ label: 'Interno', data: months.map(m => trendData[m].Interno), backgroundColor: '#2563eb' }, { label: 'Eksterno', data: months.map(m => trendData[m].Eksterno), backgroundColor: '#f59e0b' }] },
                    options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }
                });
            } else if (trendMode === 'daily') {
                let targetYear = parseInt(selectedYear);
                let targetMonth = parseInt(selectedMonth);
                let daysCount = new Date(targetYear, targetMonth, 0).getDate();
                document.getElementById('title-trend').innerText = `Dnevna dinamika i trend po danima (${selectedMonth}.${selectedYear}. | 1 - ${daysCount}. dan)`;
                
                let dayLabels = [], intArr = [], extArr = [];
                for (let d = 1; d <= daysCount; d++) {
                    dayLabels.push(`${d}.${selectedMonth}.`);
                    intArr.push(trendData[d] ? trendData[d].Interno : 0);
                    extArr.push(trendData[d] ? trendData[d].Eksterno : 0);
                }
                chartTrend = new Chart(ctx1, {
                    type: 'bar',
                    data: {
                        labels: dayLabels,
                        datasets: [
                            { label: 'Interno', data: intArr, backgroundColor: '#2563eb' },
                            { label: 'Eksterno', data: extArr, backgroundColor: '#f59e0b' }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: { x: { stacked: true }, y: { stacked: true } }
                    }
                });
            } else if (trendMode === 'sameMonthYoY') {
                document.getElementById('title-trend').innerText = `Poređenje ${selectedMonth}. mjeseca kroz sve godine (2021 - 2026)`;
                let years = Object.keys(trendData).sort((a,b) => parseInt(a) - parseInt(b));
                chartTrend = new Chart(ctx1, {
                    type: