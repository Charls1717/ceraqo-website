import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "./globals.css";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "CERAQO™ Q-ARMOR™ — Surface. Redefined.",
  description:
    "Q-ARMOR™ by CERAQO™ — the next generation beyond wax, sealants and conventional ceramic coatings. A durable, transparent protective layer with deep gloss, hydrophobic performance and professional-grade results from one simple wipe-on, buff-off application. Made in Germany.",
  icons: { icon: `${BASE}/favicon.svg` },
  openGraph: {
    title: "CERAQO™ Q-ARMOR™ — Surface. Redefined.",
    description:
      "Defense-grade surface technology for every vehicle. Wipe on. Buff off. Protected for years, not weeks.",
    images: [`${BASE}/images/bottle-hero.png`],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0B0C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
