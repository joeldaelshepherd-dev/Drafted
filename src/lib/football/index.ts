import { ApiFootballProvider } from "./api-football";
import { MockProvider } from "./mock";
import type { FootballProvider } from "./types";

export * from "./types";

/**
 * Provider factory. `FOOTBALL_PROVIDER=mock` (or a missing API key) falls back
 * to the offline provider so the app always boots.
 */
let instance: FootballProvider | null = null;

export function getFootballProvider(): FootballProvider {
  if (instance) return instance;
  const choice = process.env.FOOTBALL_PROVIDER ?? "api-football";
  if (choice === "api-football" && process.env.API_FOOTBALL_KEY) {
    instance = new ApiFootballProvider();
  } else {
    if (choice === "api-football") {
      console.warn("[drafted] API_FOOTBALL_KEY missing — using mock provider.");
    }
    instance = new MockProvider();
  }
  return instance;
}
