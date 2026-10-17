// Telemetría opcional del Píxel de Meta (ID 3805999569695684).
// El snippet base vive en build.mjs (se inyecta en dist/index.html).
// Estas llamadas nunca deben romper el funnel: todo va en try/catch.
export type PixelEvent = "Contact" | "ViewContent" | "InitiateCheckout";

export function trackPixel(event: PixelEvent): void {
  try {
    const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
    if (typeof fbq === "function") fbq("track", event);
  } catch {
    // Silencioso: el píxel es telemetría, no parte crítica de la conversación.
  }
}
