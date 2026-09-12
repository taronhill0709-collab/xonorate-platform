import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import { Providers } from "./providers";
import { JsonLd } from "@/components/json-ld";
import { getSiteOrigin } from "@/lib/site-url";
import "./globals.css";

const sourceSans3 = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

// Headings (font-serif) and the XONORATE wordmark (font-display) both use
// this — see the .font-serif rule in globals.css for the shared editorial
// headline treatment (uppercase, condensed, documentary-title register).
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: {
    default: "Xonorate Media Platform",
    template: "%s | Xonorate Media Platform",
  },
  description:
    "Xonorate exposes wrongful convictions, amplifies the voices behind the cases, and mobilizes the public to demand justice.",
  openGraph: {
    siteName: "Xonorate Media Platform",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const origin = getSiteOrigin();
  return (
    <html
      lang="en"
      className={`${sourceSans3.variable} ${ibmPlexMono.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Xonorate Media Platform",
            url: origin,
            description:
              "Xonorate exposes wrongful convictions, amplifies the voices behind the cases, and mobilizes the public to demand justice.",
            slogan: "Truth. Justice. Accountability.",
          }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-brand-foreground focus:uppercase"
        >
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
