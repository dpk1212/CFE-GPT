import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { cookies } from "next/headers";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { openSession, SESSION_COOKIE } from "@/lib/session";
import "./globals.css";

const sans = Poppins({ weight: ["400", "700", "800"], subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "Entrepreneurial Practice Programs | Center for Entrepreneurship", template: "%s | CFE Entrepreneurial Practice Programs" },
  description: "The Entrepreneurial Leadership Program, Perot Jain TechLab Series, and student endeavors at the University of Michigan Center for Entrepreneurship.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await openSession((await cookies()).get(SESSION_COOKIE)?.value);
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <a className="skip" href="#content">Skip to content</a>
        <Header session={session} />
        <main id="content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
