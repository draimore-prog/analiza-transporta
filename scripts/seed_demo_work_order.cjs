const https = require('https');

const PROJECT_ID = 'analiza-transporta-flota';

function sendRequest(pathUrl, method = 'POST', bodyData = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'firestore.googleapis.com',
            path: pathUrl,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (bodyData) {
            options.headers['Content-Length'] = Buffer.byteLength(bodyData);
        }
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(body ? JSON.parse(body) : {});
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                }
            });
        });
        req.on('error', reject);
        if (bodyData) req.write(bodyData);
        req.end();
    });
}

async function main() {
    console.log("=== SEEDING DEMO WORK ORDER U FIRESTORE (warehouse_work_orders) ===");

    const docId = 'rn-sm-2026-0001';
    const fullPath = `projects/${PROJECT_ID}/databases/(default)/documents/warehouse_work_orders/${docId}`;

    const documentData = {
        name: fullPath,
        fields: {
            orderNumber: { stringValue: "RN-SM-2026-0001" },
            status: { stringValue: "completed" },
            type: { stringValue: "preventive" },
            priority: { stringValue: "normal" },
            createdAt: { stringValue: new Date().toISOString() },
            assignedTo: { stringValue: "Mirnes Hasić" },
            createdBy: { stringValue: "Emir Duraković" },
            vehicleId: { stringValue: "SM-042" },
            vehicleDetails: {
                mapValue: {
                    fields: {
                        tip: { stringValue: "Regalni viljuškar" },
                        proizvodjac: { stringValue: "Jungheinrich" },
                        model: { stringValue: "ETV 214" },
                        serijskiBroj: { stringValue: "91045231" },
                        lokacija: { stringValue: "PJ Centralno Skladište Sarajevo" }
                    }
                }
            },
            workHours: { integerValue: "4820" },
            checklist: {
                mapValue: {
                    fields: {
                        wheels: {
                            mapValue: {
                                fields: {
                                    status: { stringValue: "ok" },
                                    label: { stringValue: "Točkovi i gume" }
                                }
                            }
                        },
                        mast_forks: {
                            mapValue: {
                                fields: {
                                    status: { stringValue: "ok" },
                                    label: { stringValue: "Kran, viljuške i lanci" }
                                }
                            }
                        },
                        battery: {
                            mapValue: {
                                fields: {
                                    status: { stringValue: "ok" },
                                    label: { stringValue: "Baterija i punjač" }
                                }
                            }
                        },
                        hydraulics: {
                            mapValue: {
                                fields: {
                                    status: { stringValue: "issue" },
                                    label: { stringValue: "Hidraulika i ulje" },
                                    note: { stringValue: "Uočeno blago vlaženje na gornjem spoju crijeva podizanja krana. Crijevo dotegnuto i očišćeno." }
                                }
                            }
                        },
                        brakes: {
                            mapValue: {
                                fields: {
                                    status: { stringValue: "ok" },
                                    label: { stringValue: "Kočioni sistem" }
                                }
                            }
                        },
                        steering_electronics: {
                            mapValue: {
                                fields: {
                                    status: { stringValue: "ok" },
                                    label: { stringValue: "Ruda i elektronika" }
                                }
                            }
                        },
                        chassis_seat: {
                            mapValue: {
                                fields: {
                                    status: { stringValue: "ok" },
                                    label: { stringValue: "Šasija i sjedište" }
                                }
                            }
                        },
                        safety_signals: {
                            mapValue: {
                                fields: {
                                    status: { stringValue: "ok" },
                                    label: { stringValue: "Signalizacija i sigurnost" }
                                }
                            }
                        }
                    }
                }
            },
            workDescription: { stringValue: "Izvršen kompletan redovni preventivni pregled jedinice. Zamijenjen prednji desni vodeći točkić krana (85mm), očišćeni terminali baterije, dotočena 2 litra hidrauličnog ulja HD46." },
            usedMaterials: { stringValue: "1x Vodeći točkić krana 85mm poliuretan, 2L Hidraulično ulje HD46, 1x Sprej za odmašćivanje" },
            photos: {
                mapValue: {
                    fields: {
                        front: { stringValue: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80" },
                        back: { stringValue: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80" },
                        left: { stringValue: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80" },
                        right: { stringValue: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80" },
                        interior: { stringValue: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80" }
                    }
                }
            },
            notes: { stringValue: "Jedinica vraćena u operativan i siguran rad." }
        }
    };

    const writes = [
        {
            update: documentData
        }
    ];

    const res = await sendRequest(`/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit`, 'POST', JSON.stringify({ writes }));
    console.log("Uspješno upisan demo nalog u Firestore:", JSON.stringify(res));
}

main().catch(err => {
    console.error("Greška pri upisu:", err);
});
