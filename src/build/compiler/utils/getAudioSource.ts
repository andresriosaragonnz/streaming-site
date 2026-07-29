import { CLOUDFLARE_SOURCE } from "./constants.js";

const getAudioSource = (id: string): string =>
  `${CLOUDFLARE_SOURCE}/mp3/${id}.mp3`;

export { getAudioSource };
