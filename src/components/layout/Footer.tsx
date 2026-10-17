import { Link } from "react-router-dom";
import { NO_FEES_LINE } from "@/config/copy";

const LINKS = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/buyer-protection", label: "How Buyer Protection works" },
  { to: "/safety-guide", label: "Safety guide" },
  { to: "/prohibited-items", label: "Prohibited & recalled items" },
  { to: "/terms", label: "Terms of Service" },
  { to: "/privacy", label: "Privacy Policy" },
];

export function Footer() {
  return (
    <footer className="border-t border-line px-gutter py-8 text-caption text-muted">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-semibold text-ink">Kindo</p>
          <p className="mt-1 max-w-xs">Pre-loved baby &amp; kids gear and clothes, made in Australia. {NO_FEES_LINE}</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="inline-flex min-h-[36px] items-center hover:text-ink hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="mx-auto mt-6 max-w-6xl">© {new Date().getFullYear()} Kindo. All rights reserved.</p>
    </footer>
  );
}
