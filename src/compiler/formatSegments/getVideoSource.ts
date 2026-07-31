import { CLOUDFLARE_SOURCE } from "./constants.js";

const getVideoSource = (id: string): string =>
  `${CLOUDFLARE_SOURCE}/${id}/output.m3u8`;

export { getVideoSource };
