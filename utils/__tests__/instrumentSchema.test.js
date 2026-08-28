import {
  instrumentSchema,
  instrumentBasicsSchema,
  resolveInstrumentForStorage,
} from '../instrumentSchema';

describe('instrumentSchema', () => {
  const valid = { type: 'Guitar', brand: 'Fender', model: 'Stratocaster' };

  it('accepts an item with the required basics', () => {
    expect(instrumentSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a missing type', () => {
    const result = instrumentSchema.safeParse({ ...valid, type: '' });
    expect(result.success).toBe(false);
    expect(result.error.issues.some(i => i.path[0] === 'type')).toBe(true);
  });

  it('rejects whitespace-only required fields', () => {
    const result = instrumentSchema.safeParse({ type: '  ', brand: '  ', model: '  ' });
    expect(result.success).toBe(false);
    const paths = result.error.issues.map(i => i.path[0]);
    expect(paths).toEqual(expect.arrayContaining(['type', 'brand', 'model']));
  });

  it('treats optional fields as optional', () => {
    const result = instrumentSchema.safeParse({ ...valid, nickname: undefined, year: undefined });
    expect(result.success).toBe(true);
  });

  it('accepts "Other" as a valid make/model value', () => {
    const result = instrumentSchema.safeParse({ type: 'Guitar', brand: 'Other', model: 'Other' });
    expect(result.success).toBe(true);
  });
});

describe('instrumentBasicsSchema', () => {
  it('reports each missing basic field', () => {
    const result = instrumentBasicsSchema.safeParse({ type: '', brand: '', model: '' });
    expect(result.success).toBe(false);
    const paths = result.error.issues.map(i => i.path[0]);
    expect(paths).toEqual(expect.arrayContaining(['type', 'brand', 'model']));
  });
});

describe('resolveInstrumentForStorage', () => {
  it('swaps in the custom brand/model when "Other" is selected', () => {
    const out = resolveInstrumentForStorage({
      type: 'Guitar',
      brand: 'Other',
      customBrand: 'Harmony',
      model: 'Other',
      customModel: 'Rocket',
    });
    expect(out.brand).toBe('Harmony');
    expect(out.model).toBe('Rocket');
  });

  it('keeps the selected brand/model when not "Other"', () => {
    const out = resolveInstrumentForStorage({ brand: 'Fender', model: 'Stratocaster' });
    expect(out.brand).toBe('Fender');
    expect(out.model).toBe('Stratocaster');
  });

  it('falls back to "Other" when no custom value was entered', () => {
    const out = resolveInstrumentForStorage({ brand: 'Other', customBrand: '', model: 'Other', customModel: '' });
    expect(out.brand).toBe('Other');
    expect(out.model).toBe('Other');
  });
});
