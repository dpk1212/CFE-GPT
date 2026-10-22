import type { Metadata } from "next";
import { Barlow, Barlow_Condensed, Fraunces } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { center } from "@/lib/content";
import "./globals.css";

const display = Barlow_Condensed({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = Barlow({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
});

const serif = Fraunces({
  weight: ["500", "600"],
  subsets: ["latin"],
  variable: "--font-serif",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Entrepreneurship & Innovation | University of Michigan",
    template: "%s | Entrepreneurship & Innovation",
  },
  description:
    "University of Michigan Entrepreneurship & Innovation. The undergraduate Princeton Review ranking, prepared with the campus partners. Graduate rankings are prepared by the Zell Lurie Institute.",
  openGraph: {
    title: "Entrepreneurship & Innovation | University of Michigan",
    description: "Michigan’s undergraduate entrepreneurship ranking, and the partners behind it.",
    type: "website",
    locale: "en_US",
    siteName: "U-M Entrepreneurship & Innovation",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Entrepreneurship & Innovation",
    parentOrganization: "University of Michigan",
    url: "https://entrepreneurship.umich.edu/",
    email: center.email,
    telephone: center.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: "2281 Bonisteel Boulevard",
      addressLocality: "Ann Arbor",
      addressRegion: "MI",
      postalCode: "48109",
      addressCountry: "US",
    },
  };

  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${serif.variable}`}>
      <body>
        <a className="skip" href="#content">
          Skip to content
        </a>
        <Header />
        <main id="content">{children}</main>
        <Footer />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
