export type TranslationResource = Record<string, unknown>;

export const collectTranslationKeys = (
  value: unknown,
  prefix = "",
): string[] => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return collectTranslationKeys(child, path);
  });
};

export const findMissingTranslationKeys = (
  source: TranslationResource,
  target: TranslationResource,
): string[] => {
  const targetKeys = new Set(collectTranslationKeys(target));

  return collectTranslationKeys(source)
    .filter((key) => !targetKeys.has(key))
    .sort();
};
