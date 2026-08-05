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
  allowed: string[]; // e.g., ['queen', 'freddie-mercury']
  exp?: number; // Expiration timestamp (optional)
}

export type { Env, RenderedPage, Bindings, UserPayload };
