import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname),
  // Keep pdfkit + react-pdf out of the serverless bundle so standard-font files stay resolvable.
  serverExternalPackages: ["@react-pdf/renderer", "@react-pdf/font", "pdfkit", "fontkit"],
};

export default nextConfig;
