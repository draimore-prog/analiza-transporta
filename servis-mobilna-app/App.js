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
import { collection, onSnapshot, doc, updateDoc, setDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { db } from "./firebase";

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
  // Lista zadataka dodijeljenih u sistemu
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Aktivni nalog koji se popunjava (null = novi unos na terenu)
  const [activeOrder, setActiveOrder] = useState(null);

  // Stanje forme
  const [vehicleId, setVehicleId] = useState("");
  const [orderType, setOrderType] = useState("preventive"); // "preventive" | "corrective"
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

  // Učitavanje radnih naloga u realnom vremenu
  useEffect(() => {
    const q = collection(db, "warehouse_work_orders");
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (data.status === "pending" || data.status === "in_progress") {
            list.push({ id: d.id, ...data });
          }
        });
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setAssignedOrders(list);
        setLoadingOrders(false);
      },
      (err) => {
        console.warn("Firestore listener error:", err);
        setLoadingOrders(false);
      }
    );
    return () => unsubscribe();
  }, []);

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
        const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
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
        // Završi dodijeljeni nalog
        const docRef = doc(db, "warehouse_work_orders", activeOrder.id);
        await updateDoc(docRef, {
          workHours: Number(workHours) || 0,
          type: orderType,
          checklist,
          workDescription,
          usedMaterials,
          photos,
          status: "completed",
          completedAt: new Date().toISOString()
        });
        setSubmittedOrderNumber(activeOrder.orderNumber);
      } else {
        // Kreiraj novi završeni nalog sa terena
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
          createdBy: "Serviser Mobilna App"
        });
        setSubmittedOrderNumber(orderNumber);
      }
    } catch (err) {
      Alert.alert("Greška pri slanju", err.message || "Pokušajte ponovo.");
    } finally {
      setSubmitting(false);
    }
  };

  // EKRAN POTVRDE NAKON SLANJA
  if (submittedOrderNumber) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <View style={styles.successScreen}>
          <View style={styles.successIconCircle}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Radni Nalog Uspješno Poslan!</Text>
          <View style={styles.successOrderBadge}>
            <Text style={styles.successOrderText}>{submittedOrderNumber}</Text>
          </View>
          <Text style={styles.successDesc}>
            Radni sati ({workHours} h), kontrolna ček-lista i fotografije su uspješno zabilježeni u sistem.
          </Text>

          <TouchableOpacity
            style={styles.successBtn}
            onPress={handleStartFreshOrder}
          >
            <Text style={styles.successBtnText}>POKRENI NOVI PREGLED</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isLockedUnit = !!activeOrder;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />

      {/* GORNJE ZAGLAVLJE: KAO U MODALU TERENSKI UNOS */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>📱</Text>
          <View>
            <Text style={styles.headerTitle}>TERENSKI RADNI NALOG</Text>
            <Text style={styles.headerSubtitle}>
              {activeOrder ? `Nalog: ${activeOrder.orderNumber}` : "Novi redovni pregled mehanizacije"}
            </Text>
          </View>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>ONLINE</Text>
        </View>
      </View>

      {/* BRZI IZBOR: DODIJELJENI ZADACI VODITELJA */}
      {assignedOrders.length > 0 && (
        <View style={styles.assignedBar}>
          <Text style={styles.assignedBarTitle}>ZADACI OD VODITELJA:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.assignedScroll}>
            <TouchableOpacity
              style={[styles.assignedPill, !activeOrder && styles.assignedPillActive]}
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
                  style={[styles.assignedPill, isSelected && styles.assignedPillOrderActive]}
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

      {/* GLAVNI SADRŽAJ: IDENTIČAN MODALU TERENSKI UNOS */}
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* KORAK 1: JEDINICA MEHANIZACIJE */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. JEDINICA SKLADIŠNE MEHANIZACIJE</Text>

          {isLockedUnit ? (
            /* ZAKLJUČANO OD VODITELJA */
            <View style={styles.lockedBox}>
              <View style={styles.lockedHeaderRow}>
                <Text style={styles.lockedBadgeText}>🔒 ZADATAK OD VODITELJA (FIKSIRANO)</Text>
              </View>
              <Text style={styles.lockedVehicleId}>{vehicleId}</Text>
              <Text style={styles.lockedVehicleModel}>
                {activeOrder.vehicleDetails?.proizvodjac || ""} {activeOrder.vehicleDetails?.model || ""}
              </Text>
              <Text style={styles.lockedVehicleLocation}>
                📍 Lokacija: {activeOrder.vehicleDetails?.lokacija || "PJ Skladište"}
              </Text>

              {activeOrder.workDescription ? (
                <View style={styles.managerInstructionBox}>
                  <Text style={styles.managerInstructionLabel}>NALOG VODITELJA:</Text>
                  <Text style={styles.managerInstructionText}>{activeOrder.workDescription}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            /* SLOBODAN UNOS ZA NOVI PREGLED */
            <View>
              <Text style={styles.inputLabel}>Broj / Oznaka viljuškara:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Npr. 342 RX 17 ili SM-042"
                value={vehicleId}
                onChangeText={setVehicleId}
                autoCapitalize="characters"
              />
            </View>
          )}
        </View>

        {/* KORAK 2: VRSTA PREGLEDA & RADNI SATI (MTH) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>2. VRSTA PREGLEDA I RADNI SATI</Text>

          <View style={styles.typeSelectorRow}>
            <TouchableOpacity
              style={[styles.typeBtn, orderType === "preventive" && styles.typeBtnActivePreventive]}
              onPress={() => setOrderType("preventive")}
            >
              <Text style={[styles.typeBtnText, orderType === "preventive" && styles.typeBtnTextActive]}>
                🛡️ Redovni Pregled
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeBtn, orderType === "corrective" && styles.typeBtnActiveCorrective]}
              onPress={() => setOrderType("corrective")}
            >
              <Text style={[styles.typeBtnText, orderType === "corrective" && styles.typeBtnTextActive]}>
                ⚠️ Kvar / Popravka
              </Text>
            </TouchableOpacity>
          </View>

          {/* OBAVEZNO POLJE: MTH */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>
            Radni sati sa table (MTH) - <Text style={{ color: "#EF4444" }}>OBAVEZNO</Text>:
          </Text>
          <View style={styles.mthInputWrapper}>
            <TextInput
              style={styles.mthInput}
              placeholder="0"
              value={workHours}
              onChangeText={setWorkHours}
              keyboardType="numeric"
            />
            <Text style={styles.mthUnitText}>h</Text>
          </View>
        </View>

        {/* KORAK 3: KONTROLNA ČEK-LISTA (8 SKLOPOVA) */}
        <View style={styles.card}>
          <View style={styles.checklistTitleRow}>
            <Text style={styles.cardTitle}>3. KONTROLNA ČEK-LISTA (8 SKLOPOVA)</Text>
          </View>

          <TouchableOpacity style={styles.markAllOkBtn} onPress={handleMarkAllOk}>
            <Text style={styles.markAllOkBtnText}>✓ KLIKNI OVDJE: OZNAČI SVE KAO ISPRAVNO</Text>
          </TouchableOpacity>

          {CHECKLIST_ITEMS.map((item) => {
            const isOk = checklist[item.key]?.status === "ok";

            return (
              <View key={item.key} style={styles.checklistItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checklistLabel}>{item.label}</Text>
                  <Text style={styles.checklistDesc}>{item.desc}</Text>
                </View>

                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, isOk && styles.toggleOkActive]}
                    onPress={() =>
                      setChecklist((prev) => ({ ...prev, [item.key]: { status: "ok" } }))
                    }
                  >
                    <Text style={[styles.toggleText, isOk && styles.toggleTextActive]}>
                      ✓ Ispravno
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.toggleBtn, !isOk && styles.toggleDefectActive]}
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

        {/* KORAK 4: OPIS POSLA I MATERIJAL */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>4. OPIS OBAVLJENOG POSLA</Text>

          {/* Brzi predlošci */}
          <Text style={styles.templatesTitle}>Brzi predlošci (kliknite za dodavanje):</Text>
          <View style={styles.templatesWrap}>
            {COMMON_TEMPLATES.map((tmpl) => (
              <TouchableOpacity
                key={tmpl}
                style={styles.templateChip}
                onPress={() => handleAddTemplate(tmpl)}
              >
                <Text style={styles.templateChipText}>+ {tmpl}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Unesite detaljan opis šta je pregledano ili popravljeno..."
            value={workDescription}
            onChangeText={setWorkDescription}
            multiline
            numberOfLines={4}
          />

          <Text style={[styles.cardTitle, { marginTop: 16 }]}>UTROŠENI DIJELOVI / MATERIJAL</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Npr. 1x točak 230x75, 2L ulja HD46..."
            value={usedMaterials}
            onChangeText={setUsedMaterials}
          />
        </View>

        {/* KORAK 5: FOTOGRAFIJE (5 UGLOVA) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>5. FOTOGRAFIJE SA KAMERE (5 UGLOVA)</Text>

          {PHOTO_SLOTS.map((slot) => {
            const uri = photos[slot.key];
            return (
              <View key={slot.key} style={styles.photoRow}>
                <Text style={styles.photoSlotLabel}>{slot.label}</Text>

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
                    style={styles.cameraCaptureBtn}
                    onPress={() => handleTakePhoto(slot.key)}
                  >
                    <Text style={styles.cameraCaptureIcon}>📷</Text>
                    <Text style={styles.cameraCaptureText}>USLIKAJ</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* TASTER ZA SLANJE NALOGA */}
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
    flex: 1,
    backgroundColor: "#0f172a"
  },
  header: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#334155"
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  headerIcon: {
    fontSize: 24
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  headerSubtitle: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600"
  },
  headerBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "#10B981",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  headerBadgeText: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "900"
  },
  assignedBar: {
    backgroundColor: "#1e293b",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#334155"
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
    backgroundColor: "#334155",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#475569"
  },
  assignedPillActive: {
    backgroundColor: "#10B981",
    borderColor: "#059669"
  },
  assignedPillOrderActive: {
    backgroundColor: "#F59E0B",
    borderColor: "#D97706"
  },
  assignedPillText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "800"
  },
  assignedPillTextActive: {
    color: "#fff"
  },
  container: {
    flex: 1,
    backgroundColor: "#0f172a"
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 60
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#334155"
  },
  cardTitle: {
    color: "#fff",
    fontSize: 14,
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
  lockedHeaderRow: {
    marginBottom: 6
  },
  lockedBadgeText: {
    color: "#F59E0B",
    fontSize: 11,
    fontWeight: "900"
  },
  lockedVehicleId: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    fontFamily: "monospace"
  },
  lockedVehicleModel: {
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2
  },
  lockedVehicleLocation: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 4
  },
  managerInstructionBox: {
    backgroundColor: "#0f172a",
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
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2
  },
  inputLabel: {
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6
  },
  textInput: {
    backgroundColor: "#0f172a",
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: "#334155"
  },
  typeSelectorRow: {
    flexDirection: "row",
    gap: 8
  },
  typeBtn: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#334155"
  },
  typeBtnActivePreventive: {
    backgroundColor: "#2563EB",
    borderColor: "#3B82F6"
  },
  typeBtnActiveCorrective: {
    backgroundColor: "#DC2626",
    borderColor: "#EF4444"
  },
  typeBtnText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "900"
  },
  typeBtnTextActive: {
    color: "#fff"
  },
  mthInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#F59E0B",
    paddingHorizontal: 14
  },
  mthInput: {
    flex: 1,
    color: "#10B981",
    fontSize: 24,
    fontWeight: "900",
    fontFamily: "monospace",
    paddingVertical: 10
  },
  mthUnitText: {
    color: "#94a3b8",
    fontSize: 16,
    fontWeight: "900"
  },
  checklistTitleRow: {
    marginBottom: 10
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
    borderBottomWidth: 1,
    borderBottomColor: "#334155"
  },
  checklistLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800"
  },
  checklistDesc: {
    color: "#64748b",
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
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155"
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
    color: "#94a3b8",
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
    backgroundColor: "#0f172a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155"
  },
  templateChipText: {
    color: "#60A5FA",
    fontSize: 11,
    fontWeight: "700"
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: "top"
  },
  photoRow: {
    marginBottom: 12,
    backgroundColor: "#0f172a",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155"
  },
  photoSlotLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8
  },
  cameraCaptureBtn: {
    backgroundColor: "#334155",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  cameraCaptureIcon: {
    fontSize: 18
  },
  cameraCaptureText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900"
  },
  photoPreviewWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#10B981"
  },
  photoRetakeBtn: {
    backgroundColor: "#334155",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10
  },
  photoRetakeBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800"
  },
  submitBtn: {
    backgroundColor: "#10B981",
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 17,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "#10B981",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20
  },
  successIconText: {
    color: "#10B981",
    fontSize: 40,
    fontWeight: "900"
  },
  successTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10
  },
  successOrderBadge: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3B82F6",
    marginBottom: 14
  },
  successOrderText: {
    color: "#60A5FA",
    fontSize: 16,
    fontWeight: "900",
    fontFamily: "monospace"
  },
  successDesc: {
    color: "#94a3b8",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 30
  },
  successBtn: {
    backgroundColor: "#10B981",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 16,
    width: "100%",
    alignItems: "center"
  },
  successBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900"
  }
});
