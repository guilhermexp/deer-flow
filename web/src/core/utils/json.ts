export function parseJSON<T>(json: string | null | undefined, fallback: T) {
  if (!json) {
    return fallback;
  }
  try {
    const raw = json
      .trim()
      .replace(/^```\w*\s*/, "") // remove starting ```json/js/ts/plaintext
      .replace(/\s*```$/, ""); // remove trailing ```

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
