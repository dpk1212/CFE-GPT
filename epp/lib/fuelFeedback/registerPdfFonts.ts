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

/** pdfkit's node build loads Helvetica via relative require; that breaks once Next bundles the package for serverless. Register the fonts explicitly so renderToBuffer works on Vercel. */
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
  registered = true;
}
