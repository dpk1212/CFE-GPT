import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname),
  // Keep pdfkit out of the serverless bundle; Poppins TTFs are traced in explicitly.
  serverExternalPackages: ["@react-pdf/renderer", "@react-pdf/font", "pdfkit", "fontkit"],
  outputFileTracingIncludes: {
    "/api/feedback/[applicationId]/pdf": ["./fonts/**/*"],
  },
};

export default nextConfig;
