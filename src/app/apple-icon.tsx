import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const markSvg = readFileSync(
  join(process.cwd(), "public/xonorate-mark.svg"),
  "utf-8",
);
const markDataUri = `data:image/svg+xml;base64,${Buffer.from(markSvg).toString("base64")}`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0e18",
        }}
      >
        <img src={markDataUri} alt="" width={140} height={140} />
      </div>
    ),
    { ...size },
  );
}
