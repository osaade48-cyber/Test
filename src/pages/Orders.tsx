import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { RequireAuth } from "@/components/auth/SignIn";
import { useAsync } from "@/hooks/useAsync";
import { getOrders } from "@/services/orders";
import { AsyncView, EmptyState, RowSkeleton } from "@/components/ui/states";
import { Badge, Segmented } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/Button";
import { ListingImage } from "@/components/listing/ListingImage";
import { STATUS_META } from "@/lib/orderState";
import { formatDate, formatMoney } from "@/lib/format";

export default function Orders() {
  return (
    <RequireAuth title="Sign in to see your orders">
      <OrdersInner />
    </RequireAuth>
  );
}

function OrdersInner() {
  const [sp, setSp] = useSearchParams();
  const tab = sp.get("tab") === "sales" ? "seller" : "buyer";
  const state = useAsync(() => getOrders(tab), [tab], ["orders"]);
  return (
    <div className="page max-w-3xl">
      <h1 className="text-h1">Orders</h1>
      <Segmented
        label="Orders"
        className="mt-4 w-full sm:w-auto"
        value={tab}
        onChange={(v) => setSp(v === "seller" ? { tab: "sales" } : {}, { replace: true })}
        options={[
          { value: "buyer", label: "Purchases" },
          { value: "seller", label: "Sales" },
        ]}
      />
      <div className="mt-4">
        <AsyncView
          state={state}
          skeleton={<RowSkeleton />}
          empty={
            tab === "buyer" ? (
              <EmptyState illustration="box" title="No purchases yet" body="When you buy something, you'll track it here." action={<ButtonLink to="/browse">Browse listings</ButtonLink>} />
            ) : (
              <EmptyState illustration="tag" title="No sales yet" body="Your sold items and handovers will appear here." action={<ButtonLink to="/sell" variant="brand">List an item</ButtonLink>} />
            )
          }
        >
          {(orders) => (
            <ul className="space-y-3">
              {orders.map((o) => {
                const meta = STATUS_META[o.status];
                const other = tab === "buyer" ? o.seller : o.buyer;
                return (
                  <li key={o.id}>
                    <Link to={`/orders/${o.id}`} className="card flex items-center gap-3 p-3 transition hover:shadow-pop">
                      <span className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-surface-2">
                        <ListingImage photo={o.items[0].photo} iconSize={28} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {o.items[0].title}
                          {o.items.length > 1 && ` + ${o.items.length - 1} more`}
                        </span>
                        <span className="block text-caption text-muted">
                          {o.number} · {tab === "buyer" ? "from" : "to"} {other.name.split(" ")[0]} · {formatDate(o.createdAt)}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                          <span className="text-caption font-medium">{formatMoney(tab === "buyer" ? o.pricing.total : o.pricing.itemSubtotal)}</span>
                        </span>
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden />
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
