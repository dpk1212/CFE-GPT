import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#00274C",
          color: "#F6F3EB",
          padding: "64px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: "#FFCB05" }}>
          UNIVERSITY OF MICHIGAN · CENTER FOR ENTREPRENEURSHIP
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 68, lineHeight: 1.05 }}>
          Midwest No. 1 for entrepreneurship.
        </div>
        <div style={{ display: "flex", gap: 48, fontSize: 28, color: "#FFCB05" }}>
          <span>Undergraduate No. 4</span>
          <span>Graduate No. 5</span>
          <span>2026</span>
        </div>
      </div>
    ),
    size,
  );
}
