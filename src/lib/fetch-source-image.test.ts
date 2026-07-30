import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSourceImage } from "@/lib/fetch-source-image";

function mockHtmlResponse(html: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async (url: string) => {
      const res = new Response(html, { status: 200, headers: { "content-type": "text/html" } });
      // Response.url is normally set by a real fetch to the resolved request
      // URL — the constructor leaves it "", which fails URL resolution for
      // relative image paths, so tests need to set it explicitly.
      Object.defineProperty(res, "url", { value: url, configurable: true });
      return res;
    }),
  );
}

describe("fetchSourceImage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("decodes &amp; in the extracted og:image URL back to &", async () => {
    mockHtmlResponse(
      `<html><head><meta property="og:image" content="https://cdn.example.com/img.jpg?auth=abc&amp;width=1200&amp;height=600"></head></html>`,
    );

    const result = await fetchSourceImage("https://example.com/article");
    expect(result).toBe("https://cdn.example.com/img.jpg?auth=abc&width=1200&height=600");
  });

  it("falls back to twitter:image when og:image is absent", async () => {
    mockHtmlResponse(
      `<html><head><meta name="twitter:image" content="https://cdn.example.com/tw.jpg"></head></html>`,
    );

    const result = await fetchSourceImage("https://example.com/article");
    expect(result).toBe("https://cdn.example.com/tw.jpg");
  });

  it("returns null when no image meta tag is present", async () => {
    mockHtmlResponse(`<html><head><title>No image here</title></head></html>`);

    const result = await fetchSourceImage("https://example.com/article");
    expect(result).toBeNull();
  });
});
