import { Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-judge",
});

export default function JudgeLayout({ children }: { children: React.ReactNode }) {
  return <div className={`cfe-desk ${poppins.variable}`}>{children}</div>;
}
