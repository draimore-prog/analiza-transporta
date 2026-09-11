"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "@/lib/firebase.js";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";

// Slanje native Expo Push Notifikacija na registrovane mobilne uređaje servisera
async function dispatchPushNotificationToServisers({ title, body, data }) {
  try {
    const tokensSnap = await getDocs(collection(db, "serviser_push_tokens"));
    const tokens = [];
    tokensSnap.forEach((d) => {
      const t = d.data()?.token;
      if (t && typeof t === "string" && (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken[") || t.length > 20)) {
        tokens.push(t);
      }
    });

    if (tokens.length === 0) {
      console.log("dispatchPushNotificationToServisers: Nema registrovanih push tokena u bazi.");
      return;
    }

    const messages = tokens.map((to) => ({
      to,
      sound: "default",
      title,
      body,
      data: {
        ...data,
        _displayInForeground: true
      },
      channelId: "radni-nalozi-channel",
      priority: "high",
      badge: 1,
      ttl: 2419200
    }));

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(messages)
    });
    const resJson = await res.json().catch(() => ({}));
    console.log("Push notifikacije poslane na", tokens.length, "uređaja:", resJson);
  } catch (err) {
    console.warn("Greška pri slanju push notifikacije serviserima:", err);
  }
}

export const WORK_ORDER_STATUSES = {
  pending: { id: "pending", label: "Zadano / Čeka rad", color: "bg-amber-100 text-amber-800 border-amber-300" },
  in_progress: { id: "in_progress", label: "U toku", color: "bg-blue-100 text-blue-800 border-blue-300" },
  completed: { id: "completed", label: "Završeno - Čeka pregled", color: "bg-purple-100 text-purple-800 border-purple-300" },
  approved: { id: "approved", label: "Pregledano & Odobreno", color: "bg-emerald-100 text-emerald-800 border-emerald-300" }
};

export const CHECKLIST_ITEMS = [
  { key: "wheels", label: "Točkovi i gume", description: "Pogonski i teretni točkovi, habanje, napuknuća" },
  { key: "mast_forks", label: "Kran, viljuške i lanci", description: "Geometrija viljuški, lanac, klizači i zatezanje" },
  { key: "battery", label: "Baterija i punjač", description: "Nivo elektrolita, čistoća ćelija, kablovi i utikač" },
  { key: "hydraulics", label: "Hidraulika i ulje", description: "Cilindri podizanja/nagiba, crijeva i nivo ulja" },
  { key: "brakes", label: "Kočioni sistem", description: "Elektromagnetna i nožna radna kočnica" },
  { key: "steering_electronics", label: "Ruda i elektronika", description: "Upravljač, prekidači smjera, displej i instalacija" },
  { key: "chassis_seat", label: "Šasija i sjedište", description: "Sigurnosni pojas, mikroprekidač sjedišta, krov" },
  { key: "safety_signals", label: "Signalizacija i sigurnost", description: "Sirena, rotacija, 'blue spot' i STOP gljiva" }
];

export function useWarehouseWorkOrders() {
  const [workOrders, setWorkOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    try {
      const q = collection(db, "warehouse_work_orders");
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const orders = [];
          snapshot.forEach((d) => {
            orders.push({ id: d.id, ...d.data() });
          });
          orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          setWorkOrders(orders);
          setIsLoading(false);
        },
        (err) => {
          console.warn("Firestore warehouse_work_orders snapshot notice:", err);
          setIsLoading(false);
        }
      );
    } catch (err) {
      console.warn("Error setting up work orders snapshot:", err);
      setIsLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Generiše redni broj naloga RN-SM-YYYYMM-XXXX
  const generateOrderNumber = useCallback(() => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `RN-SM-${yearMonth}-${randomSuffix}`;
  }, []);

  // Kreiranje novog radnog naloga
  const createWorkOrder = useCallback(
    async (orderData) => {
      const orderNumber = orderData.orderNumber || generateOrderNumber();
      const docId = orderNumber.toLowerCase().replace(/[^a-z0-9-]/g, "_");

      const newOrder = {
        orderNumber,
        status: orderData.status || "pending",
        type: orderData.type || "preventive",
        priority: orderData.priority || "normal",
        createdAt: new Date().toISOString(),
        assignedTo: orderData.assignedTo || "Svi serviseri",
        createdBy: orderData.createdBy || "Dispečer",
        vehicleId: orderData.vehicleId || "",
        vehicleDetails: orderData.vehicleDetails || {},
        workHours: Number(orderData.workHours) || 0,
        checklist: orderData.checklist || {},
        workDescription: orderData.workDescription || "",
        usedMaterials: orderData.usedMaterials || "",
        photos: orderData.photos || {},
        invoices: orderData.invoices || [],
        notes: orderData.notes || "",
        reviewedBy: null,
        reviewedAt: null
      };

      await setDoc(doc(db, "warehouse_work_orders", docId), newOrder, { merge: true });

      // Slanje native Expo Push Notifikacija na mobilne telefone servisera
      dispatchPushNotificationToServisers({
        title: `🔔 NOVI RADNI NALOG: ${newOrder.vehicleId || "Skladišna mehanizacija"}`,
        body: `${newOrder.workDescription || newOrder.notes || "Dodijeljen novi nalog za pregled ili servis"}${newOrder.assignedTo ? ` (${newOrder.assignedTo})` : ""}`,
        data: {
          orderId: docId,
          orderNumber: newOrder.orderNumber,
          vehicleId: newOrder.vehicleId
        }
      });

      return { success: true, orderNumber, id: docId };
    },
    [generateOrderNumber]
  );

  // Ažuriranje radnog naloga
  const updateWorkOrder = useCallback(async (orderId, updatedFields) => {
    const docRef = doc(db, "warehouse_work_orders", orderId);
    await setDoc(
      docRef,
      {
        ...updatedFields,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  }, []);

  // Brisanje radnog naloga
  const deleteWorkOrder = useCallback(async (orderId) => {
    await deleteDoc(doc(db, "warehouse_work_orders", orderId));
  }, []);

  // Brza promjena statusa (npr. odobravanje)
  const setOrderStatus = useCallback(
    async (orderId, newStatus, reviewerName = "Administrator") => {
      const updates = {
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      if (newStatus === "approved") {
        updates.reviewedBy = reviewerName;
        updates.reviewedAt = new Date().toISOString();
      }
      await updateWorkOrder(orderId, updates);
    },
    [updateWorkOrder]
  );

  // Brojač naloga koji čekaju pregled (status === 'completed')
  const pendingReviewCount = useMemo(() => {
    return workOrders.filter((o) => o.status === "completed").length;
  }, [workOrders]);

  // Brojač aktivnih / zadanih naloga (status === 'pending' || status === 'in_progress')
  const activeAssignedCount = useMemo(() => {
    return workOrders.filter((o) => o.status === "pending" || o.status === "in_progress").length;
  }, [workOrders]);

  return {
    workOrders,
    isLoading,
    createWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
    setOrderStatus,
    pendingReviewCount,
    activeAssignedCount
  };
}
