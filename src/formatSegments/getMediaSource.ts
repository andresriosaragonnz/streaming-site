import { CLOUDFLARE_SOURCE } from "./constants.js";

export interface MediaSources {
  heroImage: string;
  cardImage: string;
  sourceVideo480p: string;
  sourceVideo1080p: string;
  sourceMp3: string;
  segmentToken: string;
}

export const getMediaSource = (
  id: string,
  videographer: string,
  videographers: any,
): MediaSources => {
  // Single HMAC calculation per segment

  const config = videographers[videographer];
  const { worker, segmentToken } = config;
  return {
    heroImage: `${worker}/${id}/desktop.jpg?token=${segmentToken}`,
    segmentToken,
    cardImage: `${worker}/${id}/card`,
    sourceVideo480p: `${worker}/${id}/output_480.m3u8?token=${segmentToken}`,
    sourceVideo1080p: `${worker}/${id}/output_1080.m3u8?token=${segmentToken}`,
    sourceMp3: `${worker}/${id}/audio.mp3?token=${segmentToken}`,
  };
};

export default getMediaSource;
