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
  Platform
} from "react-native";
import { WebView } from "react-native-webview";

const PORTAL_URL = "https://analiza-transporta-flota.web.app/?portal=servisna-radionica";

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
  })();
  true;
`;

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

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
            onNavigationStateChange={(navState) => {
              setCanGoBack(navState.canGoBack);
            }}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
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
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={styles.loadingTitle}>Servisna Radionica</Text>
                <Text style={styles.loadingSubtitle}>Bingo Mehanizacija...</Text>
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
    backgroundColor: "#4f46e5",
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
