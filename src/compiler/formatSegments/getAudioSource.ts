import { CLOUDFLARE_SOURCE } from "./constants.js";

const getAudioSource = (id: string): string =>
  `${CLOUDFLARE_SOURCE}/${id}/audio.mp3`;

export { getAudioSource };
