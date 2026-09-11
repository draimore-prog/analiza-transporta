import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const BACKGROUND_WORK_ORDERS_TASK = "BINGO_MOTORFIX_BACKGROUND_WATCHER_V1";
const STORAGE_ALERTED_KEY = "@bingo_motorfix_alerted_orders_v1";
const STORAGE_LAST_CHECK_KEY = "@bingo_motorfix_last_check_timestamp";
const FIRESTORE_REST_URL =
  "https://firestore.googleapis.com/v1/projects/analiza-transporta-flota/databases/(default)/documents/warehouse_work_orders";

/**
 * Učitava set ID-eva radnih naloga koji su već oglašeni na ovom uređaju
 */
async function getAlertedOrderIds() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_ALERTED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) {
    return new Set();
  }
}

/**
 * Sprema novu listu oglašenih ID-eva u AsyncStorage (čuva zadnjih 500 ID-eva)
 */
async function saveAlertedOrderIds(setObj) {
  try {
    const arr = Array.from(setObj).slice(-500);
    await AsyncStorage.setItem(STORAGE_ALERTED_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn("AsyncStorage saveAlertedOrderIds greška:", e);
  }
}

/**
 * Provjerava Firestore za nove radne naloge i aktivira notifikaciju ako pronađe novi nalog
 * Radi u pozadini čak i kad je aplikacija bila ugašena ili telefon ponovo upaljen!
 */
export async function checkAndNotifyNewWorkOrders(isStartupCatchUp = false) {
  try {
    const alertedIds = await getAlertedOrderIds();
    const lastCheckRaw = await AsyncStorage.getItem(STORAGE_LAST_CHECK_KEY);
    const nowIso = new Date().toISOString();

    // Dohvati dokumente iz Firestore-a preko brzog REST API-ja koji radi i u minimalnom headless stanju
    const response = await fetch(FIRESTORE_REST_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache"
      }
    });

    if (!response.ok) {
      console.warn("Firestore REST fetch nije uspio, status:", response.status);
      return 0;
    }

    const data = await response.json();
    const documents = data.documents || [];
    let newAlertCount = 0;

    // Ako se pokreće po prvi put na tek instaliranoj aplikaciji i nema historije, zabilježi trenutno stanje
    const isFirstEverRun = alertedIds.size === 0 && !lastCheckRaw;

    for (const doc of documents) {
      const pathParts = (doc.name || "").split("/");
      const docId = pathParts[pathParts.length - 1];
      if (!docId) continue;

      const fields = doc.fields || {};
      const status = fields.status?.stringValue || "pending";

      // Prate se nalozi koji čekaju rad ili su u toku
      if (status !== "pending" && status !== "in_progress") {
        alertedIds.add(docId);
        continue;
      }

      if (alertedIds.has(docId)) {
        continue;
      }

      // Ako je prvi put ikad na svježem telefonu, samo evidentiraj postojeće
      if (isFirstEverRun) {
        alertedIds.add(docId);
        continue;
      }

      // Novi nalog koji do sada NIJE oglašen na ovom uređaju!
      alertedIds.add(docId);
      newAlertCount++;

      const vehId = fields.vehicleId?.stringValue || "Skladišna mehanizacija";
      const desc =
        fields.workDescription?.stringValue ||
        fields.notes?.stringValue ||
        "Dodijeljen radni nalog za pregled ili servis mehanizacije";
      const assigned = fields.assignedTo?.stringValue
        ? ` (${fields.assignedTo.stringValue})`
        : "";

      const prefix = isStartupCatchUp ? "🔔 [Propušten nalog] " : "🔔 NOVI RADNI NALOG: ";

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${prefix}${vehId}`,
          body: `${desc}${assigned}`,
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.MAX,
          channelId: "radni-nalozi-channel",
          vibrate: [0, 500, 200, 500, 200, 500],
          data: {
            orderId: docId,
            vehicleId: vehId,
            isOfflineCatchUp: isStartupCatchUp
          }
        },
        trigger: null // Odmah prikaži
      });

      console.log("[Background Watcher] Uspješno poslana notifikacija za nalog:", docId, vehId);
    }

    await saveAlertedOrderIds(alertedIds);
    await AsyncStorage.setItem(STORAGE_LAST_CHECK_KEY, nowIso);

    return newAlertCount;
  } catch (err) {
    console.warn("checkAndNotifyNewWorkOrders greška:", err);
    return 0;
  }
}

/**
 * Definisanje headless taska koji Android OS poziva u pozadini i nakon BOOT_COMPLETED
 */
TaskManager.defineTask(BACKGROUND_WORK_ORDERS_TASK, async () => {
  try {
    console.log("[Background Watcher Task] Pokrenuta pozadinska provjera naloga...");
    const count = await checkAndNotifyNewWorkOrders(true);
    return count > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (err) {
    console.warn("[Background Watcher Task] Greška u izvršavanju:", err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Inicijalizacija pozadinskog servisa:
 * 1. Kreiranje kanala
 * 2. Registracija BackgroundFetch taska sa startOnBoot: true i stopOnTerminate: false
 * 3. Pokretanje stalne statusne notifikacije (Foreground Service simulator)
 * 4. Catch-up provjera propuštenih naloga
 */
export async function setupBackgroundWatcher() {
  try {
    if (Platform.OS === "android") {
      // 1. Kanal visokog prioriteta za alarme radnih naloga
      await Notifications.setNotificationChannelAsync("radni-nalozi-channel", {
        name: "Radni Nalozi Servisa",
        description: "Zvučna i vibracijska obavještenja o novim radnim nalozima za mehanizaciju",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500, 200, 500],
        lightColor: "#10b981",
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: "default",
        enableVibrate: true,
        enableLights: true,
        bypassDnd: true,
        showBadge: true
      });

      // 2. Tihi kanal za trajni status u traci obavještenja (Foreground Service)
      await Notifications.setNotificationChannelAsync("motorfix-service-status-channel", {
        name: "Bingo MotorFix Pozadinski Servis (24/7)",
        description: "Status stalnog praćenja radnih naloga u pozadini",
        importance: Notifications.AndroidImportance.LOW,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.SECRET,
        sound: null,
        enableVibrate: false,
        showBadge: false
      });
    }

    // 3. Registruj BackgroundFetch sa ključnim parametrima za rad nakon gašenja telefona:
    // - stopOnTerminate: false -> NE gasi se kad korisnik zatvori ili svajpuje app
    // - startOnBoot: true -> Automatski se aktivira kad se telefon upali (nakon što je bio ugašen)
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_WORK_ORDERS_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_WORK_ORDERS_TASK, {
        minimumInterval: 60 * 15, // 15 minuta
        stopOnTerminate: false,
        startOnBoot: true
      });
      console.log("[Background Watcher] BackgroundFetch uspješno registrovan sa startOnBoot: true!");
    }

    // 4. Prikaži trajnu statusnu notifikaciju (24/7 čuvar procesa)
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: "motorfix_persistent_status",
        content: {
          title: "🔧 Bingo MotorFix • Praćenje naloga aktivno (24/7)",
          body: "Sistem u pozadini nadzire radne naloge i terenski servis mehanizacije.",
          channelId: "motorfix-service-status-channel",
          priority: Notifications.AndroidNotificationPriority.LOW,
          sticky: true,
          autoDismiss: false,
          data: { type: "PERSISTENT_SERVICE_STATUS" }
        },
        trigger: null
      });
    } catch (e) {
      console.warn("Greška pri postavljanju statusne notifikacije:", e);
    }

    // 5. Izvrši trenutnu Catch-Up provjeru za naloge pristigle dok je telefon bio ugašen
    setTimeout(() => {
      checkAndNotifyNewWorkOrders(true);
    }, 1500);
  } catch (err) {
    console.warn("setupBackgroundWatcher greška:", err);
  }
}
