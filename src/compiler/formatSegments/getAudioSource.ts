import { CLOUDFLARE_SOURCE } from "./constants.js";

const sources = ["T2Sl2e6zz", "yIwsfqcdM", "ayxQFAxzZ", "OqrWnBGJR"];

const getAudioSource = (id: string): string =>
  `${CLOUDFLARE_SOURCE}/mp3/${sources[id]}.mp3`;

export { getAudioSource };
