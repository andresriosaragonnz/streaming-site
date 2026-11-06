export type ParseGroupResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

/**
 * Native runtime validation for the admin artist group query param.
 *
 * Bun does not ship a schema validator, so plain type guards are used; the
 * handler only deals with validated values.
 */
export const parseGroupParam = (value: unknown): ParseGroupResult => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return { ok: false, message: "Missing params" };
  }

  return { ok: true, value };
};
