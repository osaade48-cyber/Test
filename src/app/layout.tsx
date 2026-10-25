import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { BRAND, SITE_URL } from "@/config/brand";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND.name} · Luxury modular dog homes, Sydney`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: `${BRAND.name} · ${BRAND.tagline}`,
    description: BRAND.description,
    locale: "en_AU",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#f6f3ee",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        {/* Enables reveal animations only when JavaScript runs, so content is never hidden without it. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-svh">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
