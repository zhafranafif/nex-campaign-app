import { getIdTokenResult, onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { auth } from "../firebase/config";
import { AuthContext, type AuthContextValue, type AuthProviderProps } from "../context/AuthContext";



export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true);
      setUser(nextUser);

      if (!nextUser) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const tokenResult = await getIdTokenResult(nextUser);

        if (!cancelled) {
          setRole(
            typeof tokenResult.claims.role === "string"
              ? tokenResult.claims.role
              : null,
          );
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error loading authentication claims:", error);
          setRole(null);
          setLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      loading,
      signIn: (email, password) =>
        signInWithEmailAndPassword(auth, email, password),
      signOut: () => signOut(auth),
    }),
    [loading, role, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};