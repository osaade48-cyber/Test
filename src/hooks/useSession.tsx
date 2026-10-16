import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@/types/models";
import { getSession, signInWithGoogle, signOut } from "@/services/auth";
import { subscribe } from "@/services/events";

interface SessionCtx {
  user: User | null;
  ready: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<SessionCtx>({ user: null, ready: false, signIn: async () => {}, signOut: async () => {} });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = () =>
      getSession()
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setReady(true));
    load();
    return subscribe("auth", load);
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        ready,
        signIn: async () => {
          setUser(await signInWithGoogle());
        },
        signOut: async () => {
          await signOut();
          setUser(null);
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useSession = () => useContext(Ctx);
