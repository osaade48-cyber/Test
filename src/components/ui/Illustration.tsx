import { Bell, Baby, Heart, MessageCircle, Package, Search, ShieldCheck, ShoppingBag, Tag, Wallet, Flag, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

const ICONS = {
  heart: Heart,
  chat: MessageCircle,
  box: Package,
  search: Search,
  shield: ShieldCheck,
  bell: Bell,
  tag: Tag,
  baby: Baby,
  bag: ShoppingBag,
  wallet: Wallet,
  flag: Flag,
  sparkles: Sparkles,
};

export type IllustrationName = keyof typeof ICONS;

/** Small, friendly spot illustration for empty states. */
export function Illustration({ name, className }: { name: IllustrationName; className?: string }) {
  const Icon = ICONS[name];
  return (
    <div className={cn("relative", className)} aria-hidden>
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full">
        <path d="M60 8c26 0 50 16 52 44s-18 58-50 60S6 92 8 60 34 8 60 8z" className="fill-brand-soft" />
        <circle cx="98" cy="22" r="7" className="fill-lilac-soft" />
        <circle cx="18" cy="96" r="5" className="fill-sky-soft" />
        <path d="M100 92c3-4 9-2 8 3-1 4-8 8-8 8s-7-4-8-8c-1-5 5-7 8-3z" className="fill-brand/30" />
      </svg>
      <Icon className="absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 text-brand" strokeWidth={1.6} />
    </div>
  );
}
