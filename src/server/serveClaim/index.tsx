import { createAuthToken, verifyAuthToken } from "../crypto";
import { parseCookies } from "../parseCookie";
import { ClaimLayout } from "./ClaimLayout";

interface UserPayload {
  sub: string;
  allowed: string;
  v: number;
  exp?: number;
}

export const serveClaim = async (c: any) => {
  try {
    const incomingToken = c.req.query("token");
    if (!incomingToken) return c.text("Missing token", 400);
    console.log({ incomingToken });
    // 1. Verify incoming claim token
    const incomingPayload = await verifyAuthToken<UserPayload>(
      incomingToken,
      c.env.AUTH_SECRET,
    );
    console.log({ incomingPayload });
    if (!incomingPayload) return c.text("Invalid or tampered token", 403);

    // 2. Check if device already has an existing auth_token cookie
    const rawCookie = c.req.header("Cookie");
    const cookies = parseCookies(rawCookie);
    const existingToken = cookies["auth_token"];
    let mergedAllowed = [`${incomingPayload.allowed}_${incomingPayload.v}`];
    if (existingToken) {
      const existingPayload = await verifyAuthToken<UserPayload>(
        existingToken,
        c.env.AUTH_SECRET,
      );
      console.log({ existingPayload });
      // Merge previous privileges with new privileges if existing token is valid
      if (existingPayload && Array.isArray(existingPayload.allowed)) {
        mergedAllowed = Array.from(
          new Set([
            ...existingPayload.allowed,
            `${incomingPayload.allowed}_${incomingPayload.v}`,
          ]),
        );
      }
    }

    // 3. Create a new JWT containing the combined permissions
    const combinedPayload: UserPayload = {
      allowed: mergedAllowed,
    };

    const updatedToken = await createAuthToken(
      combinedPayload,
      c.env.AUTH_SECRET,
    );

    // Detect HTTPS context to disable 'Secure' attribute during local HTTP dev
    const isSecure =
      c.req.url.startsWith("https://") ||
      c.req.header("x-forwarded-proto") === "https";

    const secureFlag = isSecure ? "; Secure" : "";

    // 4. Overwrite cookie with updated combined token (using Lax for top-level navigation support)
    c.header(
      "Set-Cookie",
      `auth_token=${updatedToken}; Path=/; HttpOnly${secureFlag}; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`,
    );
    const sql = `SELECT * FROM segments WHERE artistId = ?`;

    const { results: segments } = await c.env.DB.prepare(sql)
      .bind(incomingPayload.allowed)
      .all();

    // 1. Build dynamic placeholder string: "?, ?, ?"
    const placeholders = mergedAllowed.map(() => "?").join(", ");
    const values = mergedAllowed.map((v: string) => v.split("_")[0]);
    console.log({ values });
    // 2. Prepare and run SQL query
    const query = `
  SELECT DISTINCT artistName 
  FROM segments 
  WHERE artistId IN (${placeholders})
`;

    const { results } = await c.env.DB.prepare(query)
      .bind(...values)
      .all();

    // Extract simple array of names: ['Band A', 'Band B']
    const artistNames = results.map((r: any) => r.artistName);
    console.log({ artistNames, values });
    return c.html(
      "<!doctype html>\n" +
      <ClaimLayout segments={segments} artists={artistNames} />,
    );

    // 5. Render KitaJS component directly into Hono HTML response
    // return c.html(<ClaimPage artists={mergedAllowed} />);
  } catch (e) {
    console.log(e);
    return c.html("<!doctype html>\n" + <div>Error</div>);
  }
};
