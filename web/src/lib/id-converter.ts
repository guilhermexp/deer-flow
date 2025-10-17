import { v5 as uuidv5 } from 'uuid';

// Namespace UUID for Deep-flow message IDs
const DEEPFLOW_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * Converts any string ID to a valid UUID v5
 * This ensures compatibility with PostgreSQL UUID columns
 */
export function toUUID(id: string): string {
  // Check if already a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id.toLowerCase();
  }
  
  // Convert to UUID v5 using the ID as input
  return uuidv5(id, DEEPFLOW_NAMESPACE);
}

/**
 * Creates a mapping between original ID and UUID for reverse lookups
 */
export class IDMapper {
  private originalToUUID = new Map<string, string>();
  private uuidToOriginal = new Map<string, string>();
  
  getUUID(originalId: string): string {
    if (!this.originalToUUID.has(originalId)) {
      const uuid = toUUID(originalId);
      this.originalToUUID.set(originalId, uuid);
      this.uuidToOriginal.set(uuid, originalId);
    }
    return this.originalToUUID.get(originalId)!;
  }
  
  getOriginalId(uuid: string): string | undefined {
    return this.uuidToOriginal.get(uuid);
  }
  
  hasOriginalId(originalId: string): boolean {
    return this.originalToUUID.has(originalId);
  }
  
  hasUUID(uuid: string): boolean {
    return this.uuidToOriginal.has(uuid);
  }
}

// Global instance for the application
export const idMapper = new IDMapper();