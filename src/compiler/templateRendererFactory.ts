type ExtractTemplateKeys<S extends string> =
  S extends `${string}{${string}{${infer Key}}}${infer Rest}`
    ? TrimKey<Key> | ExtractTemplateKeys<Rest>
    : never;

type TrimKey<K extends string> = K extends ` ${infer Rest}`
  ? TrimKey<Rest>
  : K extends `${infer Rest} `
    ? TrimKey<Rest>
    : K;

export type TemplateProps<S extends string> = Record<
  ExtractTemplateKeys<S>,
  string
>;

export function createRenderer<const S extends string>(htmlTemplate: S) {
  const matches = htmlTemplate.match(/\{\{\s*([\w]+)\s*\}\}/g) || [];
  const keys = Array.from(
    new Set(matches.map((m) => m.replace(/[\{\}\s]/g, ""))),
  );

  return function render(props: TemplateProps<S>): string {
    let result: string = htmlTemplate;
    for (const key of keys) {
      const val = (props as Record<string, any>)[key];
      result = result.split(`{{${key}}}`).join(val != null ? String(val) : "");
    }
    return result;
  };
}
