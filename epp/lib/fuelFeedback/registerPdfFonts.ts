import path from "node:path";
import { Font } from "@react-pdf/renderer";

let registered = false;

/**
 * pdfkit's built-in Helvetica AFM files are not available once Next bundles
 * the package for Vercel serverless. Register Poppins TTFs from the repo instead.
 */
export function ensurePdfFonts() {
  if (registered) return;
  const fontsDir = path.join(process.cwd(), "fonts");
  Font.register({
    family: "Poppins",
    fonts: [
      { src: path.join(fontsDir, "Poppins-Regular.ttf"), fontWeight: 400 },
      { src: path.join(fontsDir, "Poppins-SemiBold.ttf"), fontWeight: 600 },
      { src: path.join(fontsDir, "Poppins-Bold.ttf"), fontWeight: 700 },
    ],
  });
  registered = true;
}
