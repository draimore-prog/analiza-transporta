const https = require('https');

const PROJECT_ID = 'analiza-transporta-flota';
const FIRESTORE_URL = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/serviser_push_tokens`;

function getFirestoreTokens() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'firestore.googleapis.com',
      path: FIRESTORE_URL,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const docs = json.documents || [];
          const tokens = [];
          for (const doc of docs) {
            const fields = doc.fields || {};
            const t = fields.token?.stringValue;
            if (t) tokens.push(t);
          }
          resolve(tokens);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function sendExpoPush(messages) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(messages);
    const options = {
      hostname: 'exp.host',
      path: '/--/api/v2/push/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log("=== SLANJE TESTNE PUSH NOTIFIKACIJE ===");
  console.log("1. Preuzimam registrovane Expo push tokene iz Firestore baze...");

  const tokens = await getFirestoreTokens();
  console.log(`Pronađeno tokena u bazi: ${tokens.length}`);
  tokens.forEach((t, i) => console.log(` [${i + 1}] ${t}`));

  if (tokens.length === 0) {
    console.log("⚠️ Nema registrovanih tokena u bazi. Otvorite mobilnu aplikaciju jednom kako bi se token automatski registrovao.");
    return;
  }

  const customBody = process.argv[2] || "Sistem notifikacija radi 100% ispravno! Visoki prioritet, zvuk i buđenje ekrana su aktivni.";
  const customTitle = process.argv[3] || "🔔 BINGO MOTORFIX";

  const messages = tokens.map((to) => ({
    to,
    title: customTitle,
    body: customBody,
    sound: "default",
    priority: "high",
    channelId: "radni-nalozi-channel",
    badge: 1,
    ttl: 2419200,
    android: {
      channelId: "radni-nalozi-channel",
      priority: "high",
      sound: "default",
      vibrate: [0, 500, 200, 500, 200, 500]
    },
    data: {
      type: "TEST_NOTIFICATION",
      messageText: customBody,
      timestamp: new Date().toISOString()
    }
  }));

  console.log("\n2. Šaljem visoko-prioritetne poruke na Expo Push Gateway...");
  const result = await sendExpoPush(messages);
  console.log("Odgovor Expo Gateway-a:", JSON.stringify(result, null, 2));
  console.log("\n✅ Testna notifikacija je uspješno poslana na sve registrovane uređaje!");
}

main().catch(err => {
  console.error("Greška:", err);
  process.exit(1);
});
