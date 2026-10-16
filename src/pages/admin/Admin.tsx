import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Ban, Check, Flag, Search, ShieldCheck, Trash2, TriangleAlert, Undo2, X } from "lucide-react";
import type { DisputeOutcome } from "@/types/models";
import { useSession } from "@/hooks/useSession";
import { useAsync } from "@/hooks/useAsync";
import { RequireAuth } from "@/components/auth/SignIn";
import { actionReport, getDisputes, getReports, ruleDispute, type DisputeCase, type ReportAction, type ReportCase } from "@/services/admin";
import { AsyncView, EmptyState, RowSkeleton } from "@/components/ui/states";
import { Avatar, Badge, Chip, Notice, Segmented } from "@/components/ui/primitives";
import { Button, IconButton } from "@/components/ui/Button";
import { Modal, useToast } from "@/components/ui/overlay";
import { ListingImage } from "@/components/listing/ListingImage";
import { STATUS_META } from "@/lib/orderState";
import { formatDate, formatMoney } from "@/lib/format";

const REASON: Record<string, string> = {
  not_as_described: "Not as described", not_received: "Not received", damaged: "Damaged", safety_concern: "Safety concern", other: "Other",
  prohibited_item: "Prohibited item", recalled_item: "Recalled / expired item", misleading: "Misleading", scam: "Possible scam", offensive: "Offensive",
};

export default function Admin() {
  return (
    <RequireAuth title="Admin sign-in required">
      <AdminInner />
    </RequireAuth>
  );
}

function AdminInner() {
  const { user } = useSession();
  const nav = useNavigate();
  const [tab, setTab] = useState<"disputes" | "reports">("disputes");
  if (!user?.isAdmin) return <div className="page"><EmptyState illustration="shield" title="Admins only" body="You don't have access to moderation." /></div>;
  return (
    <div className="page">
      <div className="flex items-center gap-3">
        <IconButton label="Back" variant="surface" onClick={() => nav(-1)}><ArrowLeft className="h-5 w-5" /></IconButton>
        <span className="flex h-11 w-11 items-center justify-center rounded-md bg-lilac-soft text-lilac"><ShieldCheck className="h-5 w-5" aria-hidden /></span>
        <div>
          <h1 className="text-h1">Moderation</h1>
          <p className="text-caption text-muted">Kindo platform admin · disputes &amp; listing reports</p>
        </div>
      </div>
      <Segmented
        label="Moderation queue"
        className="mt-4 w-full"
        value={tab}
        onChange={setTab}
        options={[
          { value: "disputes", label: <><ShieldCheck className="h-4 w-4" aria-hidden /> Disputes</> },
          { value: "reports", label: <><Flag className="h-4 w-4" aria-hidden /> Reports</> },
        ]}
      />
      <div className="mt-4">{tab === "disputes" ? <Disputes /> : <Reports />}</div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value?: number; accent?: boolean }) {
  return (
    <div className="card p-3 text-center">
      <p className={accent ? "text-h2 font-sans text-lilac" : "text-h2 font-sans"}>{value ?? "–"}</p>
      <p className="text-micro font-semibold uppercase text-muted">{label}</p>
    </div>
  );
}

function Disputes() {
  const state = useAsync(getDisputes, [], ["admin"]);
  const [filter, setFilter] = useState<"all" | "needs_ruling" | "resolved">("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<DisputeCase | null>(null);
  const d = state.data ?? [];
  const list = d
    .filter((x) => filter === "all" || x.status === filter)
    .filter((x) => !q || `${x.caseNumber} ${x.order.items[0]?.title} ${x.buyer.name} ${x.seller.name}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Total" value={state.data?.length} />
        <Stat label="Needs ruling" value={state.data?.filter((x) => x.status === "needs_ruling").length} accent />
        <Stat label="Resolved" value={state.data?.filter((x) => x.status === "resolved").length} />
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input className="input rounded-full pl-10" placeholder="Search by item, case, buyer or seller" aria-label="Search disputes" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {(["all", "needs_ruling", "resolved"] as const).map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f === "all" ? "All" : f === "needs_ruling" ? "Needs ruling" : "Resolved"}</Chip>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <AsyncView
          state={{ ...state, data: state.data ? list : undefined }}
          skeleton={<RowSkeleton />}
          empty={<EmptyState illustration="shield" title={d.length ? "No cases match" : "No disputes yet"} body={d.length ? undefined : "When buyers raise an issue on an order, it'll appear here for you to review and rule on."} />}
        >
          {(rows) => (
            <ul className="space-y-3">
              {rows.map((x) => (
                <li key={x.id}>
                  <button type="button" onClick={() => setOpen(x)} className="card flex w-full items-center gap-3 p-3 text-left transition hover:shadow-pop">
                    <span className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-2"><ListingImage photo={x.order.items[0]?.photo} iconSize={24} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{x.order.items[0]?.title}</span>
                      <span className="block text-caption text-muted">{x.caseNumber} · {REASON[x.reason]} · opened {formatDate(x.openedAt)}</span>
                      <span className="block text-caption text-muted">{x.buyer.name.split(" ")[0]} (buyer) vs {x.seller.name.split(" ")[0]} (seller) · {formatMoney(x.order.pricing.total)}</span>
                    </span>
                    <Badge tone={x.status === "needs_ruling" ? "lilac" : "success"}>{x.status === "needs_ruling" ? "Needs ruling" : "Resolved"}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </AsyncView>
      </div>
      <DisputeModal dispute={open} onClose={() => setOpen(null)} />
    </>
  );
}

function DisputeModal({ dispute: d, onClose }: { dispute: DisputeCase | null; onClose: () => void }) {
  const [outcome, setOutcome] = useState<DisputeOutcome>("refund_buyer");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  if (!d) return null;
  const resolved = d.status === "resolved";
  return (
    <Modal
      open
      onClose={onClose}
      title={`Case ${d.caseNumber}`}
      size="lg"
      footer={
        !resolved && (
          <Button
            full
            loading={busy}
            disabled={outcome === "partial_refund" && !(Number(amount) > 0)}
            onClick={async () => {
              setBusy(true);
              try {
                await ruleDispute(d.id, outcome, note.trim(), Number(amount)); // TODO(stripe): refund / transfer
                toast("Ruling saved — both parties notified");
                onClose();
              } catch (e) {
                toast((e as Error).message, "error");
              } finally {
                setBusy(false);
              }
            }}
          >
            Save ruling
          </Button>
        )
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-2"><ListingImage photo={d.order.items[0]?.photo} iconSize={24} /></span>
          <div className="min-w-0">
            <Link to={`/orders/${d.order.id}`} className="font-medium hover:underline">{d.order.items[0]?.title}</Link>
            <p className="text-caption text-muted">Order {d.order.number} · {STATUS_META[d.order.status].label} · paid {formatMoney(d.order.pricing.total)}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[["Buyer", d.buyer, d.details], ["Seller", d.seller, d.sellerResponse ?? "No response yet."]].map(([role, u, text]) => (
            <div key={role as string} className="rounded-md bg-surface-2 p-3">
              <p className="flex items-center gap-2 text-caption font-semibold">
                <Avatar name={(u as DisputeCase["buyer"]).name} color={(u as DisputeCase["buyer"]).avatarColor} size={22} /> {role as string}: {(u as DisputeCase["buyer"]).name}
              </p>
              <p className="mt-1 text-body">{text as string}</p>
            </div>
          ))}
        </div>
        <Badge tone="warn">{REASON[d.reason]}</Badge>
        {resolved ? (
          <Notice tone="success" icon={<Check className="h-4 w-4" />} title={`Resolved ${d.resolvedAt ? formatDate(d.resolvedAt) : ""}`}>
            {d.outcome === "refund_buyer" ? "Buyer refunded in full." : d.outcome === "partial_refund" ? `Partial refund of ${formatMoney(d.refundAmount ?? 0)}.` : "Payment released to seller."} {d.adminNote}
          </Notice>
        ) : (
          <>
            <fieldset>
              <legend className="label">Ruling</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {([
                  ["refund_buyer", "Refund buyer", Undo2],
                  ["partial_refund", "Partial refund", Undo2],
                  ["release_to_seller", "Release to seller", Check],
                ] as const).map(([v, label, Icon]) => (
                  <label key={v} className={`flex min-h-tap cursor-pointer items-center gap-2 rounded-md border px-3 ${outcome === v ? "border-ink bg-surface-2" : "border-line"}`}>
                    <input type="radio" name="outcome" className="sr-only" checked={outcome === v} onChange={() => setOutcome(v)} />
                    <Icon className="h-4 w-4" aria-hidden /> {label}
                  </label>
                ))}
              </div>
            </fieldset>
            {outcome === "partial_refund" && (
              <div>
                <label className="label" htmlFor="partial">Refund amount (max {formatMoney(d.order.pricing.total)})</label>
                <input id="partial" className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
              </div>
            )}
            <div>
              <label className="label" htmlFor="note">Note to both parties</label>
              <textarea id="note" className="input min-h-[80px] py-2" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function Reports() {
  const state = useAsync(getReports, [], ["admin"]);
  const toast = useToast();
  const [confirm, setConfirm] = useState<{ r: ReportCase; action: ReportAction } | null>(null);
  const open = state.data?.filter((r) => r.status === "open").length;
  const label: Record<ReportAction, string> = { remove_listing: "Remove listing", warn_user: "Warn seller", suspend_user: "Suspend seller", dismiss: "Dismiss" };
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Total" value={state.data?.length} />
        <Stat label="Open" value={open} accent />
        <Stat label="Closed" value={state.data ? state.data.length - (open ?? 0) : undefined} />
      </div>
      <div className="mt-4">
        <AsyncView state={state} skeleton={<RowSkeleton />} empty={<EmptyState illustration="flag" title="No reports" body="Listings reported by the community will appear here." />}>
          {(rows) => (
            <ul className="space-y-3">
              {rows.map((r) => (
                <li key={r.id} className="card p-3">
                  <div className="flex items-center gap-3">
                    <Link to={`/listing/${r.listing.id}`} className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-2"><ListingImage photo={r.listing.photos[0]} iconSize={24} /></Link>
                    <div className="min-w-0 flex-1">
                      <Link to={`/listing/${r.listing.id}`} className="block truncate font-medium hover:underline">{r.listing.title}</Link>
                      <p className="text-caption text-muted">{REASON[r.reason]} · reported by {r.reporter.name.split(" ")[0]} · {formatDate(r.createdAt)}</p>
                      <p className="text-caption text-muted">Seller: {r.seller.name}{r.seller.status && r.seller.status !== "active" ? ` (${r.seller.status})` : ""}</p>
                    </div>
                    <Badge tone={r.status === "open" ? "lilac" : "neutral"}>{r.status === "open" ? "Open" : r.action?.replace("_", " ") ?? r.status}</Badge>
                  </div>
                  {r.details && <p className="mt-2 rounded-md bg-surface-2 p-2 text-caption">{r.details}</p>}
                  {r.status === "open" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirm({ r, action: "remove_listing" })}>Remove listing</Button>
                      <Button size="sm" variant="secondary" icon={<TriangleAlert className="h-4 w-4" />} onClick={() => setConfirm({ r, action: "warn_user" })}>Warn seller</Button>
                      <Button size="sm" variant="secondary" icon={<Ban className="h-4 w-4" />} onClick={() => setConfirm({ r, action: "suspend_user" })}>Suspend seller</Button>
                      <Button size="sm" variant="ghost" icon={<X className="h-4 w-4" />} onClick={() => setConfirm({ r, action: "dismiss" })}>Dismiss</Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </AsyncView>
      </div>
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm ? label[confirm.action] : ""}
        footer={
          <Button
            full
            variant={confirm?.action === "dismiss" ? "primary" : "danger"}
            onClick={async () => {
              await actionReport(confirm!.r.id, confirm!.action);
              toast("Done");
              setConfirm(null);
            }}
          >
            Confirm
          </Button>
        }
      >
        {confirm && (
          <p className="text-body">
            {confirm.action === "remove_listing" && `Remove “${confirm.r.listing.title}” from Kindo?`}
            {confirm.action === "warn_user" && `Send ${confirm.r.seller.name} a formal warning?`}
            {confirm.action === "suspend_user" && `Suspend ${confirm.r.seller.name}? All their active listings will be removed.`}
            {confirm.action === "dismiss" && "Close this report with no action?"}
          </p>
        )}
      </Modal>
    </>
  );
}
