import { useState, type FormEvent, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Crown,
  Heart,
  Home,
  LayoutGrid,
  ListChecks,
  MessageCircle,
  Package,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useSession } from "@/hooks/useSession";
import { useTopicValue } from "@/hooks/useAsync";
import { cartCountSync } from "@/services/cart";
import { unreadMessagesSync } from "@/services/messages";
import { unreadNotificationsSync } from "@/services/notifications";
import { savedCountSync } from "@/services/saved";
import { FEATURES, PRO_FREE_BOOSTS, PRO_PRICE_MONTHLY } from "@/config/business";
import { formatMoney } from "@/lib/format";
import { Avatar } from "@/components/ui/primitives";
import { IconButton, ButtonLink } from "@/components/ui/Button";
import { Footer } from "./Footer";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" aria-label="Kindo home" className={cn("inline-flex items-baseline", className)}>
      <span className="text-brand-gradient font-sans text-[30px] font-bold leading-none tracking-tight">Kindo</span>
    </Link>
  );
}

function useCounts() {
  const { user } = useSession();
  const messages = useTopicValue(["messages", "auth"], unreadMessagesSync);
  const notifications = useTopicValue(["notifications", "auth"], unreadNotificationsSync);
  const cart = useTopicValue(["cart", "auth"], cartCountSync);
  const saved = useTopicValue(["saved", "auth"], savedCountSync);
  return user ? { messages, notifications, cart, saved } : { messages: 0, notifications: 0, cart: 0, saved: 0 };
}

function SideLink({ to, icon, label, badge, end }: { to: string; icon: ReactNode; label: string; badge?: number; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex min-h-tap items-center gap-3 rounded-md px-3 text-body font-medium transition",
          isActive ? "bg-surface text-ink shadow-card" : "text-muted hover:bg-surface/60 hover:text-ink",
        )
      }
    >
      <span className="relative">
        {icon}
        {!!badge && (
          <span className="absolute -right-2 -top-1.5 min-w-[17px] rounded-full bg-ink px-1 text-center text-[10px] font-semibold leading-[17px] text-on-ink" aria-label={`${badge} new`}>
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      {label}
    </NavLink>
  );
}

function Sidebar() {
  const { user } = useSession();
  const counts = useCounts();
  const ic = "h-5 w-5";
  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-line bg-surface-2/60 px-4 py-6 lg:flex">
      <Logo className="px-2" />
      <p className="mt-1 px-2 text-caption text-muted">Pre-loved baby &amp; kids gear</p>
      <ButtonLink to="/sell" variant="brand" size="lg" full className="mt-6" icon={<Plus className="h-5 w-5" />}>
        List an item
      </ButtonLink>
      <nav className="mt-6 flex flex-col gap-1" aria-label="Main">
        <SideLink to="/" end icon={<Home className={ic} />} label="Home" />
        <SideLink to="/browse" icon={<LayoutGrid className={ic} />} label="Browse" />
        <SideLink to="/messages" icon={<MessageCircle className={ic} />} label="Messages" badge={counts.messages} />
        <SideLink to="/saved" icon={<Heart className={ic} />} label="Saved" />
        <SideLink to="/orders" icon={<Package className={ic} />} label="Orders" />
        <p className="mt-4 px-3 pb-1 text-micro font-semibold uppercase text-muted">Selling</p>
        <SideLink to="/my-listings" icon={<ListChecks className={ic} />} label="My listings" />
        {user?.isAdmin && (
          <>
            <p className="mt-4 px-3 pb-1 text-micro font-semibold uppercase text-muted">Admin</p>
            <SideLink to="/admin" icon={<ShieldCheck className={ic} />} label="Moderation" />
          </>
        )}
      </nav>
      {!user?.isPro && (
        <Link to="/pro" className="mt-auto flex items-center gap-3 rounded-md border border-line bg-surface p-3 transition hover:shadow-card">
          <span className="bg-brand-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-white">
            <Crown className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-caption font-semibold text-ink">Kindo Pro</span>
            <span className="block text-caption text-muted">
              {PRO_FREE_BOOSTS} free boosts · {formatMoney(PRO_PRICE_MONTHLY)}/mo
            </span>
          </span>
        </Link>
      )}
    </aside>
  );
}

function SearchBox({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [q, setQ] = useState(() => new URLSearchParams(loc.search).get("q") ?? "");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(loc.pathname === "/browse" ? loc.search : "");
    if (q.trim()) params.set("q", q.trim());
    else params.delete("q");
    nav(`/browse?${params.toString()}`);
  };
  return (
    <form role="search" onSubmit={submit} className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search brands, items, sizes…"
        aria-label="Search Kindo"
        className="h-12 w-full rounded-full border border-line bg-surface pl-12 pr-4 text-body placeholder:text-muted/80 focus:border-lilac focus:outline-none focus:ring-2 focus:ring-lilac/20"
      />
    </form>
  );
}

function HeaderActions() {
  const { user } = useSession();
  const counts = useCounts();
  const nav = useNavigate();
  return (
    <div className="flex items-center gap-1">
      <IconButton label="Notifications" badge={counts.notifications} onClick={() => nav("/notifications")}>
        <Bell className="h-5 w-5" />
      </IconButton>
      {FEATURES.bundleCart && (
        <IconButton label="Your bundle" badge={counts.cart} onClick={() => nav("/cart")}>
          <ShoppingBag className="h-5 w-5" />
        </IconButton>
      )}
      <Link
        to="/profile"
        className="ml-1 hidden min-h-tap items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-4 text-body font-medium hover:bg-surface-2 lg:inline-flex"
      >
        {user ? <Avatar name={user.name} color={user.avatarColor} size={34} /> : <UserIcon className="ml-2 h-5 w-5" aria-hidden />}
        {user ? user.name.split(" ")[0] : "Sign in"}
      </Link>
    </div>
  );
}

function BottomNav() {
  const counts = useCounts();
  const item = (to: string, label: string, icon: ReactNode, badge?: number, end?: boolean) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => cn("flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", isActive ? "text-ink" : "text-muted")}
    >
      <span className="relative">
        {icon}
        {!!badge && (
          <span className="absolute -right-2.5 -top-1 min-w-[16px] rounded-full bg-brand px-1 text-center text-[10px] font-semibold leading-4 text-white">{badge > 9 ? "9+" : badge}</span>
        )}
      </span>
      {label}
    </NavLink>
  );
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 flex items-end border-t border-line bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      {item("/", "Home", <Home className="h-6 w-6" aria-hidden />, undefined, true)}
      {item("/browse", "Search", <Search className="h-6 w-6" aria-hidden />)}
      <NavLink to="/sell" aria-label="Sell an item" className="flex flex-1 flex-col items-center pb-1.5">
        <span className="bg-brand-gradient -mt-5 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-pop ring-4 ring-bg press">
          <Plus className="h-7 w-7" aria-hidden />
        </span>
        <span className="mt-0.5 text-[11px] font-semibold text-ink">Sell</span>
      </NavLink>
      {item("/messages", "Messages", <MessageCircle className="h-6 w-6" aria-hidden />, counts.messages)}
      {item("/profile", "Profile", <UserIcon className="h-6 w-6" aria-hidden />)}
    </nav>
  );
}

/** Pages with their own sticky action bar hide the mobile bottom menu. */
const FOCUSED_PAGES = /^\/(listing|checkout)(\/|$)/;

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const focused = FOCUSED_PAGES.test(pathname);
  return (
    <div className="flex min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-on-ink">
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Desktop top bar */}
        <header className="sticky top-0 z-30 hidden items-center gap-4 border-b border-line bg-bg/90 px-8 py-3 backdrop-blur lg:flex">
          <SearchBox className="max-w-2xl flex-1" />
          <div className="ml-auto">
            <HeaderActions />
          </div>
        </header>
        {/* Mobile header — no share/save here; listing pages own those. */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/90 px-4 py-1.5 backdrop-blur lg:hidden">
          <Logo />
          <HeaderActions />
        </header>
        <main id="main" className={cn("flex-1 lg:pb-0", !focused && "pb-24")}>
          {children}
        </main>
        <Footer />
        {!focused && <div className="h-[72px] lg:hidden" aria-hidden />}
      </div>
      {!focused && <BottomNav />}
    </div>
  );
}

export { SearchBox };
