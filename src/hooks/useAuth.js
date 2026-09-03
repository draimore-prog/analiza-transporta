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

  // Inicijalizacija aktivnog korisnika isključivo iz sačuvane sesije
  useEffect(() => {
    try {
      const stored =
        sessionStorage.getItem(SESSION_ACTIVE_USER_KEY) ||
        localStorage.getItem(SESSION_ACTIVE_USER_KEY);
      if (stored) {
        setActiveUser(JSON.parse(stored));
      } else {
        // Ako nema aktivne sesije, korisnik je ODJAVLJEN (null)
        setActiveUser(null);
      }
    } catch {
      setActiveUser(null);
    }
    setIsAuthReady(true);
  }, []);

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
                loadedUsers.push(u);
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
        setActiveUser(foundUser);
        try {
          sessionStorage.setItem(SESSION_ACTIVE_USER_KEY, JSON.stringify(foundUser));
          if (rememberMe) {
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
    setActiveUser(user);
    try {
      sessionStorage.setItem(SESSION_ACTIVE_USER_KEY, JSON.stringify(user));
      if (rememberMe) {
        localStorage.setItem(SESSION_ACTIVE_USER_KEY, JSON.stringify(user));
      }
    } catch (e) {
      console.warn("Storage error:", e);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_ACTIVE_USER_KEY);
      localStorage.removeItem(SESSION_ACTIVE_USER_KEY);
    } catch (e) {
      console.warn("Storage error:", e);
    }
    setActiveUser(null);
  }, []);

  const saveUserToFirestore = async (user) => {
    const docId = user.username.toLowerCase();
    const cleanUser = Object.fromEntries(
      Object.entries(user).filter(([_, v]) => v !== undefined)
    );
    await setDoc(doc(db, "app_users", docId), cleanUser, { merge: true });
  };

  const deleteUserFromFirestore = async (username) => {
    await deleteDoc(doc(db, "app_users", username.toLowerCase()));
  };

  const saveRoleToFirestore = async (role) => {
    await setDoc(doc(db, "app_roles", role.roleId), role, { merge: true });
  };

  const currentRole =
    activeUser && roles[activeUser.role]
      ? roles[activeUser.role]
      : activeUser?.role === "warehouse_specialist"
      ? DEFAULT_APP_ROLES.warehouse_specialist
      : DEFAULT_APP_ROLES.superadmin;

  return {
    activeUser,
    users,
    roles,
    currentRole,
    isAuthReady,
    login,
    loginAs,
    logout,
    saveUserToFirestore,
    deleteUserFromFirestore,
    saveRoleToFirestore
  };
}
