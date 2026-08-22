import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#14120e",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#c99a44" }}>
          X
        </div>
      </div>
    ),
    { ...size },
  );
}
