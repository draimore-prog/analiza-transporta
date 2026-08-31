"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Vehicle } from "@/types/fleet";
import { CostItem } from "@/types/cost";
import { IDBCache } from "@/lib/idbCache";
import { MASTER_CACHE_KEY, DATASET_CACHE_KEY } from "@/lib/constants";
import { cleanVehicleType } from "@/lib/calculations";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where } from "firebase/firestore";

export function useFleetData() {
  const [masterFleet, setMasterFleet] = useState<Vehicle[]>([]);
  const [costData, setCostData] = useState<CostItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState<string>("Učitavanje baze podataka...");

  // Load Initial Master Fleet
  const loadMasterFleet = useCallback(async () => {
    try {
      const cached = await IDBCache.get<Vehicle[]>(MASTER_CACHE_KEY);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setMasterFleet(cached);
      } else {
        const res = await fetch("/fleet_master.json");
        if (res.ok) {
          const data: Vehicle[] = await res.json();
          setMasterFleet(data);
          IDBCache.set(MASTER_CACHE_KEY, data);
        }
      }
    } catch (e) {
      console.warn("Notice loading master fleet:", e);
    }
  }, []);

  // Load Initial Cost Data
  const loadCostData = useCallback(async () => {
    try {
      const cached = await IDBCache.get<CostItem[]>(DATASET_CACHE_KEY);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setCostData(cached);
      } else {
        const res = await fetch("/fleet_data.json");
        if (res.ok) {
          const raw: CostItem[] = await res.json();
          const parsed = raw.map((c) => ({
            ...c,
            datumObj: c.datum ? new Date(c.datum) : null,
            tipMehan: cleanVehicleType(c.tipMehan)
          }));
          setCostData(parsed);
          IDBCache.set(DATASET_CACHE_KEY, parsed);
        }
      }
    } catch (e) {
      console.warn("Notice loading cost data:", e);
    }
  }, []);

  // Initialize both
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      setLoadProgress("Učitavanje baze voznog parka...");
      await loadMasterFleet();
      setLoadProgress("Učitavanje historije servisa...");
      await loadCostData();
      setIsLoading(false);
    }
    init();
  }, [loadMasterFleet, loadCostData]);

  // Live Firestore Sync for Cost Records
  useEffect(() => {
    const q = query(collection(db, "cost_records"));
    const unsub = onSnapshot(q, (snapshot) => {
      const changes = snapshot.docChanges();
      if (!changes || changes.length === 0) return;

      setCostData((prev) => {
        let updated = [...prev];
        changes.forEach((change) => {
          const item = change.doc.data() as CostItem;
          item.id = change.doc.id;
          if (item.datum && !item.datumObj) {
            item.datumObj = new Date(item.datum);
          }

          if (change.type === "added") {
            if (!updated.some((c) => c.id === item.id)) {
              updated.unshift(item);
            }
          } else if (change.type === "modified") {
            const idx = updated.findIndex((c) => c.id === item.id);
            if (idx !== -1) updated[idx] = item;
          } else if (change.type === "removed") {
            updated = updated.filter((c) => c.id !== item.id);
          }
        });
        IDBCache.set(DATASET_CACHE_KEY, updated);
        return updated;
      });
    });

    return () => unsub();
  }, []);

  // Live Firestore Sync for Master Fleet Custom Edits
  useEffect(() => {
    const q = query(collection(db, "fleet_master"), where("isCustomEdit", "==", true));
    const unsub = onSnapshot(q, (snapshot) => {
      const changes = snapshot.docChanges();
      if (!changes || changes.length === 0) return;

      setMasterFleet((prev) => {
        let updated = [...prev];
        changes.forEach((change) => {
          const v = change.doc.data() as Vehicle;
          if (v && v.reg) {
            const regUpper = v.reg.toUpperCase();
            const idx = updated.findIndex((x) => x.reg.toUpperCase() === regUpper);

            if (change.type === "added" || change.type === "modified") {
              if (idx !== -1) updated[idx] = { ...updated[idx], ...v };
              else updated.push(v);
            } else if (change.type === "removed") {
              if (idx !== -1) updated.splice(idx, 1);
            }
          }
        });
        IDBCache.set(MASTER_CACHE_KEY, updated);
        return updated;
      });
    });

    return () => unsub();
  }, []);

  // Vehicle Map Lookup
  const vehicleMap = useMemo(() => {
    const map = new Map<string, Vehicle>();
    masterFleet.forEach((v) => {
      if (v.reg) map.set(v.reg.toUpperCase(), v);
    });
    return map;
  }, [masterFleet]);

  // Warehouse Filtered Data
  const warehouseCostData = useMemo(() => {
    return costData.filter((d) => {
      const t = (d.tipMehan || "").toLowerCase();
      return t.includes("skladi") || t.includes("viljuš") || t.includes("viljusk");
    });
  }, [costData]);

  const warehouseMasterFleet = useMemo(() => {
    return masterFleet.filter((v) => {
      const t = (v.tipMehan || "").toLowerCase();
      return t.includes("skladi") || t.includes("viljuš") || t.includes("viljusk");
    });
  }, [masterFleet]);

  // Mutations
  const addCostRecord = async (newRecord: CostItem) => {
    const docRef = doc(collection(db, "cost_records"));
    const fullRecord = {
      ...newRecord,
      id: docRef.id,
      isNewCustom: true,
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, fullRecord);
  };

  const deleteCostRecord = async (recordId: string) => {
    await deleteDoc(doc(db, "cost_records", recordId));
  };

  const saveVehicle = async (vehicle: Vehicle) => {
    const docId = vehicle.reg.replace(/[\/\\#\?]/g, "_").trim();
    await setDoc(doc(db, "fleet_master", docId), { ...vehicle, isCustomEdit: true }, { merge: true });
  };

  return {
    masterFleet,
    costData,
    warehouseCostData,
    warehouseMasterFleet,
    vehicleMap,
    isLoading,
    loadProgress,
    addCostRecord,
    deleteCostRecord,
    saveVehicle
  };
}
