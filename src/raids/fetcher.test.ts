import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchRaidPage } from "./fetcher.js";

describe("fetchRaidPage", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns HTML on successful fetch", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<html>raid page</html>"),
    });

    const result = await fetchRaidPage();
    expect(result).toBe("<html>raid page</html>");
  });

  it("returns null on HTTP error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    });

    const result = await fetchRaidPage();
    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));

    const result = await fetchRaidPage();
    expect(result).toBeNull();
  });

  it("returns null on abort/timeout", async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValue(new DOMException("Aborted", "AbortError"));

    const result = await fetchRaidPage();
    expect(result).toBeNull();
  });

  it("sends a user-agent header", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(""),
    });

    await fetchRaidPage();
    expect(global.fetch).toHaveBeenCalledWith(
      "https://leekduck.com/raid-bosses/",
      expect.objectContaining({
        headers: expect.objectContaining({
          "User-Agent": "pogo-db-api/1.0 (static build pipeline)",
        }),
      })
    );
  });
});
