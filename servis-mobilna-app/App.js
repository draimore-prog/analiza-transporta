import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  SafeAreaView,
  StatusBar,
  Platform,
  AppState,
  Alert,
  useColorScheme
} from "react-native";
import { WebView } from "react-native-webview";
import * as Notifications from "expo-notifications";
import * as ImagePicker from "expo-image-picker";
import * as Updates from "expo-updates";
import * as TaskManager from "expo-task-manager";
import * as IntentLauncher from "expo-intent-launcher";
import { collection, onSnapshot, query, where, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const PORTAL_URL = "https://analiza-transporta-flota.web.app/?portal=terenski-nalozi";
const EXPO_PROJECT_ID = "aba5c8a2-9d9f-4ec6-8060-442bc8068155";
const APP_VERSION = "1.1.0";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setupBackgroundWatcher, checkAndNotifyNewWorkOrders } from "./backgroundWatcher.js";

// Konfiguracija prikaza notifikacija dok je aplikacija aktivna u prvom planu
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Skripta za potpuno zaključavanje zumiranja i osiguravanje native fluidnosti
const INJECTED_VIEWPORT_LOCK = `
  (function() {
    var meta = document.querySelector('meta[name=viewport]');
    if (meta) {
      meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    } else {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
      document.getElementsByTagName('head')[0].appendChild(meta);
    }
    // Isključi dvoklik zumiranje
    document.addEventListener('dblclick', function(e) { e.preventDefault(); }, { passive: false });
    window.__IS_NATIVE_APP = true;
    window.__APP_VERSION = "${APP_VERSION}";
  })();
  true;
`;

export default function App() {
  const webViewRef = useRef(null);
  const alertedOrdersRef = useRef(new Set());
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [registeredPushToken, setRegisteredPushToken] = useState(null);

  // Zahtjev za rad 24h u pozadini / izuzeće iz Android Doze moda i uštede baterije
  const requestBatteryOptimizationExemption = async () => {
    if (Platform.OS !== "android") return;
    try {
      const pkg = "ba.bingo.servismehanizacije";
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
        { data: `package:${pkg}` }
      );
    } catch (err) {
      console.warn("Direktan intent za bateriju nije uspio, otvaram postavke:", err);
      try {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
        );
      } catch (e2) {
        console.warn("Otvaranje postavki baterije nije uspjelo:", e2);
      }
    }
  };

  // Otvaranje OEM ekrana za automatsko pokretanje (Auto-start / Background activity)
  const openAutoStartSettings = async () => {
    if (Platform.OS !== "android") return;
    const pkg = "ba.bingo.servismehanizacije";

    // Pokušaj otvoriti specifične OEM ekrane za automatsko pokretanje (Xiaomi, Huawei, Oppo, Vivo, Samsung)
    const oemIntents = [
      { action: "miui.intent.action.OP_AUTO_START" },
      { packageName: "com.miui.securitycenter", className: "com.miui.permcenter.autostart.AutoStartManagementActivity" },
      { packageName: "com.huawei.systemmanager", className: "com.huawei.systemmanager.optimize.process.ProtectActivity" },
      { packageName: "com.huawei.systemmanager", className: "com.huawei.systemmanager.appcontrol.activity.StartupAppControlActivity" },
      { packageName: "com.coloros.safecenter", className: "com.coloros.safecenter.permission.startup.StartupAppListActivity" },
      { packageName: "com.iqoo.secure", className: "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity" },
      { action: IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS, data: `package:${pkg}` }
    ];

    for (const intent of oemIntents) {
      try {
        if (intent.packageName && intent.className) {
          await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.MAIN, {
            packageName: intent.packageName,
            className: intent.className
          });
          return;
        } else if (intent.action) {
          await IntentLauncher.startActivityAsync(intent.action, intent.data ? { data: intent.data } : undefined);
          return;
        }
      } catch (e) {
        // Probaj sljedeći intent
      }
    }

    try {
      await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS, {
        data: `package:${pkg}`
      });
    } catch (err) {
      console.warn("Otvaranje postavki aplikacije nije uspjelo:", err);
    }
  };

  // Otvaranje detaljnih sistemskih postavki aplikacije
  const openAppSettings = async () => {
    if (Platform.OS !== "android") return;
    try {
      await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS, {
        data: `package:ba.bingo.servismehanizacije`
      });
    } catch (err) {
      console.warn("Greška pri otvaranju postavki aplikacije:", err);
    }
  };

  // Sinhronizacija sistemske teme telefona u WebView
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (typeof window !== 'undefined') {
          window.__SYSTEM_COLOR_SCHEME = "${colorScheme}";
          if (document.documentElement) {
            if ("${colorScheme}" === "dark") {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }
          }
          window.dispatchEvent(new CustomEvent("systemcolorschemechange", { detail: "${colorScheme}" }));
        }
        true;
      `);
    }
  }, [colorScheme]);

  // 1. Inicijalizacija notifikacionog kanala visokog prioriteta i traženje dozvola
  useEffect(() => {
    async function setupNotificationsAndPermissions() {
      try {
        // A) Kreiranje Android Notification kanala visokog prioriteta sa zvukom, vibracijom i bypass-om
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("radni-nalozi-channel", {
            name: "Radni Nalozi Servisa",
            description: "Obavještenja o novim i dodijeljenim radnim nalozima za mehanizaciju",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250, 400],
            lightColor: "#10b981",
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            sound: "default",
            enableVibrate: true,
            enableLights: true,
            bypassDnd: true,
            showBadge: true
          });
        }

        // B) Dozvola za notifikacije (uključujući Android 13+ POST_NOTIFICATIONS)
        const { status: existingNotifStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingNotifStatus;
        if (existingNotifStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        // C) Registracija Expo Push Tokena za pouzdano primanje push notifikacija u pozadini
        if (finalStatus === "granted") {
          try {
            const tokenResult = await Notifications.getExpoPushTokenAsync({
              projectId: EXPO_PROJECT_ID
            });
            if (tokenResult?.data) {
              const token = tokenResult.data;
              setRegisteredPushToken(token);
              const cleanDocId = token.replace(/[^a-zA-Z0-9_-]/g, "_");
              await setDoc(
                doc(db, "serviser_push_tokens", cleanDocId),
                {
                  token,
                  platform: Platform.OS,
                  updatedAt: new Date().toISOString(),
                  appVersion: APP_VERSION,
                  deviceModel: Platform.OS === "android" ? "Android Device" : "iOS Device"
                },
                { merge: true }
              );
              console.log("Push token registrovan u bazi:", token);

              // Iniciraj u webview ako je već spreman
              if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
                  window.__EXPO_PUSH_TOKEN = "${token}";
                  true;
                `);
              }
            }
          } catch (tokenErr) {
            console.warn("Push token registracija info:", tokenErr);
          }
        }

        // D) Dozvola za kameru (za slikanje viljuškara i oštećenja)
        const { status: existingCamStatus } = await ImagePicker.getCameraPermissionsAsync();
        if (existingCamStatus !== "granted") {
          await ImagePicker.requestCameraPermissionsAsync();
        }

        // E) Dozvola za galeriju / medije
        const { status: existingMediaStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (existingMediaStatus !== "granted") {
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        }

        // F) Registracija 24/7 pozadinskog Task Managera sa startOnBoot i stopOnTerminate
        try {
          await setupBackgroundWatcher();
          console.log("Pozadinski servis uspješno pokrenut i povezan sa sistemom.");
        } catch (taskErr) {
          console.warn("Greška pri pokretanju pozadinskog servisa:", taskErr);
        }

        // G) Zatraži rad 24h u pozadini (isključenje iz uštede baterije)
        if (Platform.OS === "android") {
          setTimeout(() => {
            requestBatteryOptimizationExemption();
          }, 2000);
        }
      } catch (err) {
        console.warn("Greška pri postavljanju dozvola na uređaju:", err);
      }
    }

    setupNotificationsAndPermissions();
  }, []);

  // 2. Real-time osluškivanje novih radnih naloga sa trajnom perzistencijom u AsyncStorage
  useEffect(() => {
    let unsubscribe = () => {};

    try {
      const q = query(
        collection(db, "warehouse_work_orders"),
        where("status", "in", ["pending", "in_progress"])
      );

      unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          let alertedSet = new Set();
          try {
            const raw = await AsyncStorage.getItem("@bingo_motorfix_alerted_orders_v1");
            if (raw) alertedSet = new Set(JSON.parse(raw));
          } catch (e) {}

          let hasChanges = false;

          snapshot.docChanges().forEach(async (change) => {
            if (change.type === "added") {
              const order = change.doc.data();
              if (order.status !== "pending" && order.status !== "in_progress") return;

              const orderId = change.doc.id;
              if (alertedSet.has(orderId)) return;
              alertedSet.add(orderId);
              hasChanges = true;

              const vehId = order.vehicleId || "Skladišna mehanizacija";
              const desc = order.workDescription || order.notes || "Novi nalog za pregled ili servis";
              const assigned = order.assignedTo ? ` (Zadužen: ${order.assignedTo})` : "";

              await Notifications.scheduleNotificationAsync({
                content: {
                  title: `🔔 NOVI RADNI NALOG: ${vehId}`,
                  body: `${desc}${assigned}`,
                  sound: "default",
                  priority: Notifications.AndroidNotificationPriority.MAX,
                  channelId: "radni-nalozi-channel",
                  vibrate: [0, 500, 200, 500, 200, 500],
                  data: {
                    orderId: change.doc.id,
                    vehicleId: vehId
                  }
                },
                trigger: null
              });
            }
          });

          if (hasChanges) {
            try {
              const arr = Array.from(alertedSet).slice(-500);
              await AsyncStorage.setItem("@bingo_motorfix_alerted_orders_v1", JSON.stringify(arr));
            } catch (e) {}
          }
        },
        (error) => {
          console.warn("Firestore warehouse_work_orders listener info:", error);
        }
      );
    } catch (err) {
      console.warn("Firestore listener setup greška:", err);
    }

    return () => unsubscribe();
  }, []);

  // 3. Upravljanje vraćanjem iz pozadine (AppState) radi sinhronizacije
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === "active") {
        checkAndNotifyNewWorkOrders(false);
      }
    };

    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => sub.remove();
  }, []);

  // 4. Rukovanje klikom na notifikaciju (direktno otvaranje radnog naloga)
  useEffect(() => {
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        const notifData = response?.notification?.request?.content?.data;
        if (notifData?.orderId && webViewRef.current) {
          const targetUrl = `https://analiza-transporta-flota.web.app/?portal=terenski-nalozi&orderId=${notifData.orderId}`;
          webViewRef.current.injectJavaScript(`
            window.location.href = "${targetUrl}";
            true;
          `);
        }
      } catch (err) {
        console.warn("Greška pri otvaranju notifikacije:", err);
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  // 5. Prijem poruka iz WebView-a (OTA ažuriranja, testiranje notifikacija sa odgodom i native alarmi)
  const handleWebViewMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (!data) return;

      // A) Provjera i preuzimanje OTA ažuriranja preko Expo Updates
      if (data.type === "CHECK_OTA_UPDATE") {
        try {
          if (__DEV__) {
            Alert.alert("Razvojno okruženje", "OTA ažuriranje se testira u produkcijskom buildu aplikacije.");
            return;
          }
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            Alert.alert(
              "Novo ažuriranje je spremno!",
              "Preuzeta je najnovija verzija koda aplikacije. Želite li je primijeniti odmah?",
              [
                { text: "Kasnije", style: "cancel" },
                {
                  text: "Ažuriraj odmah",
                  onPress: async () => {
                    await Updates.reloadAsync();
                  }
                }
              ]
            );
          } else {
            Alert.alert("Ažurno", "Imate najnoviju verziju mobilne aplikacije.");
          }
        } catch (err) {
          Alert.alert("Ažuriranje", "Aplikacija koristi najnoviji web prikaz sa servera.");
        }
        return;
      }

      // B) Testiranje notifikacije sa odgodom (za provjeru zaključanog ekrana)
      if (data.type === "TEST_DELAYED_NOTIFICATION") {
        const delaySeconds = data.delaySeconds || 5;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "🔔 TEST NOTIFIKACIJA ZA SERVISERA",
            body: "Uspješno primljena notifikacija na zaključanom ekranu! Zvuk, vibracija i buđenje ekrana rade.",
            sound: "default",
            priority: Notifications.AndroidNotificationPriority.MAX,
            channelId: "radni-nalozi-channel"
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: delaySeconds
          }
        });
        return;
      }

      // C) Zahtjev za rad 24h u pozadini / izuzeće iz uštede baterije
      if (data.type === "REQUEST_BATTERY_OPTIMIZATION") {
        await requestBatteryOptimizationExemption();
        return;
      }

      // C2) Provjera i ručni test pozadinskog servisa (24/7)
      if (data.type === "CHECK_BACKGROUND_SYNC") {
        const count = await checkAndNotifyNewWorkOrders(true);
        Alert.alert(
          "Pozadinsko Praćenje (24/7)",
          `Pozadinski servis je aktivan!\n\nPrati radne naloge čak i kad je aplikacija skroz zatvorena ili mobitel ponovo upaljen.\n\nStatus sinhronizacije: ${count > 0 ? `Pronađeno ${count} novih naloga.` : "Svi radni nalozi su sinhronizovani."}`
        );
        return;
      }

      // D) Otvaranje Auto-start postavki (Xiaomi, Samsung, Huawei, Oppo, Vivo)
      if (data.type === "OPEN_AUTO_START_SETTINGS") {
        await openAutoStartSettings();
        return;
      }

      // E) Otvaranje detaljnih postavki aplikacije (dozvole, obavijesti, baterija)
      if (data.type === "OPEN_APP_SETTINGS") {
        await openAppSettings();
        return;
      }

      // F) Lokalna notifikacija (direktan bridge poziv)
      if (data.type === "NOTIFICATION" || data.type === "NEW_WORK_ORDER") {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: data.title || "🔔 NOVI RADNI NALOG!",
            body: data.body || "Dodijeljen vam je novi radni nalog mehanizacije.",
            sound: "default",
            priority: Notifications.AndroidNotificationPriority.MAX,
            channelId: "radni-nalozi-channel"
          },
          trigger: null
        });
      }
    } catch (e) {
      // Ignoriši poruke koje nisu u JSON formatu
    }
  };

  // Upravljanje Android hardverskim back dugmetom
  useEffect(() => {
    if (Platform.OS === "android") {
      const onBackPress = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true; // Spriječi izlazak iz aplikacije
        }
        return false; // Izađi iz aplikacije
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }
  }, [canGoBack]);

  const handleReload = () => {
    setHasError(false);
    setIsLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#020617" : "#f8fafc" }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#020617" : "#f8fafc"}
      />

      {/* Offline / Greška Ekran */}
      {hasError ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorIconCircle}>
            <Text style={styles.errorIconText}>⚠️</Text>
          </View>
          <Text style={styles.errorTitle}>Problem sa povezivanjem</Text>
          <Text style={styles.errorDesc}>
            {errorMessage || "Provjerite internet konekciju i pokušajte ponovo."}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
            <Text style={styles.retryButtonText}>POKUŠAJ PONOVO</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.webviewWrapper}>
          <WebView
            ref={webViewRef}
            source={{ uri: PORTAL_URL }}
            injectedJavaScript={INJECTED_VIEWPORT_LOCK}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            scalesPageToFit={false}
            setBuiltInZoomControls={false}
            setDisplayZoomControls={false}
            bounces={false}
            overScrollMode="never"
            androidLayerType="hardware"
            originWhitelist={["*"]}
            onMessage={handleWebViewMessage}
            onNavigationStateChange={(navState) => {
              setCanGoBack(navState.canGoBack);
            }}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => {
              setIsLoading(false);
              if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
                  window.__SYSTEM_COLOR_SCHEME = "${colorScheme}";
                  if (document.documentElement) {
                    if ("${colorScheme}" === "dark") {
                      document.documentElement.classList.add("dark");
                    } else {
                      document.documentElement.classList.remove("dark");
                    }
                  }
                  window.dispatchEvent(new CustomEvent("systemcolorschemechange", { detail: "${colorScheme}" }));
                  ${registeredPushToken ? `window.__EXPO_PUSH_TOKEN = "${registeredPushToken}";` : ""}
                  true;
                `);
              }
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn("WebView error: ", nativeEvent);
              setHasError(true);
              setErrorMessage(nativeEvent.description || "Greška pri učitavanju portala.");
              setIsLoading(false);
            }}
            pullToRefreshEnabled={true}
            style={styles.webview}
          />

          {/* Splash učitavanje */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingTitle}>Servis Mehanizacije</Text>
                <Text style={styles.loadingSubtitle}>Bingo Terenski Nalozi...</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const STATUSBAR_MARGIN = Platform.OS === "android" ? (StatusBar.currentHeight || 28) : 0;
const NAVBAR_MARGIN = Platform.OS === "android" ? 16 : 0;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingTop: STATUSBAR_MARGIN,
    paddingBottom: NAVBAR_MARGIN
  },
  webviewWrapper: {
    flex: 1,
    position: "relative"
  },
  webview: {
    flex: 1,
    backgroundColor: "#0f172a"
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10
  },
  loadingCard: {
    backgroundColor: "#1e293b",
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8
  },
  loadingTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: "800",
    color: "#f8fafc",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  loadingSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8"
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0f172a"
  },
  errorIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#f59e0b"
  },
  errorIconText: {
    fontSize: 32
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f8fafc",
    marginBottom: 8,
    textAlign: "center"
  },
  errorDesc: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 18,
    maxWidth: 280
  },
  retryButton: {
    backgroundColor: "#10b981",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    elevation: 4
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5
  }
});
