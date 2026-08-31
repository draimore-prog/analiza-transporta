"use client";

import { useState, useEffect, useCallback } from "react";
import { UserAccount } from "@/types/auth";
import { AppRole } from "@/types/roles";
import { DEFAULT_APP_ROLES, SESSION_ACTIVE_USER_KEY } from "@/lib/constants";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";

const DEFAULT_SUPERADMIN: UserAccount = {
  username: "emir.durakovic",
  fullname: "Emir Duraković",
  email: "emir.durakovic@bingotuzla.ba",
  password: "BingoTransport2026!",
  role: "superadmin"
};

export function useAuth() {
  const [activeUser, setActiveUser] = useState<UserAccount | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([DEFAULT_SUPERADMIN]);
  const [roles, setRoles] = useState<Record<string, AppRole>>(DEFAULT_APP_ROLES);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Initialize active user from storage
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

  // Listen to Firestore app_roles
  useEffect(() => {
    const unsubRoles = onSnapshot(collection(db, "app_roles"), (snapshot) => {
      if (!snapshot.empty) {
        const loadedRoles: Record<string, AppRole> = { ...DEFAULT_APP_ROLES };
        snapshot.forEach((d) => {
          const rData = d.data() as AppRole;
          if (rData && d.id) {
            loadedRoles[d.id] = { ...DEFAULT_APP_ROLES[d.id], ...rData, roleId: d.id };
          }
        });
        setRoles(loadedRoles);
      }
    });

    // Listen to Firestore app_users
    const unsubUsers = onSnapshot(collection(db, "app_users"), (snapshot) => {
      if (!snapshot.empty) {
        const loadedUsers: UserAccount[] = [];
        snapshot.forEach((d) => {
          const u = d.data() as UserAccount;
          if (u && u.username) {
            loadedUsers.push(u);
          }
        });
        if (loadedUsers.length > 0) {
          setUsers(loadedUsers);
        }
      }
    });

    return () => {
      unsubRoles();
      unsubUsers();
    };
  }, []);

  const loginAs = useCallback((user: UserAccount) => {
    setActiveUser(user);
    sessionStorage.setItem(SESSION_ACTIVE_USER_KEY, JSON.stringify(user));
    localStorage.setItem(SESSION_ACTIVE_USER_KEY, JSON.stringify(user));
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_ACTIVE_USER_KEY);
    localStorage.removeItem(SESSION_ACTIVE_USER_KEY);
    setActiveUser(DEFAULT_SUPERADMIN);
  }, []);

  const saveUserToFirestore = async (user: UserAccount) => {
    const docId = user.username.toLowerCase();
    await setDoc(doc(db, "app_users", docId), user, { merge: true });
  };

  const deleteUserFromFirestore = async (username: string) => {
    await deleteDoc(doc(db, "app_users", username.toLowerCase()));
  };

  const saveRoleToFirestore = async (role: AppRole) => {
    await setDoc(doc(db, "app_roles", role.roleId), role, { merge: true });
  };

  // Get current user's role permissions
  const currentRole: AppRole = (activeUser && roles[activeUser.role]) 
    ? roles[activeUser.role] 
    : (activeUser?.role === 'warehouse_specialist' ? DEFAULT_APP_ROLES.warehouse_specialist : DEFAULT_APP_ROLES.superadmin);

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
