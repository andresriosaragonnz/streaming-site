import "@kitajs/html";

declare global {
  namespace JSX {
    interface HtmlTag {
      [key: `x-${string}`]: any;
      playsinline?: boolean | string;
      controls?: boolean | string;
      preload?: boolean | string;
    }
  }
}
