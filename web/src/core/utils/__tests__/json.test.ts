import { parseJSON } from "../json";

describe("parseJSON", () => {
  it("returns fallback for null input", () => {
    const fallback = { default: true };
    const result = parseJSON(null, fallback);
    expect(result).toBe(fallback);
  });

  it("returns fallback for undefined input", () => {
    const fallback = { default: true };
    const result = parseJSON(undefined, fallback);
    expect(result).toBe(fallback);
  });

  it("returns fallback for empty string", () => {
    const fallback = { default: true };
    const result = parseJSON("", fallback);
    expect(result).toBe(fallback);
  });

  it("parses valid JSON correctly", () => {
    const json = '{"name": "test", "value": 123}';
    const fallback = {};
    const result = parseJSON(json, fallback);
    expect(result).toEqual({ name: "test", value: 123 });
  });

  it("removes json code block markers", () => {
    const json = '```json\n{"name": "test"}\n```';
    const fallback = {};
    const result = parseJSON(json, fallback);
    expect(result).toEqual({ name: "test" });
  });

  it("removes js code block markers", () => {
    const json = '```js\n{"name": "test"}\n```';
    const fallback = {};
    const result = parseJSON(json, fallback);
    expect(result).toEqual({ name: "test" });
  });

  it("removes ts code block markers", () => {
    const json = '```ts\n{"name": "test"}\n```';
    const fallback = {};
    const result = parseJSON(json, fallback);
    expect(result).toEqual({ name: "test" });
  });

  it("removes plaintext code block markers", () => {
    const json = '```plaintext\n{"name": "test"}\n```';
    const fallback = {};
    const result = parseJSON(json, fallback);
    expect(result).toEqual({ name: "test" });
  });

  it("removes generic code block markers", () => {
    const json = '```\n{"name": "test"}\n```';
    const fallback = {};
    const result = parseJSON(json, fallback);
    expect(result).toEqual({ name: "test" });
  });

  it("handles whitespace around JSON", () => {
    const json = '   {"name": "test"}   ';
    const fallback = {};
    const result = parseJSON(json, fallback);
    expect(result).toEqual({ name: "test" });
  });

  it("returns fallback for malformed JSON", () => {
    const json = '{"name": "test", invalid}';
    const fallback = { error: true };
    const result = parseJSON(json, fallback);
    expect(result).toBe(fallback);
  });

  it("handles complex nested objects", () => {
    const json =
      '{"user": {"name": "John", "settings": {"theme": "dark"}}, "items": [1, 2, 3]}';
    const fallback = {};
    const result = parseJSON(json, fallback);
    expect(result).toEqual({
      user: {
        name: "John",
        settings: {
          theme: "dark",
        },
      },
      items: [1, 2, 3],
    });
  });

  it("handles arrays as top-level JSON", () => {
    const json = '[{"name": "item1"}, {"name": "item2"}]';
    const fallback: any[] = [];
    const result = parseJSON(json, fallback);
    expect(result).toEqual([{ name: "item1" }, { name: "item2" }]);
  });

  it("handles primitive values", () => {
    const jsonString = '"hello world"';
    const jsonNumber = "42";
    const jsonBoolean = "true";
    const fallback = null;

    expect(parseJSON(jsonString, fallback)).toBe("hello world");
    expect(parseJSON(jsonNumber, fallback)).toBe(42);
    expect(parseJSON(jsonBoolean, fallback)).toBe(true);
  });

  it("preserves original type when parsing fails", () => {
    const fallback = { type: "object" };
    const result = parseJSON("definitely not json", fallback);
    expect(result).toBe(fallback);
    expect(typeof result).toBe("object");
  });

  it("handles code blocks with extra spacing", () => {
    const json = '```json   \n  {"name": "test"}  \n  ```';
    const fallback = {};
    const result = parseJSON(json, fallback);
    expect(result).toEqual({ name: "test" });
  });
});
