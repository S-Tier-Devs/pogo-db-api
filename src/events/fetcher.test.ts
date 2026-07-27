import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchEventsPage } from "./fetcher.js";

describe("fetchEventsPage", () => {
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
      text: () => Promise.resolve("<html>events page</html>"),
    });

    const result = await fetchEventsPage();
    expect(result).toBe("<html>events page</html>");
  });

  it("returns null on HTTP error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    });

    const result = await fetchEventsPage();
    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));

    const result = await fetchEventsPage();
    expect(result).toBeNull();
  });

  it("returns null on abort/timeout", async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValue(new DOMException("Aborted", "AbortError"));

    const result = await fetchEventsPage();
    expect(result).toBeNull();
  });

  it("sends a user-agent header", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(""),
    });

    await fetchEventsPage();
    expect(global.fetch).toHaveBeenCalledWith(
      "https://leekduck.com/events/",
      expect.objectContaining({
        headers: expect.objectContaining({
          "User-Agent": "pogo-db-api/1.0 (static build pipeline)",
        }),
      })
    );
  });
});
