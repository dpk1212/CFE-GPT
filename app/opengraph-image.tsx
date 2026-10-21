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
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 6, color: "#FFCB05" }}>CFE</div>
        <div style={{ display: "flex", fontSize: 76, lineHeight: 1 }}>LEARN. LAUNCH. LEAD.</div>
        <div style={{ display: "flex", fontSize: 28 }}>CENTER FOR ENTREPRENEURSHIP</div>
      </div>
    ),
    size,
  );
}
