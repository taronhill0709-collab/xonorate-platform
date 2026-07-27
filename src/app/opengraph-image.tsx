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
          backgroundColor: "#1b2a4a",
          backgroundImage:
            "radial-gradient(circle at 85% 15%, rgba(212,161,46,0.28), transparent 55%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: "50%",
              border: "3px solid #d4a12e",
              marginRight: 20,
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: 6,
              color: "#f7f4ef",
              textTransform: "uppercase",
            }}
          >
            Xonorate
          </div>
        </div>

        <div
          style={{
            display: "flex",
            maxWidth: 920,
            fontSize: 56,
            fontWeight: 700,
            lineHeight: 1.15,
            color: "#ffffff",
          }}
        >
          Advocating for the wrongfully convicted
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", width: 64, height: 4, backgroundColor: "#d4a12e", marginRight: 20 }} />
          <div style={{ display: "flex", fontSize: 24, color: "#c9cedb" }}>
            Client cases · live petitions · daily advocacy news
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
