import { useState } from "react";
import { Banknote, Building2, Info, Lock } from "lucide-react";
import { RequireAuth } from "@/components/auth/SignIn";
import { useAsync } from "@/hooks/useAsync";
import { getWallet, startConnectOnboarding, withdrawAvailable } from "@/services/payments";
import { AsyncView, EmptyState, RowSkeleton } from "@/components/ui/states";
import { Badge, Card, Notice } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/overlay";
import { formatDate, formatMoney } from "@/lib/format";
import { NO_FEES_LINE, PAYOUT_RULE_MEETUP, PAYOUT_RULE_POST } from "@/config/copy";

export default function Wallet() {
  return (
    <RequireAuth title="Sign in to see your wallet">
      <WalletInner />
    </RequireAuth>
  );
}

const STATUS = { held: ["Held", "info"], available: ["Available", "success"], paid: ["Paid out", "neutral"], reversed: ["Refunded", "neutral"] } as const;

function WalletInner() {
  const state = useAsync(getWallet, [], ["orders"]);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <div className="page max-w-2xl">
      <h1 className="text-h1">Wallet</h1>
      <p className="text-caption text-muted">{NO_FEES_LINE}</p>
      <div className="mt-4">
        <AsyncView state={state} skeleton={<RowSkeleton count={3} />}>
          {(w) => (
            <>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["Held", w.held, "Waiting for buyers to confirm"],
                  ["Available", w.available, "Ready to withdraw"],
                  ["Paid out", w.paidOut, "All time"],
                ].map(([label, v, hint]) => (
                  <div key={label as string} className="card p-3">
                    <p className="text-caption text-muted">{label}</p>
                    <p className="text-h2 font-sans">{formatMoney(v as number)}</p>
                    <p className="hidden text-caption text-muted sm:block">{hint}</p>
                  </div>
                ))}
              </div>

              <Notice tone="info" className="mt-4" icon={<Info className="h-4 w-4" />} title="When you get paid">
                <span className="block">{PAYOUT_RULE_POST}</span>
                <span className="mt-1 block">{PAYOUT_RULE_MEETUP}</span>
              </Notice>

              {/* TODO(stripe): Stripe Connect Express onboarding + payouts */}
              <Card className="mt-4">
                <h2 className="flex items-center gap-2 text-h3"><Building2 className="h-5 w-5" aria-hidden /> Payout account</h2>
                {w.account.status === "active" ? (
                  <>
                    <p className="mt-2 text-body">Bank account ending •••• {w.account.bankLast4}</p>
                    <Button
                      className="mt-3"
                      icon={<Banknote className="h-4 w-4" />}
                      disabled={w.available <= 0}
                      loading={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          const amt = await withdrawAvailable();
                          toast(`${formatMoney(amt)} on its way to your bank`);
                          state.reload();
                        } catch (e) {
                          toast((e as Error).message, "error");
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Withdraw {formatMoney(w.available)}
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-body text-muted">Add your bank details with our payments partner, Stripe, to receive payouts.</p>
                    <Button className="mt-3" onClick={async () => { await startConnectOnboarding(); state.reload(); }}>Set up payouts</Button>
                  </>
                )}
                <p className="mt-3 flex items-center gap-1.5 text-caption text-muted"><Lock className="h-3.5 w-3.5" aria-hidden /> Bank details are held by Stripe, never by Kindo.</p>
              </Card>

              <h2 className="mb-2 mt-6 text-h2">History</h2>
              {w.payouts.length === 0 ? (
                <EmptyState illustration="wallet" title="No payouts yet" body="When you sell something, the payment shows up here." />
              ) : (
                <ul className="card divide-y divide-line">
                  {w.payouts.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 p-3">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{p.itemTitle}</span>
                        <span className="block text-caption text-muted">{p.orderNumber} · {formatDate(p.paidAt ?? p.createdAt)}</span>
                      </span>
                      <Badge tone={STATUS[p.status][1]}>{STATUS[p.status][0]}</Badge>
                      <span className="w-20 text-right font-medium">{formatMoney(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </AsyncView>
      </div>
    </div>
  );
}
