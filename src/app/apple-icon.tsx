import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

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
          backgroundColor: "#050505",
        }}
      >
        {/* Same angular mark as the header/footer logo (xonorate-mark.tsx),
            in the real brand red instead of the plain gold "X" letter this
            used to render. */}
        <svg width="112" height="112" viewBox="0 0 40 40" fill="none">
          <path d="M2 2L17 20L2 38H10L21 24.5L32 38H38L23 20L38 2H31L20.5 15L10 2H2Z" fill="#d11f2c" />
          <path d="M24 18L38 2H31L20.5 15L24 18Z" fill="#d11f2c" fillOpacity="0.55" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
