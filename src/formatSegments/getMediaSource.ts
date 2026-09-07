import { CLOUDFLARE_SOURCE } from "./constants.js";

const getMediaSource = (id: string) => {
  return {
    heroImage: `${CLOUDFLARE_SOURCE}/${id}`,
    sourceVideo480p: `${CLOUDFLARE_SOURCE}/${id}/output_480.m3u8`,
    cardImage: `${CLOUDFLARE_SOURCE}/${id}/card`,
    sourceVideo1080p: `${CLOUDFLARE_SOURCE}/${id}/output_1080.m3u8`,
    sourceMp3: `${CLOUDFLARE_SOURCE}/${id}/audio.mp3`,
  };
};

export { getMediaSource };
