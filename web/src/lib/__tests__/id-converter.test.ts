import { describe, it, expect } from "vitest";

import { toUUID, idMapper } from "../id-converter";

describe("ID Converter", () => {
  describe("toUUID", () => {
    it("should return the same UUID if already valid", () => {
      const validUUID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
      expect(toUUID(validUUID)).toBe(validUUID.toLowerCase());
    });

    it("should convert non-UUID strings to valid UUIDs", () => {
      const testIds = [
        "0b52itrVAvubV8tLSGN2F",
        "run-87c2d996-bd6c-4d8a-8295-e0416a1e7cae",
        "simple-id",
        "123456789",
      ];

      testIds.forEach((id) => {
        const uuid = toUUID(id);
        // Check if it's a valid UUID format
        expect(uuid).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
        );
      });
    });

    it("should generate consistent UUIDs for the same input", () => {
      const id = "test-id-123";
      const uuid1 = toUUID(id);
      const uuid2 = toUUID(id);
      expect(uuid1).toBe(uuid2);
    });
  });

  describe("IDMapper", () => {
    it("should map and retrieve IDs correctly", () => {
      const mapper = idMapper;
      const originalId = "test-original-id";

      const uuid = mapper.getUUID(originalId);
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );

      const retrievedId = mapper.getOriginalId(uuid);
      expect(retrievedId).toBe(originalId);
    });

    it("should return consistent UUIDs for the same original ID", () => {
      const mapper = idMapper;
      const originalId = "consistent-test-id";

      const uuid1 = mapper.getUUID(originalId);
      const uuid2 = mapper.getUUID(originalId);

      expect(uuid1).toBe(uuid2);
    });

    it("should check if IDs exist", () => {
      const mapper = idMapper;
      const originalId = "check-exists-id";

      expect(mapper.hasOriginalId(originalId)).toBe(false);

      const uuid = mapper.getUUID(originalId);

      expect(mapper.hasOriginalId(originalId)).toBe(true);
      expect(mapper.hasUUID(uuid)).toBe(true);
    });
  });
});
