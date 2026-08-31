"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { IDBCache } from "@/lib/idbCache.js";
import { MASTER_CACHE_KEY, DATASET_CACHE_KEY } from "@/lib/constants.js";
import { cleanVehicleType } from "@/lib/calculations.js";
import { db } from "@/lib/firebase.js";
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where } from "firebase/firestore";

export function useFleetData() {
  const [masterFleet, setMasterFleet] = useState([]);
  const [costData, setCostData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState("Učitavanje baze podataka...");

  // Učitavanje matične baze voznog parka
  const loadMasterFleet = useCallback(async () => {
    try {
      const cached = await IDBCache.get(MASTER_CACHE_KEY);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setMasterFleet(cached);
      } else {
        const res = await fetch("/fleet_master.json");
        if (res.ok) {
          const data = await res.json();
          setMasterFleet(data);
          IDBCache.set(MASTER_CACHE_KEY, data);
        }
      }
    } catch (e) {
      console.warn("Notice loading master fleet:", e);
    }
  }, []);

  // Učitavanje historije troškova i servisa
  const loadCostData = useCallback(async () => {
    try {
      const cached = await IDBCache.get(DATASET_CACHE_KEY);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setCostData(cached);
      } else {
        const res = await fetch("/fleet_data.json");
        if (res.ok) {
          const raw = await res.json();
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

  // Inicijalizacija oba dataseta
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

  // Real-time sinhronizacija troškova iz Firestore kolekcije 'cost_records'
  useEffect(() => {
    let unsub = () => {};
    try {
      const q = query(collection(db, "cost_records"));
      unsub = onSnapshot(
        q,
        (snapshot) => {
          const changes = snapshot.docChanges();
          if (!changes || changes.length === 0) return;

          setCostData((prev) => {
            let updated = [...prev];
            changes.forEach((change) => {
              const item = change.doc.data();
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
        },
        (err) => {
          console.warn("Notice: cost_records listener error:", err);
        }
      );
    } catch (e) {
      console.warn("Firestore cost_records error:", e);
    }

    return () => unsub();
  }, []);

  // Real-time sinhronizacija izmjena vozila iz Firestore kolekcije 'fleet_master'
  useEffect(() => {
    let unsub = () => {};
    try {
      const q = query(collection(db, "fleet_master"), where("isCustomEdit", "==", true));
      unsub = onSnapshot(
        q,
        (snapshot) => {
          const changes = snapshot.docChanges();
          if (!changes || changes.length === 0) return;

          setMasterFleet((prev) => {
            let updated = [...prev];
            changes.forEach((change) => {
              const v = change.doc.data();
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
        },
        (err) => {
          console.warn("Notice: fleet_master listener error:", err);
        }
      );
    } catch (e) {
      console.warn("Firestore fleet_master error:", e);
    }

    return () => unsub();
  }, []);

  // Lookup mapa
  const vehicleMap = useMemo(() => {
    const map = new Map();
    masterFleet.forEach((v) => {
      if (v.reg) map.set(v.reg.toUpperCase(), v);
    });
    return map;
  }, [masterFleet]);

  // Skladišna mehanizacija podaci
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

  // Akcije
  const addCostRecord = async (newRecord) => {
    const docRef = doc(collection(db, "cost_records"));
    const fullRecord = {
      ...newRecord,
      id: docRef.id,
      isNewCustom: true,
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, fullRecord);
  };

  const deleteCostRecord = async (recordId) => {
    await deleteDoc(doc(db, "cost_records", recordId));
  };

  const saveVehicle = async (vehicle) => {
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
