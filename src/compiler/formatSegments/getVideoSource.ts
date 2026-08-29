import { CLOUDFLARE_SOURCE } from "./constants.js";

const getVideoSource = (id: string): string =>
  `${CLOUDFLARE_SOURCE}/${id}/output_1080.m3u8`;

export { getVideoSource };
