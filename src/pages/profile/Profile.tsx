import { Link } from "react-router-dom";
import { Baby, BellRing, ChevronRight, Crown, Heart, ListChecks, LogOut, Monitor, Moon, Package, RotateCcw, ShieldCheck, Sun, Tag, User as UserIcon, Wallet, WifiOff } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { useTheme, type ThemePref } from "@/hooks/useTheme";
import { RequireAuth } from "@/components/auth/SignIn";
import { Avatar, Card, Stars, Toggle } from "@/components/ui/primitives";
import { TrustBadge } from "@/components/listing/bits";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/overlay";
import { nextTierSteps, tierLabel } from "@/lib/trust";
import { formatDate } from "@/lib/format";
import { FEATURES, PRO_FREE_BOOSTS } from "@/config/business";
import { mockFailuresEnabled, resetDemoData, setMockFailures } from "@/services/dev";
import { useState } from "react";
import { cn } from "@/lib/cn";

export default function Profile() {
  return (
    <RequireAuth title="Your Kindo profile" body="Sign in to manage purchases, payouts, alerts and more.">
      <ProfileInner />
    </RequireAuth>
  );
}

function Row({ to, icon, label, hint }: { to: string; icon: React.ReactNode; label: string; hint?: string }) {
  return (
    <Link to={to} className="flex min-h-[56px] items-center gap-3 px-4 hover:bg-surface-2">
      <span className="text-muted">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        {hint && <span className="block text-caption text-muted">{hint}</span>}
      </span>
      <ChevronRight className="h-5 w-5 text-muted" aria-hidden />
    </Link>
  );
}

function ProfileInner() {
  const { user, signOut } = useSession();
  const [theme, setTheme] = useTheme();
  const [fail, setFail] = useState(mockFailuresEnabled);
  const toast = useToast();
  if (!user) return null;
  const tier = nextTierSteps(user);
  const ic = "h-5 w-5";

  return (
    <div className="page max-w-2xl">
      <div className="flex items-center gap-4">
        <Avatar name={user.name} color={user.avatarColor} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="text-h1">{user.name}</h1>
          <p className="flex flex-wrap items-center gap-2 text-caption text-muted">
            <TrustBadge tier={user.trustTier} />
            {user.location.suburb}, {user.location.state} · joined {formatDate(user.joinedAt)}
          </p>
        </div>
      </div>

      {FEATURES.reviewsAndTrustTiers && (
        <Card className="mt-4">
          <dl className="grid grid-cols-3 text-center">
            <div>
              <dd className="flex items-center justify-center gap-1 text-h2 font-sans">{user.rating?.toFixed(1) ?? "—"}</dd>
              <dt className="text-caption text-muted">{user.rating != null ? <Stars rating={user.rating} size={11} /> : "No reviews"}</dt>
            </div>
            <div>
              <dd className="text-h2 font-sans">{user.completedSales}</dd>
              <dt className="text-caption text-muted">Completed sales</dt>
            </div>
            <div>
              <dd className="text-h2 font-sans">{user.responseTimeHours != null ? `~${user.responseTimeHours}h` : "—"}</dd>
              <dt className="text-caption text-muted">Response time</dt>
            </div>
          </dl>
          {tier.next && (
            <div className="mt-4 rounded-md bg-surface-2 p-3">
              <p className="text-caption font-semibold">Next tier: {tierLabel(tier.next)}</p>
              <ul className="mt-1 space-y-0.5 text-caption">
                {tier.steps.map((s) => (
                  <li key={s.label} className={cn(s.done ? "text-success" : "text-muted")}>{s.done ? "✓" : "○"} {s.label}</li>
                ))}
              </ul>
            </div>
          )}
          <Link to={`/u/${user.id}`} className="link mt-3 inline-flex min-h-tap items-center text-caption">View public profile</Link>
        </Card>
      )}

      <section className="card mt-4 divide-y divide-line overflow-hidden" aria-label="Buying">
        <p className="px-4 pb-1 pt-3 text-micro font-semibold uppercase text-muted">Buying</p>
        <Row to="/orders" icon={<Package className={ic} />} label="Purchases" />
        <Row to="/saved" icon={<Heart className={ic} />} label="Saved" />
        {FEATURES.savedSearches && <Row to="/profile/alerts" icon={<BellRing className={ic} />} label="Alerts" hint="Saved searches and price drops" />}
        {FEATURES.childProfiles && <Row to="/profile/little-ones" icon={<Baby className={ic} />} label="My little ones" hint="Personalised suggestions by age" />}
      </section>

      <section className="card mt-4 divide-y divide-line overflow-hidden" aria-label="Selling">
        <p className="px-4 pb-1 pt-3 text-micro font-semibold uppercase text-muted">Selling</p>
        <Row to="/my-listings" icon={<ListChecks className={ic} />} label="My listings" />
        <Row to="/orders?tab=sales" icon={<Tag className={ic} />} label="Sales" />
        <Row to="/profile/wallet" icon={<Wallet className={ic} />} label="Wallet & payouts" />
        <Row to="/pro" icon={<Crown className={ic} />} label="Kindo Pro" hint={user.isPro ? "Active" : `${PRO_FREE_BOOSTS} free boosts a month`} />
      </section>

      {user.isAdmin && (
        <section className="card mt-4 overflow-hidden" aria-label="Admin">
          <Row to="/admin" icon={<ShieldCheck className={ic} />} label="Moderation" hint="Disputes and listing reports" />
        </section>
      )}

      <section className="card mt-4 p-4" aria-label="Appearance">
        <p className="text-micro font-semibold uppercase text-muted">Appearance</p>
        <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
          {([
            ["light", "Light", Sun],
            ["dark", "Dark", Moon],
            ["system", "Auto", Monitor],
          ] as [ThemePref, string, typeof Sun][]).map(([v, label, Icon]) => (
            <button key={v} type="button" role="radio" aria-checked={theme === v} onClick={() => setTheme(v)} className={cn("flex min-h-tap items-center justify-center gap-2 rounded-md border", theme === v ? "border-ink bg-surface-2 font-medium" : "border-line")}>
              <Icon className="h-4 w-4" aria-hidden /> {label}
            </button>
          ))}
        </div>
      </section>

      {/* Demo-only tools — remove with the mock service layer */}
      <section className="card mt-4 space-y-3 p-4" aria-label="Demo tools">
        <p className="flex items-center gap-2 text-micro font-semibold uppercase text-muted"><UserIcon className="h-3.5 w-3.5" aria-hidden /> Demo tools</p>
        <Toggle
          checked={fail}
          onChange={(v) => {
            setMockFailures(v);
            setFail(v);
            toast(v ? "Service calls will now fail" : "Service calls restored");
          }}
          label="Simulate network errors"
          description="Check every screen's error state"
        />
        <Button
          variant="secondary"
          icon={<RotateCcw className="h-4 w-4" />}
          onClick={() => {
            resetDemoData();
            toast("Demo data reset");
          }}
        >
          Reset demo data
        </Button>
        {fail && <p className="flex items-center gap-1 text-caption text-warn"><WifiOff className="h-3.5 w-3.5" aria-hidden /> Errors on</p>}
      </section>

      <Button className="mt-4" variant="ghost" full icon={<LogOut className="h-4 w-4" />} onClick={signOut}>
        Sign out
      </Button>
    </div>
  );
}
