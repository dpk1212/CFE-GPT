import type { Metadata } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { center } from "@/lib/content";
import "./globals.css";

const serif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-serif",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Center for Entrepreneurship · University of Michigan",
    template: "%s · CFE · University of Michigan",
  },
  description:
    "The University of Michigan Center for Entrepreneurship. Midwest No. 1, national No. 4 undergraduate and No. 5 graduate on the 2026 Princeton Review and Entrepreneur lists. Courses, I-Corps, ELP, EHour, and the graduate certificate.",
  openGraph: {
    title: "Center for Entrepreneurship · University of Michigan",
    description:
      "Midwest No. 1 for entrepreneurship in 2026. Courses, leadership, I-Corps, EHour, and a guide to getting started.",
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
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
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
