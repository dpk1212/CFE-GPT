import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CFE | Center for Entrepreneurship",
    template: "%s | CFE",
  },
  description: "Center for Entrepreneurship at the University of Michigan. Learn. Launch. Lead.",
  openGraph: {
    title: "CFE | Center for Entrepreneurship",
    description: "Learn. Launch. Lead. Historical reporting for the University of Michigan Center for Entrepreneurship.",
    type: "website",
    locale: "en_US",
    siteName: "U-M Center for Entrepreneurship",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: center.name,
    parentOrganization: center.university,
    url: center.official,
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
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
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
