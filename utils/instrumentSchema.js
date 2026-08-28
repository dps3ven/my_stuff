import { z } from 'zod';

// Single source of truth for what makes a valid instrument. Used both by the
// Add/Edit form (via @hookform/resolvers) and by unit tests. Type, make, and
// model are required; everything else is optional. Make/model accept "Other"
// as a valid value — the free-text custom name is resolved at save time.
export const instrumentSchema = z.object({
  type: z.string().trim().min(1, 'Pick a type'),
  brand: z.string().trim().min(1, 'Pick a make'),
  customBrand: z.string().optional(),
  model: z.string().trim().min(1, 'Pick a model'),
  customModel: z.string().optional(),
  nickname: z.string().optional(),
  year: z.string().optional(),
  serialNumber: z.string().optional(),
  condition: z.string().optional(),
  value: z.string().optional(),
  notes: z.string().optional(),
  images: z.array(z.any()).optional(),
  // Cached market-value estimate (from the Reverb-backed valuation lookup).
  valueEstimate: z.any().optional(),
});

// Just the fields required to file an item — used for the per-step gate.
export const instrumentBasicsSchema = instrumentSchema.pick({
  type: true,
  brand: true,
  model: true,
});

// Maps a schema field path to the label shown in the friendly "just need…"
// prompt, so the message stays in sync with the schema.
export const REQUIRED_FIELD_LABELS = { type: 'Type', brand: 'Make', model: 'Model' };

// Resolves the "Other" free-text values into the stored brand/model before
// persisting, matching the shape the rest of the app reads.
export function resolveInstrumentForStorage(data) {
  return {
    ...data,
    brand: data.brand === 'Other' && data.customBrand ? data.customBrand : data.brand,
    model: data.model === 'Other' && data.customModel ? data.customModel : data.model,
  };
}
