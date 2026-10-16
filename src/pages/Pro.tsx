import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Crown, X } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { useAsync } from "@/hooks/useAsync";
import { cancelPro, getSubscription, subscribePro } from "@/services/payments";
import { useAuthGuard } from "@/components/auth/SignIn";
import { Button, IconButton } from "@/components/ui/Button";
import { Badge, Segmented } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/overlay";
import { BOOST_DURATION_DAYS, BOOST_PRICE, PRO_FREE_BOOSTS, PRO_PRICE_ANNUAL, PRO_PRICE_MONTHLY, PRO_STATS } from "@/config/business";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

const FEATURES_LIST: { label: string; free: boolean }[] = [
  { label: "List unlimited items", free: true },
  { label: "Buyer protection on every sale", free: true },
  { label: "Messages & offers", free: true },
  { label: `Listing boosts (${formatMoney(BOOST_PRICE)} each)`, free: true },
  { label: `${PRO_FREE_BOOSTS} free boosts per month`, free: false },
  { label: "Pro seller badge", free: false },
  { label: "Priority placement in search", free: false },
  { label: "Advanced sales insights", free: false },
  { label: "Dedicated seller support", free: false },
];

export default function Pro() {
  const nav = useNavigate();
  const { user } = useSession();
  const guard = useAuthGuard();
  const toast = useToast();
  const sub = useAsync(() => (user ? getSubscription() : Promise.resolve(null)), [user?.id], ["subscription"]);
  const [plan, setPlan] = useState<"pro_monthly" | "pro_annual">("pro_monthly");
  const [busy, setBusy] = useState(false);
  const active = sub.data?.status === "active";
  const savePct = Math.round((1 - PRO_PRICE_ANNUAL / (PRO_PRICE_MONTHLY * 12)) * 100);

  // Value props: real stats from config (none yet), then facts we can stand behind.
  const stats = [...PRO_STATS, { value: `${PRO_FREE_BOOSTS} free`, label: "Boosts / month" }, { value: "Pro", label: "Seller badge" }];

  return (
    <div className="page max-w-3xl">
      <div className="flex items-center gap-3">
        <IconButton label="Back" variant="surface" onClick={() => nav(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
        <h1 className="text-h1">Kindo Pro</h1>
      </div>

      <section className="bg-brand-gradient mt-4 rounded-xl p-6 text-white">
        <p className="flex items-center gap-2 text-micro font-semibold uppercase"><Crown className="h-4 w-4" aria-hidden /> Upgrade to</p>
        <p className="font-serif text-h1">Kindo Pro</p>
        <p className="mt-2 max-w-lg text-body opacity-95">Sell faster with free boosts, priority placement and a Pro badge buyers notice.</p>
        <div className={cn("mt-5 grid gap-2", stats.length >= 3 ? "grid-cols-3" : "grid-cols-2")}>
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg bg-white/20 p-3 text-center">
              <p className="text-h2 font-sans">{s.value}</p>
              <p className="text-caption opacity-90">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {active ? (
        <section className="card mt-6 p-5">
          <Badge tone="success">Active</Badge>
          <p className="mt-2 text-h3">You're on Kindo Pro ({sub.data!.plan === "pro_annual" ? "annual" : "monthly"})</p>
          <p className="text-body text-muted">{sub.data!.boostsRemaining} free boosts left this month · renews {sub.data!.renewsAt && formatDate(sub.data!.renewsAt)}</p>
          <Button className="mt-4" variant="secondary" onClick={async () => { await cancelPro(); toast("Pro will end at the end of this period"); }}>Cancel subscription</Button>
        </section>
      ) : (
        <>
          <Segmented
            label="Billing period"
            className="mt-6 w-full"
            value={plan}
            onChange={setPlan}
            options={[
              { value: "pro_monthly", label: "Monthly" },
              { value: "pro_annual", label: <>Annual <Badge tone="lilac">Save {savePct}%</Badge></> },
            ]}
          />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="card p-5">
              <p className="text-micro font-semibold uppercase text-muted">Free</p>
              <p className="text-h1 font-sans">{formatMoney(0, { whole: true })}</p>
              <ul className="mt-4 space-y-2 text-body">
                {FEATURES_LIST.map((f) => (
                  <li key={f.label} className={cn("flex gap-2", !f.free && "text-muted")}>
                    {f.free ? <Check className="h-5 w-5 shrink-0 text-success" aria-label="Included" /> : <X className="h-5 w-5 shrink-0" aria-label="Not included" />}
                    {f.label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative rounded-lg bg-ink p-5 text-on-ink shadow-pop">
              <span className="bg-brand-gradient absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-micro font-semibold text-white">Best value</span>
              <p className="text-micro font-semibold uppercase opacity-80">Pro</p>
              <p className="text-h1 font-sans">
                {plan === "pro_monthly" ? formatMoney(PRO_PRICE_MONTHLY) : formatMoney(PRO_PRICE_ANNUAL)}
                <span className="text-body opacity-80">/{plan === "pro_monthly" ? "mo" : "yr"}</span>
              </p>
              <ul className="mt-4 space-y-2 text-body">
                {FEATURES_LIST.map((f) => (
                  <li key={f.label} className="flex gap-2">
                    <Check className="h-5 w-5 shrink-0" aria-label="Included" />
                    {f.label.startsWith("Listing boosts") ? `Extra boosts ${formatMoney(BOOST_PRICE)} each (${BOOST_DURATION_DAYS} days)` : f.label}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-5"
                variant="brand"
                size="lg"
                full
                loading={busy}
                onClick={() =>
                  guard("Sign in to upgrade", async () => {
                    setBusy(true);
                    try {
                      await subscribePro(plan); // TODO(stripe): Stripe Billing checkout
                      toast("Welcome to Kindo Pro");
                    } finally {
                      setBusy(false);
                    }
                  })
                }
              >
                Upgrade to Pro
              </Button>
              <p className="mt-2 text-center text-caption opacity-80">Cancel any time.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
