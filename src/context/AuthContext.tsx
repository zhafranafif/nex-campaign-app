import {
  createContext,
  type ReactNode,
} from "react";
import {
  type User,
  type UserCredential,
} from "firebase/auth";


export type AuthContextValue = {
  user: User | null;
  role: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export type AuthProviderProps = {
  children: ReactNode;
};

