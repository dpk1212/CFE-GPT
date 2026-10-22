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
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 4, color: "#FFCB05" }}>UNIVERSITY OF MICHIGAN</div>
        <div style={{ display: "flex", fontSize: 68, lineHeight: 1.05 }}>Entrepreneurship & Innovation</div>
        <div style={{ display: "flex", fontSize: 28 }}>Undergraduate reporting</div>
      </div>
    ),
    size,
  );
}
