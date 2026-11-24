import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname),
  // Keep pdfkit out of the opaque webpack bundle so its modules resolve at runtime.
  serverExternalPackages: ["@react-pdf/renderer", "@react-pdf/font", "pdfkit", "fontkit"],
  outputFileTracingIncludes: {
    "/api/feedback/[applicationId]/pdf": [
      "./fonts/**/*",
      "./node_modules/pdfkit/js/standard-fonts/**",
      "./node_modules/pdfkit/js/data/**",
    ],
  },
};

export default nextConfig;
