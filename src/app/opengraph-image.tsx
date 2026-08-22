import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Xonorate Media Platform — advocating for the wrongfully convicted";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const markSvg = readFileSync(
  join(process.cwd(), "public/xonorate-mark.svg"),
  "utf-8",
);
const markDataUri = `data:image/svg+xml;base64,${Buffer.from(markSvg).toString("base64")}`;

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
          <img
            src={markDataUri}
            alt=""
            width={64}
            height={64}
            style={{ marginRight: 20 }}
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
            Client cases · live petitions · stories of exoneration
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
