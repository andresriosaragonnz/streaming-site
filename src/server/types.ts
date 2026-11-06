interface RenderedPage {
  key: string;
  value: string;
}

interface Env {
  STATIC_BUCKET?: R2Bucket;
  PAGE_CACHE?: KVNamespace;
}

type Bindings = {
  DB: D1Database;
};

interface UserPayload {
  /**
   * Fully qualified artist claims in the form `${artistId}_${tokenVersion}`.
   * String values are still accepted at runtime for older cookies.
   */
  allowed: string[];
  v?: number;
  exp?: number; // Expiration timestamp (optional)
}

export type { Env, RenderedPage, Bindings, UserPayload };
