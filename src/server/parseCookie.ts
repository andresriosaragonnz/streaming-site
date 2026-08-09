export const parseCookies = (
  cookieHeader: string | undefined,
): Record<string, string> => {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split("; ").map((c) => {
      const [key, ...val] = c.split("=");
      return [key, val.join("=")];
    }),
  );
};
