function calculateDynamic2026() {
            let data26 = {
                units: { "Priključno": 51, "Putničko": 119, "Radna mašina": 8, "Servis motornih vozila": 0, "Skladišna mehanizacija": 594, "Teretno": 166 },
                typeCost: { "Priključno":0, "Putničko":0, "Radna mašina":0, "Servis motornih vozila":0, "Skladišna mehanizacija":0, "Teretno":0 },
                segmentCost: { "Elektronika":0, "Guma":0, "Hidraulika":0, "Mehanika":0, "Redovan servis":0, "Signalizacija":0, "Tečnost":0 },
                interventions: { "Priključno":0, "Putničko":0, "Radna mašina":0, "Servis motornih vozila":0, "Skladišna mehanizacija":0, "Teretno":0 }
            };
            // 1. Broj jedinica se cita iz Master Fleet-a (Samo AKTIVNA vozila)
            if (typeof masterFleetData !== 'undefined' && masterFleetData.length > 0) {
                masterFleetData.forEach(v => {
                    let status = (v.status || '').toLowerCase();
                    if (status && status !== 'aktivno') return; // Preskoči prodata i rashodovana!
                    let type = (v.tipMehan || v.tipMehanizacije || '').trim();
                    if (type === "Putnicko" || type === "Putnička vozila" || type === "Putničko") data26.units["Putničko"]++;
                    else if (type === "Radna masina" || type === "Radna mašina") data26.units["Radna mašina"]++;
                    else if (type === "Skladisna mehanizacija" || type === "Skladišna mehanizacija") data26.units["Skladišna mehanizacija"]++;
                    else if (type === "Prikljucno" || type === "Priključna vozila" || type === "Priključno") data26.units["Priključno"]++;
                    else if (type === "Teretna vozila" || type === "Teretno") data26.units["Teretno"]++;
                    else if (type === "Servis motornih vozila") data26.units["Servis motornih vozila"]++;
                });
            }
            // 2. Troskovi i intervencije iz globalData (odrzavanje)
            if (typeof globalData !== 'undefined') {
                globalData.forEach(item => {
                    let y = item.year;
                    if (y === 2026) {
                        let type = (item.tipMehan || item['Tip vozila'] || '').trim();
                        let cost = parseFloat(item.cost || item['Iznos bez PDV'] || item['Iznos bez PDV-a'] || 0) || 0;
                        let segment = (item.segment || item['Segment'] || '').trim();
                        // Mapiranja tipa mehanizacije
                        if (type === "Putnicko" || type === "Putnička vozila") type = "Putničko";
                        else if (type === "Radna masina") type = "Radna mašina";
                        else if (type === "Skladisna mehanizacija") type = "Skladišna mehanizacija";
                        else if (type === "Prikljucno" || type === "Priključna vozila") type = "Priključno";
                        else if (type === "Teretna vozila") type = "Teretno";
                        // Normalizacija segmenta - u slučaju da fali slovo
                        if (segment === "Tecnost") segment = "Tečnost";
                        
                        if (data26.typeCost.hasOwnProperty(type)) {
                            data26.typeCost[type] += cost;
                            data26.interventions[type]++;
                        } else {
                            // Ukoliko se desi tip koji nije obuhvaćen, dodaj u prvo (samo da bi Grand Total bio tačan, mada se ne bi trebalo desiti)
                            data26.typeCost["Putničko"] += cost; 
                            data26.interventions["Putničko"]++;
                        }
                        
                        if (data26.segmentCost.hasOwnProperty(segment)) {
                            data26.segmentCost[segment] += cost;
                        } else {
                            // Ukoliko je prazan segment ili neprepoznat, zbroji pod "Ostalo" (stvorićemo ga dinamički) ili u postojeći da bi suma šti