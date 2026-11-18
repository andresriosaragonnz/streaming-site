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
  const { segmentToken } = config;
  console.log({});
  const worker = "http://192.168.1.189:8787";
  return {
    heroImage: `${worker}/${id}`,
    segmentToken,
    cardImage: `${worker}/${id}/card`,
    sourceVideo480p: `${worker}/${id}/output_480.m3u8?token=${segmentToken}`,
    sourceVideo1080p: `${worker}/${id}/output_1080.m3u8?token=${segmentToken}`,
    sourceMp3: `${worker}/${id}/audio.mp3?token=${segmentToken}`,
  };
};

export default getMediaSource;
