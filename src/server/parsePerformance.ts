const MAX_PERFORMANCE_LENGTH = 256;

export type ParsePerformanceResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

/**
 * Native runtime validation for the performance identifier.
 *
 * Bun does not ship a schema validator, so plain type guards are used; the
 * handlers only deal with validated values.
 */
export const parsePerformanceParam = (
  value: unknown,
): ParsePerformanceResult => {
  if (typeof value !== "string") {
    return { ok: false, message: "Invalid performance parameter" };
  }

  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_PERFORMANCE_LENGTH) {
    return { ok: false, message: "Invalid performance parameter" };
  }

  return { ok: true, value: trimmed };
};
