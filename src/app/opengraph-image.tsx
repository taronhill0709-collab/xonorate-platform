import { ImageResponse } from "next/og";

export const alt = "Xonorate Media Platform — advocating for the wrongfully convicted";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          backgroundColor: "#14120e",
          backgroundImage:
            "radial-gradient(circle at 85% 15%, rgba(201,154,68,0.22), transparent 55%)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          <span style={{ color: "#f2ece0" }}>X</span>
          <span style={{ color: "#c99a44" }}>o</span>
          <span style={{ color: "#f2ece0" }}>norate</span>
        </div>

        <div
          style={{
            display: "flex",
            maxWidth: 920,
            fontSize: 56,
            fontWeight: 700,
            lineHeight: 1.15,
            color: "#f2ece0",
          }}
        >
          Advocating for the wrongfully convicted
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", width: 64, height: 4, backgroundColor: "#c99a44", marginRight: 20 }} />
          <div style={{ display: "flex", fontSize: 24, color: "#a99c81" }}>
            Client cases · live petitions · stories of exoneration
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
