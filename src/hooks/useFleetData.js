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

  // Učitavanje matične baze voznog parka (1.236 vozila / 938 aktivnih)
  const loadMasterFleet = useCallback(async () => {
    try {
      const cached = await IDBCache.get(MASTER_CACHE_KEY);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        const cleaned = cached.map((v) => ({
          ...v,
          tipMehan: cleanVehicleType(v.tipMehan)
        }));
        setMasterFleet(cleaned);
      } else {
        const res = await fetch("/fleet_master.json");
        if (res.ok) {
          const raw = await res.json();
          const list = Array.isArray(raw) ? raw : (raw.records || []);
          const cleaned = list.map((v) => ({
            ...v,
            tipMehan: cleanVehicleType(v.tipMehan)
          }));
          setMasterFleet(cleaned);
          IDBCache.set(MASTER_CACHE_KEY, cleaned);
        }
      }
    } catch (e) {
      console.warn("Notice loading master fleet:", e);
    }
  }, []);

  // Učitavanje historije troškova i servisa (30.814 transakcija)
  const loadCostData = useCallback(async () => {
    try {
      const cached = await IDBCache.get(DATASET_CACHE_KEY);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        // Obnovi Date objekte iz keša
        const revived = cached.map((c) => ({
          ...c,
          datumObj: c.datum ? new Date(c.datum) : (c.datumObj ? new Date(c.datumObj) : null),
          cost: parseFloat(c.cost || 0) || 0,
          year: parseInt(c.year) || 2026,
          month: parseInt(c.month) || 1,
          tipMehan: cleanVehicleType(c.tipMehan)
        }));
        setCostData(revived);
      } else {
        const res = await fetch("/fleet_data.json");
        if (res.ok) {
          const raw = await res.json();
          const list = Array.isArray(raw) ? raw : (raw.records || []);
          const parsed = list.map((c) => {
            const datumObj = c.datum ? new Date(c.datum) : null;
            return {
              ...c,
              datumObj,
              cost: parseFloat(c.cost || 0) || 0,
              year: parseInt(c.year) || (datumObj ? datumObj.getFullYear() : 2026),
              month: parseInt(c.month) || (datumObj ? datumObj.getMonth() + 1 : 1),
              tipMehan: cleanVehicleType(c.tipMehan)
            };
          });
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
              item.cost = parseFloat(item.cost || 0) || 0;
              item.year = parseInt(item.year) || (item.datumObj ? item.datumObj.getFullYear() : 2026);
              item.month = parseInt(item.month) || (item.datumObj ? item.datumObj.getMonth() + 1 : 1);
              item.tipMehan = cleanVehicleType(item.tipMehan);

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
                const cleanV = {
                  ...v,
                  tipMehan: cleanVehicleType(v.tipMehan)
                };
                const regUpper = v.reg.toUpperCase();
                const idx = updated.findIndex((x) => x.reg.toUpperCase() === regUpper);

                if (change.type === "added" || change.type === "modified") {
                  if (idx !== -1) updated[idx] = { ...updated[idx], ...cleanV };
                  else updated.push(cleanV);
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
      tipMehan: cleanVehicleType(newRecord.tipMehan),
      isNewCustom: true,
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, fullRecord);
  };

  const deleteCostRecord = async (recordId) => {
    await deleteDoc(doc(db, "cost_records", recordId));
  };

  const updateCostRecord = async (recordId, updatedFields) => {
    const cleanFields = { ...updatedFields };
    if (cleanFields.tipMehan) {
      cleanFields.tipMehan = cleanVehicleType(cleanFields.tipMehan);
    }
    cleanFields.updatedAt = new Date().toISOString();
    await setDoc(doc(db, "cost_records", recordId), cleanFields, { merge: true });
  };

  const saveVehicle = async (vehicle) => {
    const docId = vehicle.reg.replace(/[\/\\#\?]/g, "_").trim();
    const cleanV = {
      ...vehicle,
      tipMehan: cleanVehicleType(vehicle.tipMehan),
      isCustomEdit: true
    };
    await setDoc(doc(db, "fleet_master", docId), cleanV, { merge: true });
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
    updateCostRecord,
    deleteCostRecord,
    saveVehicle
  };
}
