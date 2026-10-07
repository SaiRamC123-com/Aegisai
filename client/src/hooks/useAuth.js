import { useCallback, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";

const BYPASS = import.meta.env.VITE_DEV_BYPASS_AUTH === "true";

const DEV_USER = {
  uid: "dev-user",
  email: "dev@aegisai.local",
  displayName: "Dev Operator",
  role: "admin",
};

export default function useAuth() {
  const [user, setUser] = useState(BYPASS ? DEV_USER : null);
  const [loading, setLoading] = useState(!BYPASS);

  useEffect(() => {
    if (BYPASS || !auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      const token = await fbUser.getIdTokenResult();
      setUser({
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || fbUser.email,
        role: token.claims.role || "user",
      });
      setLoading(false);
    });
  }, []);

  const login = useCallback((email, password) => signInWithEmailAndPassword(auth, email, password), []);
  const loginWithGoogle = useCallback(() => signInWithPopup(auth, googleProvider), []);
  const logout = useCallback(() => (BYPASS ? Promise.resolve() : signOut(auth)), []);

  return { user, loading, login, loginWithGoogle, logout, bypass: BYPASS };
}