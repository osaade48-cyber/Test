import { Copy, Facebook, MessageCircle, Share2 } from "lucide-react";
import type { Listing } from "@/types/models";
import { Modal, useToast } from "@/components/ui/overlay";
import { Button } from "@/components/ui/Button";
import { ListingImage } from "./ListingImage";
import { formatMoney } from "@/lib/format";
import { conditionLabel } from "@/config/taxonomy";

function shareUrl(id: string) {
  const base = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) || window.location.origin;
  return `${base}/listing/${id}`;
}

/** Share to WhatsApp / Facebook / copy link, with a preview of how it will look. */
export function ShareSheet({ open, onClose, listing }: { open: boolean; onClose: () => void; listing: Listing }) {
  const toast = useToast();
  const url = shareUrl(listing.id);
  const text = `${listing.title} — ${formatMoney(listing.price)} on Kindo`;
  const canNative = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <Modal open={open} onClose={onClose} title="Share listing">
      {/* Preview card (matches og: tags the server should render for /listing/:id) */}
      <div className="overflow-hidden rounded-lg border border-line">
        <div className="aspect-[1.91/1] bg-surface-2">
          <ListingImage photo={listing.photos[0]} iconSize={72} />
        </div>
        <div className="p-3">
          <p className="text-micro uppercase text-muted">kindo.com.au</p>
          <p className="font-semibold">{listing.title}</p>
          <p className="text-caption text-muted">
            {formatMoney(listing.price)} · {conditionLabel(listing.condition)} · {listing.location.suburb}, {listing.location.state}
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <a
          className="inline-flex min-h-tap items-center justify-center gap-2 rounded-md bg-[#1f7a4d] px-4 font-medium text-white press"
          href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle className="h-5 w-5" aria-hidden /> WhatsApp
        </a>
        <a
          className="inline-flex min-h-tap items-center justify-center gap-2 rounded-md bg-[#1659c7] px-4 font-medium text-white press"
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noreferrer"
        >
          <Facebook className="h-5 w-5" aria-hidden /> Facebook
        </a>
        <Button
          variant="secondary"
          icon={<Copy className="h-4 w-4" />}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              toast("Link copied");
            } catch {
              toast("Couldn't copy — long-press the link instead", "error");
            }
          }}
        >
          Copy link
        </Button>
        {canNative && (
          <Button variant="secondary" icon={<Share2 className="h-4 w-4" />} onClick={() => navigator.share({ title: listing.title, text, url }).catch(() => {})}>
            More…
          </Button>
        )}
      </div>
    </Modal>
  );
}
