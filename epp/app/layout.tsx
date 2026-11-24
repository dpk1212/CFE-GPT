import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Poppins } from "next/font/google";
import { cookies } from "next/headers";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { clerkAppearance, clerkConfigured } from "@/lib/clerk";
import { openSession, SESSION_COOKIE } from "@/lib/session";
import "./globals.css";

const sans = Poppins({ weight: ["400", "700", "800"], subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "Entrepreneurial Practice Programs | Center for Entrepreneurship", template: "%s | CFE Entrepreneurial Practice Programs" },
  description: "The Entrepreneurial Practice Programs portal. Admins and judges sign in here. The Launch programs, including Fuel, are linked to their official Center for Entrepreneurship pages.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await openSession((await cookies()).get(SESSION_COOKIE)?.value);
  const clerk = clerkConfigured();
  const page = (
    <html lang="en" className={sans.variable}>
      <body>
        <a className="skip" href="#content">Skip to content</a>
        <Header session={session} clerk={clerk} />
        <main id="content">{children}</main>
        <Footer />
      </body>
    </html>
  );
  if (!clerk) return page;
  return (
    <ClerkProvider appearance={clerkAppearance} signInUrl="/login" signUpUrl="/login" afterSignOutUrl="/">
      {page}
    </ClerkProvider>
  );
}
