const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Pomoćna funkcija za slanje Expo Push notifikacija na registrovane tokene servisera
 */
async function sendPushToServisers({ title, body, data }) {
  try {
    const tokensSnap = await db.collection("serviser_push_tokens").get();
    const tokens = [];

    tokensSnap.forEach((doc) => {
      const t = doc.data()?.token;
      if (
        t &&
        typeof t === "string" &&
        (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken[") || t.length > 20)
      ) {
        tokens.push(t);
      }
    });

    if (tokens.length === 0) {
      console.log("sendPushToServisers: Nema registrovanih push tokena u kolekciji 'serviser_push_tokens'.");
      return;
    }

    const messages = tokens.map((to) => ({
      to,
      title: title || "🔔 NOVI RADNI NALOG",
      body: body || "Dodijeljen je novi radni nalog za mehanizaciju.",
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
        ...data,
        _displayInForeground: true
      }
    }));

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(messages)
    });

    const resJson = await response.json().catch(() => ({}));
    console.log(`Push notifikacije poslane na ${tokens.length} uređaja:`, resJson);
  } catch (err) {
    console.error("Greška pri slanju push notifikacije u Cloud Funkciji:", err);
  }
}

/**
 * 1. TRIGGER: Čim se kreira novi radni nalog u kolekciji warehouse_work_orders
 */
exports.onWorkOrderCreated = functions
  .region("europe-west1")
  .firestore.document("warehouse_work_orders/{orderId}")
  .onCreate(async (snap, context) => {
    const order = snap.data();
    if (!order) return;

    const orderId = context.params.orderId;
    const vehId = order.vehicleId || "Skladišna mehanizacija";
    const desc = order.workDescription || order.notes || "Dodijeljen novi radni nalog za pregled ili servis";
    const assigned = order.assignedTo ? ` (Zadužen: ${order.assignedTo})` : "";
    const priorityEmoji = order.priority === "urgent" ? "🚨 HITNO - " : "🔔 ";

    console.log(`[Trigger onWorkOrderCreated] Novi radni nalog kreiran: ${orderId} za vozilo ${vehId}`);

    await sendPushToServisers({
      title: `${priorityEmoji}NOVI RADNI NALOG: ${vehId}`,
      body: `${desc}${assigned}`,
      data: {
        orderId,
        orderNumber: order.orderNumber || "",
        vehicleId: vehId,
        eventType: "ORDER_CREATED"
      }
    });
  });

/**
 * 2. TRIGGER: Promjena statusa ili odobravanje radnog naloga
 */
exports.onWorkOrderStatusUpdated = functions
  .region("europe-west1")
  .firestore.document("warehouse_work_orders/{orderId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    if (!beforeData || !afterData) return;

    const orderId = context.params.orderId;
    const vehId = afterData.vehicleId || "Skladišna mehanizacija";

    // Ako je nalog tek odobren od strane voditelja
    if (beforeData.status !== "approved" && afterData.status === "approved") {
      console.log(`[Trigger onWorkOrderStatusUpdated] Nalog ${orderId} je odobren.`);
      await sendPushToServisers({
        title: `✅ RADNI NALOG ODOBREN: ${vehId}`,
        body: `Pregledan i odobren radni nalog ${afterData.orderNumber || orderId} od strane voditelja servisa.`,
        data: {
          orderId,
          orderNumber: afterData.orderNumber || "",
          vehicleId: vehId,
          eventType: "ORDER_APPROVED"
        }
      });
    }
  });
