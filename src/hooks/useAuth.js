"use client";

import { useState, useEffect, useCallback } from "react";
import { DEFAULT_APP_ROLES, SESSION_ACTIVE_USER_KEY } from "@/lib/constants.js";
import { db } from "@/lib/firebase.js";
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDoc, getDocs, query, where } from "firebase/firestore";

const DEFAULT_SUPERADMIN = {
  username: "emir.durakovic",
  fullname: "Emir Duraković",
  email: "emir.durakovic@bingotuzla.ba",
  password: "BingoTransport2026!",
  role: "superadmin"
};

export function useAuth() {
  const [activeUser, setActiveUser] = useState(null);
  const [users, setUsers] = useState([DEFAULT_SUPERADMIN]);
  const [roles, setRoles] = useState(DEFAULT_APP_ROLES);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [sessionTimeoutMessage, setSessionTimeoutMessage] = useState("");

  const logout = useCallback((reason = "") => {
    try {
      sessionStorage.removeItem(SESSION_ACTIVE_USER_KEY);
      localStorage.removeItem(SESSION_ACTIVE_USER_KEY);
      localStorage.removeItem("last_portal_activity_ts");
    } catch (e) {
      console.warn("Storage error:", e);
    }
    setActiveUser(null);
    setSessionTimeoutMessage(typeof reason === "string" ? reason : "");
  }, []);

  // Inicijalizacija aktivnog korisnika isključivo iz sačuvane sesije
  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(SESSION_ACTIVE_USER_KEY) ||
        sessionStorage.getItem(SESSION_ACTIVE_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setActiveUser(parsed);
        // Ako je mobilni serviser ili na telefonu, osiguraj trajnu pohranu u localStorage
        if (
          parsed?.role === "mobile_serviser" ||
          parsed?.role === "serviser" ||
          (typeof window !== "undefined" && window.__IS_NATIVE_APP)
        ) {
          try {
            localStorage.setItem(SESSION_ACTIVE_USER_KEY, JSON.stringify(parsed));
          } catch {}
        }
      } else {
        // Ako nema aktivne sesije, korisnik je ODJAVLJEN (null)
        setActiveUser(null);
      }
    } catch {
      setActiveUser(null);
    }
    setIsAuthReady(true);
  }, []);

  // Automatska odjava nakon 5 minuta neaktivnosti na portalu (5 * 60 * 1000 ms)
  // IZUZETAK: Mobilni serviseri na telefonu ostaju TRAJNO prijavljeni (bez 5-minutnog timeouta)
  useEffect(() => {
    if (!activeUser) return;

    const isMobileOrServiser =
      activeUser.role === "mobile_serviser" ||
      activeUser.role === "serviser" ||
      (typeof window !== "undefined" && (
        window.__IS_NATIVE_APP ||
        window.location.search.includes("portal=terenski-nalozi") ||
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
      ));

    // Ako je mobilni serviser ili se koristi mobilna aplikacija na telefonu, NEMA automatske odjave
    if (isMobileOrServiser) return;

    const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
    const ACTIVITY_STORAGE_KEY = "last_portal_activity_ts";

    const updateActivity = () => {
      const now = Date.now();
      try {
        localStorage.setItem(ACTIVITY_STORAGE_KEY, now.toString());
      } catch {}
    };

    // Inicijalno zabilježi aktivnost
    updateActivity();

    let lastThrottled = 0;
    const throttledHandler = () => {
      const now = Date.now();
      if (now - lastThrottled > 2000) {
        lastThrottled = now;
        updateActivity();
      }
    };

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    events.forEach((evt) => {
      window.addEventListener(evt, throttledHandler, { passive: true });
    });

    const intervalId = setInterval(() => {
      let lastActivityTime = Date.now();
      try {
        const storedTs = localStorage.getItem(ACTIVITY_STORAGE_KEY);
        if (storedTs) {
          lastActivityTime = parseInt(storedTs, 10) || lastActivityTime;
        }
      } catch {}

      const elapsed = Date.now() - lastActivityTime;
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        logout("Automatski ste odjavljeni sa sistema zbog neaktivnosti duže od 5 minuta.");
      }
    }, 5000);

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, throttledHandler);
      });
      clearInterval(intervalId);
    };
  }, [activeUser, logout]);

  // Real-time osluškivanje Firestore app_roles
  useEffect(() => {
    let unsubRoles = () => {};
    let unsubUsers = () => {};

    try {
      unsubRoles = onSnapshot(
        collection(db, "app_roles"),
        (snapshot) => {
          if (!snapshot.empty) {
            const loadedRoles = { ...DEFAULT_APP_ROLES };
            snapshot.forEach((d) => {
              const rData = d.data();
              if (rData && d.id) {
                loadedRoles[d.id] = { ...DEFAULT_APP_ROLES[d.id], ...rData, roleId: d.id };
              }
            });
            setRoles(loadedRoles);
          }
        },
        (err) => {
          console.warn("Notice: app_roles snapshot listener error:", err);
        }
      );

      // Real-time osluškivanje Firestore app_users
      unsubUsers = onSnapshot(
        collection(db, "app_users"),
        (snapshot) => {
          const loadedUsers = [];
          if (!snapshot.empty) {
            snapshot.forEach((d) => {
              const u = d.data();
              if (u && u.username) {
                loadedUsers.push({
                  ...u,
                  username: (u.username || d.id).trim().toLowerCase(),
                  _docId: d.id
                });
              }
            });
          }
          if (loadedUsers.length > 0) {
            setUsers(loadedUsers);
          } else {
            setUsers([DEFAULT_SUPERADMIN]);
          }
        },
        (err) => {
          console.warn("Notice: app_users snapshot listener error:", err);
        }
      );
    } catch (e) {
      console.warn("Firestore listeners error:", e);
    }

    return () => {
      unsubRoles();
      unsubUsers();
    };
  }, []);

  const login = useCallback(
    async (identifier, password, rememberMe = true) => {
      const idClean = (identifier || "").trim().toLowerCase();
      const passClean = (password || "").trim();

      // 1. Provjera u lokalnom state-u (brzo)
      let foundUser = users.find(
        (u) =>
          (u.username && u.username.toLowerCase() === idClean) ||
          (u.email && u.email.toLowerCase() === idClean)
      );

      // 2. Provjera default superadmina
      if (!foundUser && (DEFAULT_SUPERADMIN.username.toLowerCase() === idClean || DEFAULT_SUPERADMIN.email.toLowerCase() === idClean)) {
        foundUser = DEFAULT_SUPERADMIN;
      }

      // 3. Fallback: Ako nije u lokalnom stanju (npr. snapshot se još učitava), povuci direktno iz Firestore
      if (!foundUser) {
        try {
          const userDocSnap = await getDoc(doc(db, "app_users", idClean));
          if (userDocSnap.exists()) {
            foundUser = userDocSnap.data();
          } else {
            // Provjeri po emailu u Firestore ako je unesen email
            const q = query(collection(db, "app_users"), where("email", "==", idClean));
            const emailSnap = await getDocs(q);
            if (!emailSnap.empty) {
              foundUser = emailSnap.docs[0].data();
            }
          }
        } catch (err) {
          console.warn("Direct firestore lookup error during login:", err);
        }
      }

      if (foundUser && foundUser.password === passClean) {
        setSessionTimeoutMessage("");
        setActiveUser(foundUser);
        const shouldRemember =
          rememberMe ||
          foundUser.role === "mobile_serviser" ||
          foundUser.role === "serviser" ||
          (typeof window !== "undefined" && (
            window.__IS_NATIVE_APP ||
            window.location.search.includes("portal=terenski-nalozi") ||
            /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
          ));

        try {
          sessionStorage.setItem(SESSION_ACTIVE_USER_KEY, JSON.stringify(foundUser));
          if (shouldRemember) {
            localStorage.setItem(SESSION_ACTIVE_USER_KEY, JSON.stringify(foundUser));
          } else {
            localStorage.removeItem(SESSION_ACTIVE_USER_KEY);
          }
        } catch (e) {
          console.warn("Storage error:", e);
        }
        return { success: true, user: foundUser };
      }

      return { success: false, error: "Neispravno korisničko ime ili lozinka!" };
    },
    [users]
  );

  const loginAs = useCallback((user, rememberMe = true) => {
    setSessionTimeoutMessage("");
    setActiveUser(user);
    const shouldRemember =
      rememberMe ||
      user?.role === "mobile_serviser" ||
      user?.role === "serviser" ||
      (typeof window !== "undefined" && (
        window.__IS_NATIVE_APP ||
        window.location.search.includes("portal=terenski-nalozi") ||
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
      ));

    try {
      sessionStorage.setItem(SESSION_ACTIVE_USER_KEY, JSON.stringify(user));
      if (shouldRemember) {
        localStorage.setItem(SESSION_ACTIVE_USER_KEY, JSON.stringify(user));
      }
    } catch (e) {
      console.warn("Storage error:", e);
    }
  }, []);

  const saveUserToFirestore = async (user, oldUsername = null) => {
    const newDocId = (user.username || "").trim().toLowerCase();
    if (!newDocId) throw new Error("Korisničko ime je obavezno!");

    const cleanUser = Object.fromEntries(
      Object.entries(user).filter(([k, v]) => v !== undefined && k !== "_docId")
    );
    cleanUser.username = newDocId;

    const originalId = (oldUsername || user._docId || "").trim().toLowerCase();
    // Ako je korisničko ime promijenjeno, brišemo stari dokument da se ne stvori duplikat
    if (originalId && originalId !== newDocId) {
      try {
        await deleteDoc(doc(db, "app_users", originalId));
      } catch (err) {
        console.warn("Greška pri brisanju starog korisničkog dokumenta:", err);
      }
    }

    await setDoc(doc(db, "app_users", newDocId), cleanUser, { merge: true });

    // Ako je izmijenjen trenutno prijavljeni korisnik, sinhronizuj sesiju
    if (
      activeUser &&
      ((originalId && activeUser.username.toLowerCase() === originalId) ||
        activeUser.username.toLowerCase() === newDocId)
    ) {
      const updatedActiveUser = { ...activeUser, ...cleanUser };
      setActiveUser(updatedActiveUser);
      try {
        sessionStorage.setItem(SESSION_ACTIVE_USER_KEY, JSON.stringify(updatedActiveUser));
        if (localStorage.getItem(SESSION_ACTIVE_USER_KEY)) {
          localStorage.setItem(SESSION_ACTIVE_USER_KEY, JSON.stringify(updatedActiveUser));
        }
      } catch (e) {
        console.warn("Greška pri ažuriranju aktivne sesije:", e);
      }
    }
  };

  const deleteUserFromFirestore = async (userOrUsername) => {
    const docId = (
      typeof userOrUsername === "string"
        ? userOrUsername
        : userOrUsername?._docId || userOrUsername?.username || ""
    ).trim().toLowerCase();
    if (docId) {
      await deleteDoc(doc(db, "app_users", docId));
    }
  };

  const saveRoleToFirestore = async (role) => {
    await setDoc(doc(db, "app_roles", role.roleId), role, { merge: true });
  };

  const currentRole =
    activeUser && roles[activeUser.role]
      ? roles[activeUser.role]
      : activeUser?.role === "warehouse_specialist"
      ? DEFAULT_APP_ROLES.warehouse_specialist
      : activeUser?.role === "mobile_serviser"
      ? DEFAULT_APP_ROLES.mobile_serviser
      : activeUser?.role === "serviser"
      ? DEFAULT_APP_ROLES.serviser
      : DEFAULT_APP_ROLES.superadmin;

  return {
    activeUser,
    users,
    roles,
    currentRole,
    isAuthReady,
    sessionTimeoutMessage,
    setSessionTimeoutMessage,
    login,
    loginAs,
    logout,
    saveUserToFirestore,
    deleteUserFromFirestore,
    saveRoleToFirestore
  };
}
