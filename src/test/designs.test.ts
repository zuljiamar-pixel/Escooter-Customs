import { describe, expect, it } from 'vitest';
import hyperVolt from '../../designs/max-g3-hyper-volt.json?raw';
import { DEFAULT_SETTINGS } from '../store/defaults';
import { parseImport } from '../store/transfer';

describe('bundled design files', () => {
  // Der Import ersetzt ungültige Werte stillschweigend – die Datei muss ihn deshalb unverändert überstehen.
  it('max-g3-hyper-volt.json survives the importer unchanged', () => {
    const source = JSON.parse(hyperVolt);
    const parsed = parseImport(hyperVolt, DEFAULT_SETTINGS);
    expect(parsed.themes).toEqual([{ ...source.themes[0], builtin: false }]);
    expect(parsed.bootDesigns).toEqual(source.bootDesigns);
    expect(parsed.layouts).toEqual(source.layouts);
    expect(parsed.settings).toBeNull();
  });
});
