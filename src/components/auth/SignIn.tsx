import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { Modal } from "@/components/ui/overlay";
import { Button } from "@/components/ui/Button";
import { Illustration } from "@/components/ui/Illustration";
import { SIGN_IN_LINE } from "@/config/copy";
import { Link } from "react-router-dom";

export function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

export function GoogleButton({ onDone }: { onDone?: () => void }) {
  const { signIn } = useSession();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="secondary"
      size="lg"
      full
      loading={busy}
      icon={<GoogleMark />}
      onClick={async () => {
        setBusy(true);
        try {
          await signIn(); // TODO(auth): real Google OAuth
          onDone?.();
        } finally {
          setBusy(false);
        }
      }}
    >
      Continue with Google
    </Button>
  );
}

const Ctx = createContext<(reason?: string) => void>(() => {});

export function SignInProvider({ children }: { children: ReactNode }) {
  const [reason, setReason] = useState<string | null>(null);
  const open = useCallback((r?: string) => setReason(r ?? "Sign in to continue"), []);
  return (
    <Ctx.Provider value={open}>
      {children}
      <Modal open={reason != null} onClose={() => setReason(null)} title="Sign in to Kindo">
        <div className="flex flex-col items-center pb-2 text-center">
          <Illustration name="heart" className="mb-3 h-24 w-24" />
          <p className="text-h3 font-serif">{reason}</p>
          <p className="mb-5 mt-1 text-caption text-muted">
            <Lock className="mr-1 inline h-3.5 w-3.5" aria-hidden />
            {SIGN_IN_LINE}
          </p>
          <GoogleButton onDone={() => setReason(null)} />
          <p className="mt-4 text-caption text-muted">
            By continuing you agree to our <Link className="link" to="/terms" onClick={() => setReason(null)}>Terms</Link> and{" "}
            <Link className="link" to="/privacy" onClick={() => setReason(null)}>Privacy Policy</Link>.
          </p>
        </div>
      </Modal>
    </Ctx.Provider>
  );
}

/** Returns a guard: `guard("Sign in to save items", () => doThing())`. */
export function useAuthGuard() {
  const { user } = useSession();
  const open = useContext(Ctx);
  return useCallback(
    (reason: string, fn: () => void) => {
      if (user) fn();
      else open(reason);
    },
    [user, open],
  );
}

/** Full-page prompt for screens that need an account. */
export function SignInPage({ title = "Sign in to see this page", body }: { title?: string; body?: string }) {
  return (
    <div className="page flex max-w-md flex-col items-center py-16 text-center">
      <Illustration name="heart" className="mb-4 h-28 w-28" />
      <h1 className="text-h1">{title}</h1>
      <p className="mb-6 mt-2 text-body text-muted">{body ?? "Buy, sell and chat with Australian parents."}</p>
      <GoogleButton />
      <p className="mt-3 text-caption text-muted">
        <Lock className="mr-1 inline h-3.5 w-3.5" aria-hidden />
        {SIGN_IN_LINE}
      </p>
    </div>
  );
}

export function RequireAuth({ children, title, body }: { children: ReactNode; title?: string; body?: string }) {
  const { user, ready } = useSession();
  if (!ready) return null;
  if (!user) return <SignInPage title={title} body={body} />;
  return <>{children}</>;
}
