import type { Env, RenderedPage } from "./types";

export const savePagesToTarget = async (env: Env, pages: RenderedPage[]) => {
  if (pages.length === 0) return;
  console.log({ env });

  const bucket = env.STATIC_BUCKET as any;
  const isDev = process.env.NODE_ENV === "development";
  console.log({ isDev });
  const promise = isDev
    ? ({ key, value }: { key: string; value: string }) =>
        env.PAGE_CACHE!.put(key, value)
    : ({ key, value }: { key: string; value: string }) =>
        bucket.put(key, value, {
          httpMetadata: {
            contentType: "text/html; charset=utf-8",
          },
        });
  const r2Promises = pages.map(promise);
  await Promise.all(r2Promises);
};
