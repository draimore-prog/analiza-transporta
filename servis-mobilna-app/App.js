import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Image
} from "react-native";
import { collection, onSnapshot, doc, updateDoc, setDoc, getDocs } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { db } from "./firebase";

const DEFAULT_SUPERADMIN = {
  username: "emir.durakovic",
  fullname: "Emir Duraković",
  email: "emir.durakovic@bingotuzla.ba",
  password: "BingoTransport2026!",
  role: "superadmin"
};

const CHECKLIST_ITEMS = [
  { key: "wheels", label: "Točkovi i gume", desc: "Habanje, napuknuća" },
  { key: "mast_forks", label: "Kran, viljuške i lanci", desc: "Geometrija, klizači" },
  { key: "battery", label: "Baterija i punjač", desc: "Nivo elektrolita, kablovi" },
  { key: "hydraulics", label: "Hidraulika i ulje", desc: "Cilindri, crijeva, nivo ulja" },
  { key: "brakes", label: "Kočioni sistem", desc: "Radna i parking kočnica" },
  { key: "steering_electronics", label: "Ruda i elektronika", desc: "Prekidači, displej" },
  { key: "chassis_seat", label: "Šasija i sjedište", desc: "Mikroprekidač, krov" },
  { key: "safety_signals", label: "Signalizacija i sigurnost", desc: "Sirena, rotacija, STOP" }
];

const COMMON_TEMPLATES = [
  "Zamjena pogonskog točka",
  "Zamjena teretnog točkića krana",
  "Dolijevanje hidrauličnog ulja HD46",
  "Čišćenje i zaštita terminala baterije",
  "Podmazivanje lanca krana i klizača",
  "Podešavanje kočnice",
  "Otklanjanje vlaženja hidrauličnog crijeva"
];

const PHOTO_SLOTS = [
  { key: "front", label: "1. Pogled Naprijed" },
  { key: "back", label: "2. Pogled Nazad" },
  { key: "left", label: "3. Lijeva Strana" },
  { key: "right", label: "4. Desna Strana" },
  { key: "interior", label: "5. Radni Sati / Sjedište" }
];

export default function App() {
  // Tema: Tamna (dark) ili Svijetla (white)
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Autentifikacija
  const [activeUser, setActiveUser] = useState(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [usersList, setUsersList] = useState([DEFAULT_SUPERADMIN]);

  // Lista dodijeljenih naloga u sistemu
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);

  // Stanje forme
  const [vehicleId, setVehicleId] = useState("");
  const [orderType, setOrderType] = useState("preventive");
  const [workHours, setWorkHours] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [usedMaterials, setUsedMaterials] = useState("");
  const [checklist, setChecklist] = useState(() => {
    const init = {};
    CHECKLIST_ITEMS.forEach((item) => {
      init[item.key] = { status: "ok" };
    });
    return init;
  });
  const [photos, setPhotos] = useState({});

  // Status slanja
  const [submitting, setSubmitting] = useState(false);
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState(null);

  // Učitavanje korisnika iz Firestore-a
  useEffect(() => {
    try {
      const qUsers = collection(db, "app_users");
      const unsub = onSnapshot(qUsers, (snapshot) => {
        const list = [];
        snapshot.forEach((d) => {
          const u = d.data();
          if (u && u.username) list.push(u);
        });
        if (list.length > 0) {
          setUsersList(list);
        }
      });
      return () => unsub();
    } catch (e) {
      console.warn("User listener error:", e);
    }
  }, []);

  // Učitavanje radnih naloga u realnom vremenu
  useEffect(() => {
    if (!activeUser) return;

    const q = collection(db, "warehouse_work_orders");
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        const userClean = (activeUser.fullname || activeUser.username || "").toLowerCase();

        snapshot.forEach((d) => {
          const data = d.data();
          if (data.status === "pending" || data.status === "in_progress") {
            const assigned = (data.assignedTo || "").toLowerCase();
            const isForMe = !userClean || assigned.includes(userClean) || assigned.includes("svi") || assigned === "";
            if (isForMe) {
              list.push({ id: d.id, ...data });
            }
          }
        });
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setAssignedOrders(list);
      },
      (err) => {
        console.warn("Firestore listener error:", err);
      }
    );
    return () => unsubscribe();
  }, [activeUser]);

  // Prijava korisnika
  const handleLogin = async () => {
    const uClean = loginUsername.trim().toLowerCase();
    const pClean = loginPassword.trim();

    if (!uClean || !pClean) {
      setLoginError("Molimo unesite korisničko ime i lozinku!");
      return;
    }

    setLoggingIn(true);
    setLoginError("");

    try {
      // 1. Provjera u bazi
      let found = usersList.find(
        (u) =>
          (u.username && u.username.toLowerCase() === uClean) ||
          (u.email && u.email.toLowerCase() === uClean)
      );

      // 2. Default superadmin provjera
      if (!found && (DEFAULT_SUPERADMIN.username.toLowerCase() === uClean || DEFAULT_SUPERADMIN.email.toLowerCase() === uClean)) {
        found = DEFAULT_SUPERADMIN;
      }

      if (found && found.password === pClean) {
        setActiveUser(found);
        setLoginUsername("");
        setLoginPassword("");
        setLoginError("");
      } else {
        setLoginError("Neispravno korisničko ime ili lozinka!");
      }
    } catch (e) {
      setLoginError("Došlo je do greške prilikom prijave.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setActiveUser(null);
    setActiveOrder(null);
    setSubmittedOrderNumber(null);
  };

  // Prebacivanje teme
  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Prebacivanje na dodijeljeni nalog
  const handleSelectAssignedOrder = (order) => {
    setActiveOrder(order);
    setVehicleId(order.vehicleId || "");
    setOrderType(order.type || "preventive");
    setWorkHours(order.workHours ? String(order.workHours) : "");
    setWorkDescription(order.workDescription || "");
    setUsedMaterials(order.usedMaterials || "");

    const initCheck = {};
    CHECKLIST_ITEMS.forEach((item) => {
      initCheck[item.key] = order.checklist?.[item.key] || { status: "ok" };
    });
    setChecklist(initCheck);
    setPhotos(order.photos || {});
    setSubmittedOrderNumber(null);
  };

  // Prebacivanje na novi samostalni unos
  const handleStartFreshOrder = () => {
    setActiveOrder(null);
    setVehicleId("");
    setOrderType("preventive");
    setWorkHours("");
    setWorkDescription("");
    setUsedMaterials("");

    const initCheck = {};
    CHECKLIST_ITEMS.forEach((item) => {
      initCheck[item.key] = { status: "ok" };
    });
    setChecklist(initCheck);
    setPhotos({});
    setSubmittedOrderNumber(null);
  };

  // Označi sve sklopove kao ispravne
  const handleMarkAllOk = () => {
    const updated = {};
    CHECKLIST_ITEMS.forEach((item) => {
      updated[item.key] = { status: "ok" };
    });
    setChecklist(updated);
  };

  // Dodavanje brzog predloška u opis radova
  const handleAddTemplate = (template) => {
    setWorkDescription((prev) => {
      if (!prev.trim()) return template;
      return `${prev.trim()}; ${template}`;
    });
  };

  // Slikanje kamerom
  const handleTakePhoto = async (slotKey) => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Dozvola potrebna", "Molimo odobrite pristup kameri telefona.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.5,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const base64Uri = `data:image/jpeg;base64,${asset.base64}`;
        setPhotos((prev) => ({ ...prev, [slotKey]: base64Uri }));
      }
    } catch (e) {
      Alert.alert("Greška kamere", "Nije moguće otvoriti kameru.");
    }
  };

  // Slanje forme
  const handleSubmit = async () => {
    if (!vehicleId.trim()) {
      Alert.alert("Obavezno polje", "Morate unijeti ili potvrditi broj viljuškara!");
      return;
    }
    if (!workHours.trim() || Number(workHours) <= 0) {
      Alert.alert("Obavezno polje", "Obavezno unesite trenutno stanje radnih sati (MTH) sa table!");
      return;
    }

    setSubmitting(true);
    try {
      if (activeOrder && activeOrder.id) {
        const docRef = doc(db, "warehouse_work_orders", activeOrder.id);
        await updateDoc(docRef, {
          workHours: Number(workHours) || 0,
          type: orderType,
          checklist,
          workDescription,
          usedMaterials,
          photos,
          status: "completed",
          completedAt: new Date().toISOString(),
          completedBy: activeUser?.fullname || activeUser?.username || "Serviser"
        });
        setSubmittedOrderNumber(activeOrder.orderNumber);
      } else {
        const now = new Date();
        const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const orderNumber = `RN-SM-${yearMonth}-${randomSuffix}`;
        const docId = orderNumber.toLowerCase().replace(/[^a-z0-9-]/g, "_");

        await setDoc(doc(db, "warehouse_work_orders", docId), {
          orderNumber,
          vehicleId: vehicleId.toUpperCase().trim(),
          type: orderType,
          priority: "normal",
          workHours: Number(workHours) || 0,
          checklist,
          workDescription,
          usedMaterials,
          photos,
          status: "completed",
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          createdBy: activeUser?.fullname || activeUser?.username || "Serviser Mobilna App"
        });
        setSubmittedOrderNumber(orderNumber);
      }
    } catch (err) {
      Alert.alert("Greška pri slanju", err.message || "Pokušajte ponovo.");
    } finally {
      setSubmitting(false);
    }
  };

  // Boje prema odabranoj temi
  const theme = {
    bg: isDarkMode ? "#0f172a" : "#f8fafc",
    cardBg: isDarkMode ? "#1e293b" : "#ffffff",
    border: isDarkMode ? "#334155" : "#e2e8f0",
    textPrimary: isDarkMode ? "#ffffff" : "#0f172a",
    textSecondary: isDarkMode ? "#94a3b8" : "#64748b",
    inputBg: isDarkMode ? "#0f172a" : "#f1f5f9",
    inputBorder: isDarkMode ? "#334155" : "#cbd5e1"
  };

  // ==========================================
  // EKRAN 1: PRIJAVA U SISTEM (IDENTIČAN KAO WEB)
  // ==========================================
  if (!activeUser) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={theme.bg}
        />

        {/* Dugme za promjenu teme na vrhu ekrana za prijavu */}
        <View style={styles.loginTopBar}>
          <TouchableOpacity
            style={[styles.themeToggleBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            onPress={toggleTheme}
          >
            <Text style={styles.themeToggleBtnText}>
              {isDarkMode ? "☀️ Svijetla Tema" : "🌙 Tamna Tema"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.loginScrollContent}>
          <View style={[styles.loginCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            {/* Ikona katanca */}
            <View style={styles.loginIconCircle}>
              <Text style={styles.loginIconLock}>🔐</Text>
            </View>

            <Text style={[styles.loginTitle, { color: theme.textPrimary }]}>Prijava u Sistem</Text>
            <Text style={[styles.loginSubtitle, { color: theme.textSecondary }]}>
              Bingo Servisna Radionica & Mehanizacija
            </Text>

            {/* Greška pri prijavi */}
            {loginError ? (
              <View style={styles.loginErrorBox}>
                <Text style={styles.loginErrorText}>⚠️ {loginError}</Text>
              </View>
            ) : null}

            {/* Korisničko ime */}
            <View style={styles.loginFieldGroup}>
              <Text style={[styles.loginFieldLabel, { color: theme.textSecondary }]}>
                KORISNIČKO IME ILI EMAIL
              </Text>
              <TextInput
                style={[
                  styles.loginInput,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.textPrimary
                  }
                ]}
                placeholder="Unesite korisničko ime..."
                placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
                value={loginUsername}
                onChangeText={setLoginUsername}
                autoCapitalize="none"
              />
            </View>

            {/* Lozinka */}
            <View style={styles.loginFieldGroup}>
              <Text style={[styles.loginFieldLabel, { color: theme.textSecondary }]}>LOZINKA</Text>
              <TextInput
                style={[
                  styles.loginInput,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.textPrimary
                  }
                ]}
                placeholder="Unesite lozinku..."
                placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
                value={loginPassword}
                onChangeText={setLoginPassword}
                secureTextEntry
              />
            </View>

            {/* Dugme za prijavu */}
            <TouchableOpacity
              style={[styles.loginSubmitBtn, loggingIn && { opacity: 0.6 }]}
              onPress={handleLogin}
              disabled={loggingIn}
            >
              {loggingIn ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginSubmitBtnText}>PRIJAVI SE U SISTEM</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==========================================
  // EKRAN 2: POTVRDA NAKON SLANJA NALOGA
  // ==========================================
  if (submittedOrderNumber) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={theme.bg}
        />
        <View style={styles.successScreen}>
          <View style={styles.successIconCircle}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={[styles.successTitle, { color: theme.textPrimary }]}>
            Radni Nalog Uspješno Poslan!
          </Text>
          <View style={styles.successOrderBadge}>
            <Text style={styles.successOrderText}>{submittedOrderNumber}</Text>
          </View>
          <Text style={[styles.successDesc, { color: theme.textSecondary }]}>
            Radni sati ({workHours} h), kontrolna ček-lista i fotografije su uspješno zabilježeni u sistem.
          </Text>

          <TouchableOpacity style={styles.successBtn} onPress={handleStartFreshOrder}>
            <Text style={styles.successBtnText}>POKRENI NOVI PREGLED</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isLockedUnit = !!activeOrder;

  // ==========================================
  // EKRAN 3: TERENSKI UNOS (KOMPLETAN SADRŽAJ)
  // ==========================================
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.cardBg}
      />

      {/* GORNJA TRAKA SA PRIJAVLJENIM SERVISEROM, DUGMETOM ZA TEMU I ODJAVU */}
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>📱</Text>
          <View>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>TERENSKI UNOS</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              {activeUser.fullname || activeUser.username}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Dugme za promjenu teme ☀️ / 🌙 */}
          <TouchableOpacity
            style={[styles.themeHeaderBtn, { borderColor: theme.border }]}
            onPress={toggleTheme}
            title="Promijeni temu"
          >
            <Text style={styles.themeHeaderBtnText}>{isDarkMode ? "☀️" : "🌙"}</Text>
          </TouchableOpacity>

          {/* Dugme za odjavu */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Odjava</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TRAKA ZA BRZI IZBOR DODIJELJENIH ZADATAKA */}
      {assignedOrders.length > 0 && (
        <View style={[styles.assignedBar, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
          <Text style={styles.assignedBarTitle}>ZADACI OD VODITELJA:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.assignedScroll}>
            <TouchableOpacity
              style={[
                styles.assignedPill,
                !activeOrder && styles.assignedPillActive,
                { borderColor: theme.border }
              ]}
              onPress={handleStartFreshOrder}
            >
              <Text style={[styles.assignedPillText, !activeOrder && styles.assignedPillTextActive]}>
                ➕ Novi Unos
              </Text>
            </TouchableOpacity>

            {assignedOrders.map((order) => {
              const isSelected = activeOrder?.id === order.id;
              return (
                <TouchableOpacity
                  key={order.id}
                  style={[
                    styles.assignedPill,
                    isSelected && styles.assignedPillOrderActive,
                    { borderColor: theme.border }
                  ]}
                  onPress={() => handleSelectAssignedOrder(order)}
                >
                  <Text style={[styles.assignedPillText, isSelected && styles.assignedPillTextActive]}>
                    🔒 {order.vehicleId || "Viljuškar"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* TIJELO FORME TERENSKOG UNOSA */}
      <ScrollView
        style={[styles.container, { backgroundColor: theme.bg }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. JEDINICA SKLADIŠNE MEHANIZACIJE */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            1. JEDINICA SKLADIŠNE MEHANIZACIJE
          </Text>

          {isLockedUnit ? (
            <View style={styles.lockedBox}>
              <Text style={styles.lockedBadgeText}>🔒 ZADATAK OD VODITELJA (FIKSIRANO)</Text>
              <Text style={[styles.lockedVehicleId, { color: isDarkMode ? "#fff" : "#0f172a" }]}>
                {vehicleId}
              </Text>
              <Text style={[styles.lockedVehicleModel, { color: theme.textPrimary }]}>
                {activeOrder.vehicleDetails?.proizvodjac || ""} {activeOrder.vehicleDetails?.model || ""}
              </Text>
              <Text style={[styles.lockedVehicleLocation, { color: theme.textSecondary }]}>
                📍 Lokacija: {activeOrder.vehicleDetails?.lokacija || "PJ Skladište"}
              </Text>

              {activeOrder.workDescription ? (
                <View style={[styles.managerInstructionBox, { backgroundColor: isDarkMode ? "#0f172a" : "#fff" }]}>
                  <Text style={styles.managerInstructionLabel}>NALOG VODITELJA:</Text>
                  <Text style={[styles.managerInstructionText, { color: theme.textPrimary }]}>
                    {activeOrder.workDescription}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Broj / Oznaka viljuškara:
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.textPrimary
                  }
                ]}
                placeholder="Npr. 342 RX 17 ili SM-042"
                placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
                value={vehicleId}
                onChangeText={setVehicleId}
                autoCapitalize="characters"
              />
            </View>
          )}
        </View>

        {/* 2. VRSTA PREGLEDA I RADNI SATI */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            2. VRSTA PREGLEDA I RADNI SATI
          </Text>

          <View style={styles.typeSelectorRow}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                orderType === "preventive" && styles.typeBtnActivePreventive
              ]}
              onPress={() => setOrderType("preventive")}
            >
              <Text style={[styles.typeBtnText, orderType === "preventive" && styles.typeBtnTextActive]}>
                🛡️ Redovni Pregled
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                orderType === "corrective" && styles.typeBtnActiveCorrective
              ]}
              onPress={() => setOrderType("corrective")}
            >
              <Text style={[styles.typeBtnText, orderType === "corrective" && styles.typeBtnTextActive]}>
                ⚠️ Kvar / Popravka
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 14 }]}>
            Radni sati sa table (MTH) - <Text style={{ color: "#EF4444" }}>OBAVEZNO</Text>:
          </Text>
          <View style={[styles.mthInputWrapper, { backgroundColor: theme.inputBg }]}>
            <TextInput
              style={styles.mthInput}
              placeholder="0"
              placeholderTextColor="#64748b"
              value={workHours}
              onChangeText={setWorkHours}
              keyboardType="numeric"
            />
            <Text style={styles.mthUnitText}>h</Text>
          </View>
        </View>

        {/* 3. KONTROLNA ČEK-LISTA (8 SKLOPOVA) */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            3. KONTROLNA ČEK-LISTA (8 SKLOPOVA)
          </Text>

          <TouchableOpacity style={styles.markAllOkBtn} onPress={handleMarkAllOk}>
            <Text style={styles.markAllOkBtnText}>✓ KLIKNI OVDJE: OZNAČI SVE KAO ISPRAVNO</Text>
          </TouchableOpacity>

          {CHECKLIST_ITEMS.map((item) => {
            const isOk = checklist[item.key]?.status === "ok";

            return (
              <View
                key={item.key}
                style={[styles.checklistItem, { borderBottomColor: theme.border }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.checklistLabel, { color: theme.textPrimary }]}>{item.label}</Text>
                  <Text style={[styles.checklistDesc, { color: theme.textSecondary }]}>{item.desc}</Text>
                </View>

                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                      isOk && styles.toggleOkActive
                    ]}
                    onPress={() =>
                      setChecklist((prev) => ({ ...prev, [item.key]: { status: "ok" } }))
                    }
                  >
                    <Text style={[styles.toggleText, isOk && styles.toggleTextActive]}>
                      ✓ Ispravno
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                      !isOk && styles.toggleDefectActive
                    ]}
                    onPress={() =>
                      setChecklist((prev) => ({ ...prev, [item.key]: { status: "defect" } }))
                    }
                  >
                    <Text style={[styles.toggleText, !isOk && styles.toggleTextActive]}>
                      ⚠️ Defekt
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* 4. OPIS OBAVLJENOG POSLA */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>4. OPIS OBAVLJENOG POSLA</Text>

          <Text style={[styles.templatesTitle, { color: theme.textSecondary }]}>
            Brzi predlošci (kliknite za dodavanje):
          </Text>
          <View style={styles.templatesWrap}>
            {COMMON_TEMPLATES.map((tmpl) => (
              <TouchableOpacity
                key={tmpl}
                style={[styles.templateChip, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
                onPress={() => handleAddTemplate(tmpl)}
              >
                <Text style={styles.templateChipText}>+ {tmpl}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[
              styles.textInput,
              styles.textArea,
              {
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.textPrimary
              }
            ]}
            placeholder="Unesite detaljan opis šta je pregledano ili popravljeno..."
            placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
            value={workDescription}
            onChangeText={setWorkDescription}
            multiline
            numberOfLines={4}
          />

          <Text style={[styles.cardTitle, { color: theme.textPrimary, marginTop: 16 }]}>
            UTROŠENI DIJELOVI / MATERIJAL
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.textPrimary
              }
            ]}
            placeholder="Npr. 1x točak 230x75, 2L ulja HD46..."
            placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
            value={usedMaterials}
            onChangeText={setUsedMaterials}
          />
        </View>

        {/* 5. FOTOGRAFIJE (5 UGLOVA) */}
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            5. FOTOGRAFIJE SA KAMERE (5 UGLOVA)
          </Text>

          {PHOTO_SLOTS.map((slot) => {
            const uri = photos[slot.key];
            return (
              <View
                key={slot.key}
                style={[styles.photoRow, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}
              >
                <Text style={[styles.photoSlotLabel, { color: theme.textPrimary }]}>{slot.label}</Text>

                {uri ? (
                  <View style={styles.photoPreviewWrapper}>
                    <Image source={{ uri }} style={styles.photoThumb} />
                    <TouchableOpacity
                      style={styles.photoRetakeBtn}
                      onPress={() => handleTakePhoto(slot.key)}
                    >
                      <Text style={styles.photoRetakeBtnText}>Ponovi Sliku</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.cameraCaptureBtn, { backgroundColor: isDarkMode ? "#334155" : "#e2e8f0" }]}
                    onPress={() => handleTakePhoto(slot.key)}
                  >
                    <Text style={styles.cameraCaptureIcon}>📷</Text>
                    <Text style={[styles.cameraCaptureText, { color: isDarkMode ? "#fff" : "#0f172a" }]}>
                      USLIKAJ
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* TASTER ZA POTVRDU I SLANJE */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <Text style={styles.submitBtnText}>✓ POTVRDI I POŠALJI NALOG</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },

  // LOGIN EKRAN
  loginTopBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: "flex-end"
  },
  themeToggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1
  },
  themeToggleBtnText: {
    fontWeight: "800",
    fontSize: 12,
    color: "#60A5FA"
  },
  loginScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20
  },
  loginCard: {
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8
  },
  loginIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(37, 99, 235, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 16
  },
  loginIconLock: {
    fontSize: 32
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center"
  },
  loginSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20
  },
  loginErrorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "#EF4444",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 16
  },
  loginErrorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center"
  },
  loginFieldGroup: {
    marginBottom: 14
  },
  loginFieldLabel: {
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: 0.5
  },
  loginInput: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "700",
    borderWidth: 1
  },
  loginSubmitBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6
  },
  loginSubmitBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5
  },

  // HEADER GLAVNOG EKRANA
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  headerIcon: {
    fontSize: 22
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "700"
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  themeHeaderBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1
  },
  themeHeaderBtnText: {
    fontSize: 14
  },
  logoutBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "#EF4444",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10
  },
  logoutBtnText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "900"
  },

  // TRAKA SA DODIJELJENIM ZADACIMA
  assignedBar: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 1
  },
  assignedBarTitle: {
    color: "#F59E0B",
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 6,
    letterSpacing: 0.5
  },
  assignedScroll: {
    gap: 8
  },
  assignedPill: {
    backgroundColor: "rgba(100, 116, 139, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1
  },
  assignedPillActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981"
  },
  assignedPillOrderActive: {
    backgroundColor: "#F59E0B",
    borderColor: "#F59E0B"
  },
  assignedPillText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "800"
  },
  assignedPillTextActive: {
    color: "#fff"
  },

  // FORMA I KARTICE
  container: {
    flex: 1
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 60
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 10,
    letterSpacing: 0.5
  },
  lockedBox: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderColor: "#F59E0B",
    borderWidth: 2,
    borderRadius: 16,
    padding: 14
  },
  lockedBadgeText: {
    color: "#F59E0B",
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 4
  },
  lockedVehicleId: {
    fontSize: 26,
    fontWeight: "900",
    fontFamily: "monospace"
  },
  lockedVehicleModel: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2
  },
  lockedVehicleLocation: {
    fontSize: 12,
    marginTop: 4
  },
  managerInstructionBox: {
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#F59E0B"
  },
  managerInstructionLabel: {
    color: "#F59E0B",
    fontSize: 10,
    fontWeight: "900"
  },
  managerInstructionText: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6
  },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: "700",
    borderWidth: 1
  },
  typeSelectorRow: {
    flexDirection: "row",
    gap: 8
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1
  },
  typeBtnActivePreventive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB"
  },
  typeBtnActiveCorrective: {
    backgroundColor: "#DC2626",
    borderColor: "#DC2626"
  },
  typeBtnText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "900"
  },
  typeBtnTextActive: {
    color: "#fff"
  },
  mthInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#F59E0B",
    paddingHorizontal: 12
  },
  mthInput: {
    flex: 1,
    color: "#10B981",
    fontSize: 24,
    fontWeight: "900",
    fontFamily: "monospace",
    paddingVertical: 8
  },
  mthUnitText: {
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: "900"
  },
  markAllOkBtn: {
    backgroundColor: "#10B981",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12
  },
  markAllOkBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900"
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1
  },
  checklistLabel: {
    fontSize: 13,
    fontWeight: "800"
  },
  checklistDesc: {
    fontSize: 11,
    marginTop: 2
  },
  toggleRow: {
    flexDirection: "row",
    gap: 6
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1
  },
  toggleOkActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981"
  },
  toggleDefectActive: {
    backgroundColor: "#EF4444",
    borderColor: "#EF4444"
  },
  toggleText: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "900"
  },
  toggleTextActive: {
    color: "#fff"
  },
  templatesTitle: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6
  },
  templatesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10
  },
  templateChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1
  },
  templateChipText: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "700"
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top"
  },
  photoRow: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1
  },
  photoSlotLabel: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8
  },
  cameraCaptureBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6
  },
  cameraCaptureIcon: {
    fontSize: 16
  },
  cameraCaptureText: {
    fontSize: 12,
    fontWeight: "900"
  },
  photoPreviewWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#10B981"
  },
  photoRetakeBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  photoRetakeBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800"
  },
  submitBtn: {
    backgroundColor: "#10B981",
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5
  },

  // EKRAN POTVRDE
  successScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  successIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "#10B981",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  successIconText: {
    color: "#10B981",
    fontSize: 36,
    fontWeight: "900"
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10
  },
  successOrderBadge: {
    backgroundColor: "rgba(37, 99, 235, 0.15)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2563EB",
    marginBottom: 12
  },
  successOrderText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "900",
    fontFamily: "monospace"
  },
  successDesc: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24
  },
  successBtn: {
    backgroundColor: "#10B981",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: "100%",
    alignItems: "center"
  },
  successBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900"
  }
});
