import { describe, expect, it, vi } from "vitest";
import { insertWithUniqueSlug } from "@/lib/unique-slug";

function uniqueViolation() {
  return Object.assign(new Error("duplicate key value"), { code: "23505" });
}

describe("insertWithUniqueSlug", () => {
  it("uses the base slug on the first attempt", async () => {
    const insert = vi.fn().mockResolvedValue([{ id: "1", slug: "hello-world" }]);
    const row = await insertWithUniqueSlug("Hello World", insert);
    expect(insert).toHaveBeenCalledWith("hello-world");
    expect(row).toEqual({ id: "1", slug: "hello-world" });
  });

  it("retries with a numeric suffix on a unique-constraint collision", async () => {
    const insert = vi
      .fn()
      .mockRejectedValueOnce(uniqueViolation())
      .mockResolvedValueOnce([{ id: "2", slug: "hello-world-2" }]);

    const row = await insertWithUniqueSlug("Hello World", insert);
    expect(insert).toHaveBeenNthCalledWith(1, "hello-world");
    expect(insert).toHaveBeenNthCalledWith(2, "hello-world-2");
    expect(row).toEqual({ id: "2", slug: "hello-world-2" });
  });

  it("rethrows non-collision errors immediately without retrying", async () => {
    const insert = vi.fn().mockRejectedValue(new Error("connection refused"));
    await expect(insertWithUniqueSlug("Hello World", insert)).rejects.toThrow(
      "connection refused",
    );
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("gives up after 5 attempts", async () => {
    const insert = vi.fn().mockRejectedValue(uniqueViolation());
    await expect(insertWithUniqueSlug("Hello World", insert)).rejects.toThrow(
      "Could not generate a unique slug",
    );
    expect(insert).toHaveBeenCalledTimes(5);
  });
});
