/**
 * Helper to lazily load Tone.js in environments where it may not be available.
 */

let tonePromise: Promise<typeof import('tone') | null> | undefined;

const dynamicImport = new Function('specifier', 'return import(specifier);') as <T>(
  specifier: string
) => Promise<T>;

export async function loadTone(): Promise<typeof import('tone') | null> {
  if (tonePromise) {
    return tonePromise;
  }

  tonePromise = (async () => {
    try {
      const module = await dynamicImport<typeof import('tone')>('tone');
      return module;
    } catch (error) {
      console.warn('CodeChroma: Tone.js could not be loaded', error);
      return null;
    }
  })();

  return tonePromise;
}
