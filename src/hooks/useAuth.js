"use client";

import { useState, useEffect, useCallback } from "react";
import { DEFAULT_APP_ROLES, SESSION_ACTIVE_USER_KEY } from "@/lib/constants.js";
import { db } from "@/lib/firebase.js";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";

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

  // Inicijalizacija aktivnog korisnika iz sesije
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_ACTIVE_USER_KEY) || localStorage.getItem(SESSION_ACTIVE_USER_KEY);
      if (stored) {
        setActiveUser(JSON.parse(stored));
      } else {
        setActiveUser(DEFAULT_SUPERADMIN);
      }
    } catch {
      setActiveUser(DEFAULT_SUPERADMIN);
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
          if (!snapshot.empty) {
            const loadedUsers = [];
            snapshot.forEach((d) => {
              const u = d.data();
              if (u && u.username) {
                loadedUsers.push(u);
              }
            });
            if (loadedUsers.length > 0) {
              setUsers(loadedUsers);
            }
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

  const loginAs = useCallback((user) => {
    setActiveUser(user);
    try {
      sessionStorage.setItem(SESSION_ACTIVE_USER_KEY, JSON.stringify(user));
      localStorage.setItem(SESSION_ACTIVE_USER_KEY, JSON.stringify(user));
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
    setActiveUser(DEFAULT_SUPERADMIN);
  }, []);

  const saveUserToFirestore = async (user) => {
    const docId = user.username.toLowerCase();
    await setDoc(doc(db, "app_users", docId), user, { merge: true });
  };

  const deleteUserFromFirestore = async (username) => {
    await deleteDoc(doc(db, "app_users", username.toLowerCase()));
  };

  const saveRoleToFirestore = async (role) => {
    await setDoc(doc(db, "app_roles", role.roleId), role, { merge: true });
  };

  const currentRole = (activeUser && roles[activeUser.role]) 
    ? roles[activeUser.role] 
    : (activeUser?.role === "warehouse_specialist" ? DEFAULT_APP_ROLES.warehouse_specialist : DEFAULT_APP_ROLES.superadmin);

  return {
    activeUser,
    users,
    roles,
    currentRole,
    isAuthReady,
    loginAs,
    logout,
    saveUserToFirestore,
    deleteUserFromFirestore,
    saveRoleToFirestore
  };
}
