import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, HandCoins, Info, Send } from "lucide-react";
import type { Offer } from "@/types/models";
import { RequireAuth } from "@/components/auth/SignIn";
import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/hooks/useSession";
import { acceptOffer, counterOffer, declineOffer, getConversations, getThread, sendMessage, type ConversationThread } from "@/services/messages";
import { checkoutPath } from "@/services/checkout";
import { AsyncView, EmptyState, ErrorState, RowSkeleton } from "@/components/ui/states";
import { Avatar, Badge, Skeleton } from "@/components/ui/primitives";
import { Button, IconButton } from "@/components/ui/Button";
import { Modal, useToast } from "@/components/ui/overlay";
import { ListingImage } from "@/components/listing/ListingImage";
import { availableMethods } from "@/lib/pricing";
import { formatMoney, formatRelative, formatTimeLeft } from "@/lib/format";
import { cn } from "@/lib/cn";
import { FEATURES } from "@/config/business";

export default function Messages() {
  return (
    <RequireAuth title="Sign in to see your messages">
      <MessagesInner />
    </RequireAuth>
  );
}

function MessagesInner() {
  const { id } = useParams();
  const list = useAsync(getConversations, [], ["messages"]);
  return (
    <div className="mx-auto flex w-full max-w-6xl lg:h-[calc(100vh-73px)] lg:px-8 lg:py-6">
      <aside className={cn("w-full shrink-0 lg:block lg:w-[340px] lg:overflow-y-auto lg:border-r lg:border-line lg:pr-4", id && "hidden")}>
        <div className="px-gutter py-5 lg:px-0 lg:pt-0">
          <h1 className="text-h1">Messages</h1>
        </div>
        <div className="px-gutter lg:px-0">
          <AsyncView
            state={list}
            skeleton={<RowSkeleton />}
            empty={<EmptyState illustration="chat" title="No messages yet" body="Questions and offers you send to sellers will show up here." />}
          >
            {(convs) => (
              <ul className="space-y-1">
                {convs.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/messages/${c.id}`}
                      className={cn("flex items-center gap-3 rounded-md p-2.5 transition hover:bg-surface", id === c.id && "bg-surface shadow-card")}
                    >
                      <span className="relative">
                        <Avatar name={c.other.name} color={c.other.avatarColor} size={44} />
                        <span className="absolute -bottom-1 -right-1 h-6 w-6 overflow-hidden rounded-sm border-2 border-bg bg-surface-2">
                          <ListingImage photo={c.listing?.photos[0]} iconSize={12} />
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={cn("truncate", c.unreadCount ? "font-semibold" : "font-medium")}>{c.other.name.split(" ")[0]}</span>
                          <span className="shrink-0 text-caption text-muted">{formatRelative(c.lastMessageAt)}</span>
                        </span>
                        <span className="block truncate text-caption text-muted">{c.listing?.title}</span>
                        <span className={cn("block truncate text-caption", c.unreadCount ? "font-medium text-ink" : "text-muted")}>
                          {c.lastMessage?.offerId ? "Offer" : c.lastMessage?.body}
                        </span>
                      </span>
                      {c.unreadCount > 0 && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AsyncView>
        </div>
      </aside>
      <section className={cn("min-w-0 flex-1 lg:flex lg:pl-6", !id && "hidden lg:flex")}>
        {id ? <Thread id={id} /> : <EmptyState illustration="chat" title="Pick a conversation" className="m-auto" />}
      </section>
    </div>
  );
}

function Thread({ id }: { id: string }) {
  const { user } = useSession();
  const nav = useNavigate();
  const toast = useToast();
  const state = useAsync(() => getThread(id), [id], ["messages"]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [state.data?.messages.length]);

  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (!state.data)
    return (
      <div className="w-full space-y-3 p-gutter">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="ml-auto h-10 w-2/3" />
        <Skeleton className="h-10 w-1/2" />
      </div>
    );

  const t = state.data;
  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendMessage(id, text);
      setText("");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex w-full flex-col lg:card lg:overflow-hidden">
      <header className="sticky top-[57px] z-10 flex items-center gap-3 border-b border-line bg-bg/95 px-gutter py-2 backdrop-blur lg:static lg:bg-surface lg:px-4">
        <IconButton label="Back to messages" className="lg:hidden" onClick={() => nav("/messages")}>
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
        <Avatar name={t.other.name} color={t.other.avatarColor} size={36} />
        <div className="min-w-0 flex-1">
          <Link to={`/u/${t.other.id}`} className="font-semibold hover:underline">{t.other.name.split(" ")[0]}</Link>
          {t.other.responseTimeHours != null && <p className="text-caption text-muted">Usually replies in ~{t.other.responseTimeHours} h</p>}
        </div>
      </header>
      {t.listing && (
        <Link to={`/listing/${t.listing.id}`} className="flex items-center gap-3 border-b border-line bg-surface-2/60 px-gutter py-2 lg:px-4">
          <span className="h-11 w-11 shrink-0 overflow-hidden rounded-sm bg-surface-2">
            <ListingImage photo={t.listing.photos[0]} iconSize={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-caption font-medium">{t.listing.title}</span>
            <span className="block text-caption text-muted">{formatMoney(t.listing.price)} · {t.listing.status === "active" ? "Available" : t.listing.status}</span>
          </span>
        </Link>
      )}
      <div className="flex-1 space-y-3 overflow-y-auto px-gutter py-4 lg:px-4" aria-live="polite">
        {t.messages.map((m) => {
          if (m.system)
            return (
              <p key={m.id} className="mx-auto flex max-w-md items-start gap-2 rounded-md bg-sky-soft px-3 py-2 text-caption text-ink/80">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky" aria-hidden /> {m.body}
              </p>
            );
          const mine = m.senderId === user?.id;
          if (m.offerId) {
            const offer = t.offers.find((o) => o.id === m.offerId);
            return offer ? <OfferCard key={m.id} offer={offer} thread={t} mine={mine} /> : null;
          }
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[78%] rounded-lg px-3.5 py-2 text-body", mine ? "rounded-br-sm bg-ink text-on-ink" : "rounded-bl-sm bg-surface shadow-card")}>
                {m.body}
                <span className={cn("mt-0.5 block text-[11px]", mine ? "text-on-ink/70" : "text-muted")}>{formatRelative(m.sentAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      <form
        className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] flex gap-2 border-t border-line bg-bg/95 px-gutter py-3 backdrop-blur lg:static lg:bg-surface lg:px-4"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input className="input rounded-full" placeholder="Write a message…" aria-label="Message" value={text} onChange={(e) => setText(e.target.value)} />
        <IconButton label="Send" type="submit" variant="surface" disabled={sending || !text.trim()} className="bg-ink text-on-ink hover:bg-ink/90">
          <Send className="h-5 w-5" />
        </IconButton>
      </form>
    </div>
  );
}

function OfferCard({ offer, thread, mine }: { offer: Offer; thread: ConversationThread; mine: boolean }) {
  const { user } = useSession();
  const toast = useToast();
  const nav = useNavigate();
  const [counter, setCounter] = useState(false);
  const [busy, setBusy] = useState(false);
  const isBuyer = user?.id === offer.buyerId;
  const canRespond = offer.status === "pending" && !mine;
  const tone = { pending: "lilac", accepted: "success", declined: "neutral", expired: "neutral", countered: "neutral", withdrawn: "neutral" } as const;

  const checkout = async () => {
    const l = thread.listing;
    const method = availableMethods([l])[0];
    nav(checkoutPath({ kind: "buy_now", listingId: l.id, method, offerPrice: offer.amount }));
  };

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      toast(msg);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div className="w-full max-w-xs rounded-lg border border-line bg-surface p-3 shadow-card">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-caption font-semibold text-muted">
            <HandCoins className="h-4 w-4" aria-hidden />
            {offer.previousOfferId ? "Counter-offer" : "Offer"} · {mine ? "you" : offer.fromUserId === thread.other.id ? thread.other.name.split(" ")[0] : ""}
          </span>
          <Badge tone={tone[offer.status]}>{offer.status === "pending" ? "Pending" : offer.status[0].toUpperCase() + offer.status.slice(1)}</Badge>
        </div>
        <p className="mt-1 text-h2 font-sans">{formatMoney(offer.amount)}</p>
        <p className="text-caption text-muted">Asking {formatMoney(thread.listing.price)}</p>
        {offer.status === "pending" && (
          <p className="mt-1 inline-flex items-center gap-1 text-caption text-warn">
            <Clock className="h-3.5 w-3.5" aria-hidden /> Offer expires in {formatTimeLeft(offer.expiresAt)}
          </p>
        )}
        {canRespond && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Button size="sm" loading={busy} onClick={() => act(async () => {
              await acceptOffer(offer.id);
              if (isBuyer) await checkout();
            }, "Offer accepted")}>Accept</Button>
            {FEATURES.offerCounters && <Button size="sm" variant="secondary" onClick={() => setCounter(true)}>Counter</Button>}
            <Button size="sm" variant="ghost" onClick={() => act(() => declineOffer(offer.id), "Offer declined")}>Decline</Button>
          </div>
        )}
        {offer.status === "accepted" && isBuyer && thread.listing.status === "active" && (
          <Button className="mt-3" size="sm" full onClick={() => act(checkout, "Ready to pay")}>Check out at {formatMoney(offer.amount)}</Button>
        )}
      </div>
      <CounterModal open={counter} onClose={() => setCounter(false)} offer={offer} max={thread.listing.price} />
    </div>
  );
}

function CounterModal({ open, onClose, offer, max }: { open: boolean; onClose: () => void; offer: Offer; max: number }) {
  const [v, setV] = useState("");
  const toast = useToast();
  const n = Number(v);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Counter-offer"
      footer={
        <Button
          full
          disabled={!(n > 0 && n <= max)}
          onClick={async () => {
            try {
              await counterOffer(offer.id, n);
              toast("Counter-offer sent");
              onClose();
            } catch (e) {
              toast((e as Error).message, "error");
            }
          }}
        >
          Send {n > 0 ? formatMoney(n) : "counter"}
        </Button>
      }
    >
      <p className="text-body text-muted">They offered {formatMoney(offer.amount)}. Asking price {formatMoney(max)}.</p>
      <label className="label mt-3" htmlFor="counter">Your counter</label>
      <input id="counter" className="input" inputMode="decimal" value={v} onChange={(e) => setV(e.target.value.replace(/[^\d.]/g, ""))} />
    </Modal>
  );
}
