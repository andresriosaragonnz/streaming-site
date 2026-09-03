import { CLOUDFLARE_SOURCE } from "./constants.js";

const getCardVideoSource = (id: string): string =>
  `${CLOUDFLARE_SOURCE}/${id}/output_480.m3u8`;

export { getCardVideoSource };
