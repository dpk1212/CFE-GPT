declare module "pdfkit" {
  export function registerStdFonts(...fontData: unknown[]): void;
}

declare module "pdfkit/standard-fonts/*" {
  const fontData: { name: string };
  export default fontData;
}
