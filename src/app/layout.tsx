import type { Metadata } from "next";
import { Public_Sans, Source_Sans_3, Space_Mono } from "next/font/google";
import { Providers } from "./providers";
import { getSiteOrigin } from "@/lib/site-url";
import "./globals.css";

const sourceSans3 = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

// Headings (font-serif) and the XONORATE wordmark (font-display) both use
// this — see the .font-serif rule in globals.css for the shared heading
// treatment (title case, tight tracking).
const publicSans = Public_Sans({
  variable: "--font-public-sans",
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
    "Advocating for the wrongfully convicted — client cases, live petitions, and stories of exoneration.",
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
  return (
    <html
      lang="en"
      className={`${sourceSans3.variable} ${spaceMono.variable} ${publicSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
