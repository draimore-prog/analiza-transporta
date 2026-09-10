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
  { key: "wheels", label: "Točkovi i gume" },
  { key: "mast_forks", label: "Kran, viljuške i lanci" },
  { key: "battery", label: "Baterija i punjač" },
  { key: "hydraulics", label: "Hidraulika i ulje" },
  { key: "brakes", label: "Kočioni sistem" },
  { key: "steering_electronics", label: "Ruda i elektronika" },
  { key: "chassis_seat", label: "Šasija i sjedište" },
  { key: "safety_signals", label: "Signalizacija i sigurnost" }
];

const PHOTO_SLOTS = [
  { key: "front", label: "1. Pogled Naprijed" },
  { key: "back", label: "2. Pogled Nazad" },
  { key: "left", label: "3. Lijeva Strana" },
  { key: "right", label: "4. Desna Strana" },
  { key: "interior", label: "5. Radni Sati / Sjedište" }
];

export default function App() {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending"); // "pending" | "completed"

  // Forma radnog naloga
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Polja forme
  const [vehicleId, setVehicleId] = useState("");
  const [workHours, setWorkHours] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [usedMaterials, setUsedMaterials] = useState("");
  const [checklist, setChecklist] = useState({});
  const [photos, setPhotos] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Slušanje Firestore baze u realnom vremenu
  useEffect(() => {
    const q = collection(db, "warehouse_work_orders");
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setWorkOrders(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Firestore greška:", err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const pendingOrders = workOrders.filter(
    (o) => o.status === "pending" || o.status === "in_progress"
  );
  const completedOrders = workOrders.filter(
    (o) => o.status === "completed" || o.status === "approved"
  );

  // Otvaranje postojećeg dodijeljenog naloga
  const handleOpenOrder = (order) => {
    setSelectedOrder(order);
    setIsCreatingNew(false);
    setVehicleId(order.vehicleId || "");
    setWorkHours(order.workHours ? String(order.workHours) : "");
    setWorkDescription(order.workDescription || "");
    setUsedMaterials(order.usedMaterials || "");

    const initChecklist = {};
    CHECKLIST_ITEMS.forEach((item) => {
      initChecklist[item.key] = order.checklist?.[item.key] || { status: "ok" };
    });
    setChecklist(initChecklist);
    setPhotos(order.photos || {});
  };

  // Pokretanje novog naloga
  const handleStartNewOrder = () => {
    setSelectedOrder(null);
    setIsCreatingNew(true);
    setVehicleId("");
    setWorkHours("");
    setWorkDescription("");
    setUsedMaterials("");

    const initChecklist = {};
    CHECKLIST_ITEMS.forEach((item) => {
      initChecklist[item.key] = { status: "ok" };
    });
    setChecklist(initChecklist);
    setPhotos({});
  };

  // Označi sve stavke ček-liste kao ispravne
  const handleMarkAllOk = () => {
    const updated = {};
    CHECKLIST_ITEMS.forEach((item) => {
      updated[item.key] = { status: "ok" };
    });
    setChecklist(updated);
  };

  // Slikanje kamerom
  const handleTakePhoto = async (slotKey) => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Dozvola potrebna", "Molimo omogućite pristup kameri.");
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
      Alert.alert("Greška", "Nije moguće otvoriti kameru.");
    }
  };

  // Slanje naloga u Firestore
  const handleSubmitOrder = async () => {
    if (!vehicleId.trim()) {
      Alert.alert("Greška", "Unesite ili potvrdite broj viljuškara!");
      return;
    }
    if (!workHours.trim()) {
      Alert.alert("Greška", "Unesite stanje radnih sati (MTH) sa table!");
      return;
    }

    setSubmitting(true);
    try {
      if (selectedOrder && selectedOrder.id) {
        // Ažuriraj postojeći nalog
        const docRef = doc(db, "warehouse_work_orders", selectedOrder.id);
        await updateDoc(docRef, {
          workHours: Number(workHours) || 0,
          checklist,
          workDescription,
          usedMaterials,
          photos,
          status: "completed",
          completedAt: new Date().toISOString()
        });
        Alert.alert("Uspjeh!", "Radni nalog je uspješno završen i poslan voditelju.");
      } else {
        // Kreiraj novi nalog
        const now = new Date();
        const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const orderNumber = `RN-SM-${yearMonth}-${randomSuffix}`;
        const docId = orderNumber.toLowerCase().replace(/[^a-z0-9-]/g, "_");

        await setDoc(doc(db, "warehouse_work_orders", docId), {
          orderNumber,
          vehicleId: vehicleId.toUpperCase().trim(),
          workHours: Number(workHours) || 0,
          checklist,
          workDescription,
          usedMaterials,
          photos,
          status: "completed",
          type: "preventive",
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          createdBy: "Serviser Mobilna App"
        });
        Alert.alert("Uspjeh!", `Radni nalog ${orderNumber} je kreiran i završen.`);
      }

      setSelectedOrder(null);
      setIsCreatingNew(false);
    } catch (err) {
      Alert.alert("Greška pri slanju", err.message || "Pokušajte ponovo.");
    } finally {
      setSubmitting(false);
    }
  };

  // PRIKAZ 2: FORMA ZA RADNI NALOG
  if (selectedOrder || isCreatingNew) {
    const isAssigned = !!selectedOrder;

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        {/* Zaglavlje forme */}
        <View style={styles.formHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setSelectedOrder(null);
              setIsCreatingNew(false);
            }}
          >
            <Text style={styles.backButtonText}>← NAZAD</Text>
          </TouchableOpacity>
          <Text style={styles.formHeaderTitle}>
            {isAssigned ? selectedOrder.orderNumber : "NOVI NALOG"}
          </Text>
        </View>

        <ScrollView style={styles.formContainer} contentContainerStyle={styles.formScrollContent}>
          {/* 1. KARTICA VILJUŠKARA (ZAKLJUČANA AKO JE OD VODITELJA) */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>1. JEDINICA MEHANIZACIJE</Text>
            {isAssigned ? (
              <View style={styles.lockedUnitBox}>
                <Text style={styles.lockedBadge}>🔒 ZADATAK OD VODITELJA (FIKSIRANO)</Text>
                <Text style={styles.unitIdText}>{vehicleId}</Text>
                <Text style={styles.unitDetailText}>
                  {selectedOrder.vehicleDetails?.proizvodjac || ""} {selectedOrder.vehicleDetails?.model || ""}
                </Text>
                <Text style={styles.unitLocationText}>
                  Lokacija: {selectedOrder.vehicleDetails?.lokacija || "PJ Skladište"}
                </Text>
                {selectedOrder.workDescription ? (
                  <View style={styles.managerInstructionBox}>
                    <Text style={styles.managerInstructionTitle}>NALOG VODITELJA:</Text>
                    <Text style={styles.managerInstructionText}>{selectedOrder.workDescription}</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View>
                <Text style={styles.inputLabel}>Broj / ID viljuškara:</Text>
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

          {/* 2. RADNI SATI (MTH) */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>2. STANJE BROJAČA SATI (MTH)</Text>
            <TextInput
              style={[styles.textInput, styles.mthInput]}
              placeholder="0 h"
              value={workHours}
              onChangeText={setWorkHours}
              keyboardType="numeric"
            />
          </View>

          {/* 3. ČEK-LISTA (8 TAČAKA) */}
          <View style={styles.card}>
            <View style={styles.checklistHeaderRow}>
              <Text style={styles.cardSectionTitle}>3. REDOVNI PREGLED (8 TAČAKA)</Text>
              <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllOk}>
                <Text style={styles.markAllBtnText}>✓ SVE ISPRAVNO</Text>
              </TouchableOpacity>
            </View>

            {CHECKLIST_ITEMS.map((item) => {
              const currentStatus = checklist[item.key]?.status || "ok";
              const isOk = currentStatus === "ok";

              return (
                <View key={item.key} style={styles.checklistItemRow}>
                  <Text style={styles.checklistItemLabel}>{item.label}</Text>
                  <View style={styles.toggleGroup}>
                    <TouchableOpacity
                      style={[styles.toggleBtn, isOk && styles.toggleBtnOkActive]}
                      onPress={() =>
                        setChecklist((prev) => ({
                          ...prev,
                          [item.key]: { status: "ok" }
                        }))
                      }
                    >
                      <Text style={[styles.toggleBtnText, isOk && styles.toggleBtnTextActive]}>
                        ISPRAVNO
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.toggleBtn, !isOk && styles.toggleBtnDefectActive]}
                      onPress={() =>
                        setChecklist((prev) => ({
                          ...prev,
                          [item.key]: { status: "defect" }
                        }))
                      }
                    >
                      <Text style={[styles.toggleBtnText, !isOk && styles.toggleBtnTextActive]}>
                        KVAR
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* 4. OPIS RADOVA I MATERIJAL */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>4. OPIS OBAVLJENOG POSLA</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Šta je urađeno na jedinici (zamijenjen točak, doliveno ulje...)"
              value={workDescription}
              onChangeText={setWorkDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={[styles.cardSectionTitle, { marginTop: 16 }]}>UTROŠENI DIJELOVI / MATERIJAL</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Npr. 1x pogonski točak 230x75, 2L HD46 ulja..."
              value={usedMaterials}
              onChangeText={setUsedMaterials}
            />
          </View>

          {/* 5. SLIKE SA KAMERE */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>5. FOTOGRAFIJE SA KAMERE (5 UGLOVA)</Text>
            <View style={styles.photoSlotsContainer}>
              {PHOTO_SLOTS.map((slot) => {
                const photoUri = photos[slot.key];
                return (
                  <View key={slot.key} style={styles.photoSlotCard}>
                    <Text style={styles.photoSlotLabel}>{slot.label}</Text>
                    {photoUri ? (
                      <View style={styles.photoPreviewWrapper}>
                        <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                        <TouchableOpacity
                          style={styles.retakeBtn}
                          onPress={() => handleTakePhoto(slot.key)}
                        >
                          <Text style={styles.retakeBtnText}>Ponovi</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.cameraBtn}
                        onPress={() => handleTakePhoto(slot.key)}
                      >
                        <Text style={styles.cameraIconText}>📷</Text>
                        <Text style={styles.cameraBtnText}>USLIKAJ</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* TASTER ZA SLANJE NALOGA */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && { opacity: 0.7 }]}
            onPress={handleSubmitOrder}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <Text style={styles.submitButtonText}>✓ ZAVRŠI I POŠALJI NALOG</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // PRIKAZ 1: POČETNI EKRAN (LISTA NALOGA I DUGME POKRENI NOVI NALOG)
  const displayedOrders = filter === "pending" ? pendingOrders : completedOrders;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      {/* Zaglavlje aplikacije */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>BINGO SERVIS</Text>
          <Text style={styles.headerSubtitle}>Skladišna Mehanizacija</Text>
        </View>
        <View style={styles.badgeOnline}>
          <Text style={styles.badgeOnlineText}>ONLINE</Text>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* GLAVNO VELIKO DUGME: POKRENI NOVI NALOG */}
        <TouchableOpacity style={styles.hugeNewOrderBtn} onPress={handleStartNewOrder}>
          <Text style={styles.hugeNewOrderBtnIcon}>➕</Text>
          <Text style={styles.hugeNewOrderBtnText}>POKRENI NOVI NALOG</Text>
        </TouchableOpacity>

        {/* SEKCIJA: RADNI NALOZI U SISTEMU */}
        <Text style={styles.sectionHeading}>📋 RADNI NALOZI U SISTEMU</Text>

        {/* DVA VELIKA FILTER TASTERA */}
        <View style={styles.filterTabsRow}>
          <TouchableOpacity
            style={[styles.filterTabBtn, filter === "pending" && styles.filterTabPendingActive]}
            onPress={() => setFilter("pending")}
          >
            <Text style={[styles.filterTabLabel, filter === "pending" && styles.filterTabTextActive]}>
              ČEKAJU NA RAD
            </Text>
            <Text style={[styles.filterTabCount, filter === "pending" && styles.filterTabTextActive]}>
              {pendingOrders.length}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTabBtn, filter === "completed" && styles.filterTabCompletedActive]}
            onPress={() => setFilter("completed")}
          >
            <Text style={[styles.filterTabLabel, filter === "completed" && styles.filterTabTextActive]}>
              ZAVRŠENI NALOZI
            </Text>
            <Text style={[styles.filterTabCount, filter === "completed" && styles.filterTabTextActive]}>
              {completedOrders.length}
            </Text>
          </TouchableOpacity>
        </View>

        {/* LISTA NALOGA */}
        {loading ? (
          <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 40 }} />
        ) : displayedOrders.length > 0 ? (
          displayedOrders.map((order) => {
            const isPending = order.status === "pending" || order.status === "in_progress";

            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderCardTopRow}>
                  <Text style={styles.orderCardNumber}>{order.orderNumber}</Text>
                  <View style={[styles.statusTag, isPending ? styles.tagPending : styles.tagCompleted]}>
                    <Text style={styles.statusTagText}>
                      {isPending ? "ČEKA RAD" : "ZAVRŠENO"}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderVehicleBox}>
                  <Text style={styles.orderVehicleId}>{order.vehicleId}</Text>
                  <Text style={styles.orderVehicleModel}>
                    {order.vehicleDetails?.proizvodjac || ""} {order.vehicleDetails?.model || ""}
                  </Text>
                  <Text style={styles.orderVehicleLocation}>
                    📍 {order.vehicleDetails?.lokacija || "PJ Centralno Skladište"}
                  </Text>
                </View>

                {order.workDescription ? (
                  <View style={styles.orderInstructionBox}>
                    <Text style={styles.orderInstructionLabel}>Zadatak voditelja:</Text>
                    <Text style={styles.orderInstructionText}>{order.workDescription}</Text>
                  </View>
                ) : null}

                {isPending ? (
                  <TouchableOpacity
                    style={styles.openOrderBtn}
                    onPress={() => handleOpenOrder(order)}
                  >
                    <Text style={styles.openOrderBtnText}>⚡ OTVORI I POPUNI NALOG</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.completedBadgeRow}>
                    <Text style={styles.completedBadgeText}>✓ Nalog je evidentiran i završen</Text>
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Nema naloga u ovoj kategoriji.</Text>
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#1e293b",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#334155"
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1
  },
  headerSubtitle: {
    color: "#10B981",
    fontSize: 13,
    fontWeight: "700"
  },
  badgeOnline: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "#10B981",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  badgeOnlineText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "900"
  },
  container: {
    flex: 1,
    backgroundColor: "#0f172a"
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  hugeNewOrderBtn: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#34D399",
    marginBottom: 20,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8
  },
  hugeNewOrderBtnIcon: {
    fontSize: 22,
    marginRight: 10,
    color: "#fff"
  },
  hugeNewOrderBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  sectionHeading: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 1
  },
  filterTabsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16
  },
  filterTabBtn: {
    flex: 1,
    backgroundColor: "#1e293b",
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#334155"
  },
  filterTabPendingActive: {
    backgroundColor: "#F59E0B",
    borderColor: "#D97706"
  },
  filterTabCompletedActive: {
    backgroundColor: "#10B981",
    borderColor: "#059669"
  },
  filterTabLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "900"
  },
  filterTabCount: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2
  },
  filterTabTextActive: {
    color: "#fff"
  },
  orderCard: {
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#334155"
  },
  orderCardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  orderCardNumber: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    fontFamily: "monospace"
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10
  },
  tagPending: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    borderColor: "#F59E0B",
    borderWidth: 1
  },
  tagCompleted: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "#10B981",
    borderWidth: 1
  },
  statusTagText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900"
  },
  orderVehicleBox: {
    backgroundColor: "#0f172a",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10
  },
  orderVehicleId: {
    color: "#60A5FA",
    fontSize: 22,
    fontWeight: "900",
    fontFamily: "monospace"
  },
  orderVehicleModel: {
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2
  },
  orderVehicleLocation: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 4
  },
  orderInstructionBox: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12
  },
  orderInstructionLabel: {
    color: "#F59E0B",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  orderInstructionText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2
  },
  openOrderBtn: {
    backgroundColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center"
  },
  openOrderBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900"
  },
  completedBadgeRow: {
    paddingVertical: 8,
    alignItems: "center"
  },
  completedBadgeText: {
    color: "#10B981",
    fontSize: 13,
    fontWeight: "700"
  },
  emptyBox: {
    padding: 40,
    alignItems: "center"
  },
  emptyText: {
    color: "#64748b",
    fontSize: 15,
    fontWeight: "700"
  },

  // FORMA STILOVI
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#334155"
  },
  backButton: {
    backgroundColor: "#334155",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 12
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12
  },
  formHeaderTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900"
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#0f172a"
  },
  formScrollContent: {
    padding: 16,
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
  cardSectionTitle: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 10
  },
  lockedUnitBox: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderColor: "#F59E0B",
    borderWidth: 2,
    borderRadius: 16,
    padding: 14
  },
  lockedBadge: {
    color: "#F59E0B",
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 6
  },
  unitIdText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    fontFamily: "monospace"
  },
  unitDetailText: {
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2
  },
  unitLocationText: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 4
  },
  managerInstructionBox: {
    backgroundColor: "#1e293b",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#F59E0B"
  },
  managerInstructionTitle: {
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
  mthInput: {
    fontSize: 22,
    fontWeight: "900",
    color: "#10B981",
    fontFamily: "monospace"
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top"
  },
  checklistHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  markAllBtn: {
    backgroundColor: "#10B981",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10
  },
  markAllBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900"
  },
  checklistItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#334155"
  },
  checklistItemLabel: {
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    paddingRight: 8
  },
  toggleGroup: {
    flexDirection: "row",
    gap: 6
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#334155"
  },
  toggleBtnOkActive: {
    backgroundColor: "#10B981"
  },
  toggleBtnDefectActive: {
    backgroundColor: "#EF4444"
  },
  toggleBtnText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "900"
  },
  toggleBtnTextActive: {
    color: "#fff"
  },
  photoSlotsContainer: {
    gap: 12
  },
  photoSlotCard: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#334155"
  },
  photoSlotLabel: {
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8
  },
  cameraBtn: {
    backgroundColor: "#334155",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  cameraIconText: {
    fontSize: 18
  },
  cameraBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900"
  },
  photoPreviewWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#10B981"
  },
  retakeBtn: {
    backgroundColor: "#334155",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10
  },
  retakeBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13
  },
  submitButton: {
    backgroundColor: "#10B981",
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5
  }
});
