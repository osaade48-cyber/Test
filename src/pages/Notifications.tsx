import { Link } from "react-router-dom";
import { Bell, BellRing, HandCoins, MessageCircle, Package, Star, TrendingDown, Wallet } from "lucide-react";
import type { NotificationKind } from "@/types/models";
import { RequireAuth } from "@/components/auth/SignIn";
import { useAsync } from "@/hooks/useAsync";
import { getNotifications, markAllRead, markRead } from "@/services/notifications";
import { AsyncView, EmptyState, RowSkeleton } from "@/components/ui/states";
import { Button } from "@/components/ui/Button";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/cn";

const ICON: Record<NotificationKind, typeof Bell> = {
  message: MessageCircle, offer: HandCoins, order: Package, saved_search: BellRing, price_drop: TrendingDown, review: Star, payout: Wallet, system: Bell,
};

export default function Notifications() {
  return (
    <RequireAuth title="Sign in to see notifications">
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const state = useAsync(getNotifications, [], ["notifications"]);
  return (
    <div className="page max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-h1">Notifications</h1>
        {state.data?.some((n) => !n.read) && <Button variant="ghost" size="sm" onClick={markAllRead}>Mark all read</Button>}
      </div>
      <div className="mt-4">
        <AsyncView state={state} skeleton={<RowSkeleton />} empty={<EmptyState illustration="bell" title="You're all caught up" body="Offers, order updates and alerts will appear here." />}>
          {(list) => (
            <ul className="card divide-y divide-line overflow-hidden">
              {list.map((n) => {
                const Icon = ICON[n.kind];
                return (
                  <li key={n.id}>
                    <Link to={n.href ?? "#"} onClick={() => markRead(n.id)} className={cn("flex gap-3 p-4 hover:bg-surface-2", !n.read && "bg-brand-soft/40")}>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-brand"><Icon className="h-5 w-5" aria-hidden /></span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block", !n.read && "font-semibold")}>{n.title}</span>
                        <span className="block text-caption text-muted">{n.body}</span>
                        <span className="block text-caption text-muted">{formatRelative(n.createdAt)}</span>
                      </span>
                      {!n.read && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </AsyncView>
      </div>
    </div>
  );
}
