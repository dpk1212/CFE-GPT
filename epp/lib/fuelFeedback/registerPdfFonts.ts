import { existsSync } from "node:fs";
import path from "node:path";
import { Font } from "@react-pdf/renderer";
import { registerStdFonts } from "pdfkit";
import Courier from "pdfkit/standard-fonts/Courier";
import CourierBold from "pdfkit/standard-fonts/CourierBold";
import CourierBoldOblique from "pdfkit/standard-fonts/CourierBoldOblique";
import CourierOblique from "pdfkit/standard-fonts/CourierOblique";
import Helvetica from "pdfkit/standard-fonts/Helvetica";
import HelveticaBold from "pdfkit/standard-fonts/HelveticaBold";
import HelveticaBoldOblique from "pdfkit/standard-fonts/HelveticaBoldOblique";
import HelveticaOblique from "pdfkit/standard-fonts/HelveticaOblique";
import SymbolFont from "pdfkit/standard-fonts/Symbol";
import TimesBold from "pdfkit/standard-fonts/TimesBold";
import TimesBoldItalic from "pdfkit/standard-fonts/TimesBoldItalic";
import TimesItalic from "pdfkit/standard-fonts/TimesItalic";
import TimesRoman from "pdfkit/standard-fonts/TimesRoman";
import ZapfDingbats from "pdfkit/standard-fonts/ZapfDingbats";

let registered = false;

function resolveFontsDir() {
  const candidates = [
    path.join(process.cwd(), "fonts"),
    path.join(process.cwd(), "epp", "fonts"),
    path.join(__dirname, "..", "..", "fonts"),
  ];
  for (const dir of candidates) {
    if (existsSync(path.join(dir, "Poppins-Regular.ttf"))) return dir;
  }
  return null;
}

/**
 * pdfkit's built-in Helvetica AFM files disappear once Next bundles the package
 * for Vercel. Import the standard-font modules explicitly (works even when bundled)
 * and also register branded Poppins TTFs when the traced fonts directory is present.
 */
export function ensurePdfFonts() {
  if (registered) return;

  registerStdFonts(
    Courier,
    CourierBold,
    CourierBoldOblique,
    CourierOblique,
    Helvetica,
    HelveticaBold,
    HelveticaBoldOblique,
    HelveticaOblique,
    SymbolFont,
    TimesBold,
    TimesBoldItalic,
    TimesItalic,
    TimesRoman,
    ZapfDingbats,
  );

  const fontsDir = resolveFontsDir();
  if (fontsDir) {
    Font.register({
      family: "Poppins",
      fonts: [
        { src: path.join(fontsDir, "Poppins-Regular.ttf"), fontWeight: 400 },
        { src: path.join(fontsDir, "Poppins-SemiBold.ttf"), fontWeight: 600 },
        { src: path.join(fontsDir, "Poppins-Bold.ttf"), fontWeight: 700 },
      ],
    });
  } else {
    console.warn("feedback pdf: Poppins fonts missing; using registered standard fonts");
  }

  registered = true;
}

export function pdfFontFamily() {
  return resolveFontsDir() ? "Poppins" : "Helvetica";
}
