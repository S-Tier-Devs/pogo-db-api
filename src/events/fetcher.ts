const LEEKDUCK_URL = "https://leekduck.com/events/";
const TIMEOUT_MS = 10_000;

/**
 * Fetches the Leek Duck events page HTML.
 * Returns the HTML string on success, or null on any failure (timeout, HTTP error, network issue).
 * This enables the build to silently skip event data when the page is unreachable.
 */
export async function fetchEventsPage(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(LEEKDUCK_URL, {
      signal: controller.signal,
      headers: {
        "User-Agent": "pogo-db-api/1.0 (static build pipeline)",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(
        `⚠️  Events fetch failed: HTTP ${response.status} ${response.statusText}`
      );
      return null;
    }

    return await response.text();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    console.warn(`⚠️  Events fetch failed: ${message}`);
    return null;
  }
}
