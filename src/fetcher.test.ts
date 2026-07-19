import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchPokedex } from "./fetcher.js";

describe("fetchPokedex", () => {
  const mockData = [
    { id: "BULBASAUR", dexNr: 1, names: { English: "Bulbasaur" } },
    { id: "IVYSAUR", dexNr: 2, names: { English: "Ivysaur" } },
  ];

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed JSON array on success", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchPokedex();

    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and succeeds on second attempt", async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchPokedex();

    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("throws after all retries exhausted", async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValue(new Error("Network error"));
    vi.stubGlobal("fetch", mockFetch);

    await expect(fetchPokedex()).rejects.toThrow(
      "Failed to fetch pokedex after 2 attempts"
    );
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("throws on non-OK HTTP response after retries", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(fetchPokedex()).rejects.toThrow(
      "Failed to fetch pokedex after 2 attempts"
    );
  });

  it("throws if response is not an array", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ notAnArray: true }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(fetchPokedex()).rejects.toThrow(
      "Expected array response"
    );
  });
});
