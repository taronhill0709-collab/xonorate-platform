import { describe, expect, it } from "vitest";
import { buildSocialCaption } from "@/lib/social-caption";

describe("buildSocialCaption", () => {
  it("includes the title, a body excerpt, the post link, and hashtags", () => {
    const caption = buildSocialCaption({
      title: "Test Title",
      body: "This is the **body** of the post.",
      origin: "https://xonorate.com",
      slug: "test-post",
    });

    expect(caption).toContain("Test Title");
    expect(caption).toContain("This is the body of the post.");
    expect(caption).toContain("Full story: https://xonorate.com/posts/test-post");
    expect(caption).toContain("#WrongfulConviction");
  });
});
