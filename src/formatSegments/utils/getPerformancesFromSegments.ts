import { getRandomIndex } from "./getRandomIndex.js";
import { formatTime } from "../formatTime.js";

const getPerformancesFromSegmentsStatus = (segments: any) => {
  const performancesIndex = {} as any;
  for (const segment of segments) {
    const {
      artistName,
      eventDate,
      formattedDate,
      heroImage,
      performance,
      venueName,
      status,
      formattedArtist,
      id,
      duration,
    } = segment;
    const initial = {
      artistName: encodeURIComponent(artistName),
      formattedArtist,
      link: `${performance}`,
      venueName: venueName,
      formattedVenueName: venueName.replaceAll("_", " "),
      eventDate,
      formattedDate,
      segments: [segment],
      images: duration > 60 ? [heroImage] : [],
      status,
      performance,
      duration: duration,
    };
    const currentPerformance = performancesIndex[performance];
    if (currentPerformance) {
      currentPerformance.duration += duration;
      if (duration > 60) {
        currentPerformance.images.push(heroImage);
      }
      currentPerformance.segments.push(segment);
    } else {
      performancesIndex[performance] = initial;
    }
  }
  const performances = Object.values(performancesIndex).map(
    (performance: any) => {
      const { images } = performance;
      const randomIndex = getRandomIndex(images);
      const randomIndex2 = getRandomIndex(images);
      performance.cardImage = `${images[randomIndex]}/card`;
      performance.altImage = `${images[randomIndex2]}`;
      performance.duration = formatTime(performance.duration);
      return performance;
    },
  );

  return performances;
};

const getPerformancesFromSegments = (segments: any) => {
  const publicSegments = segments.filter((seg: any) => seg.status === "public");
  const publicSeg = getPerformancesFromSegmentsStatus(publicSegments);
  const privateSeg = getPerformancesFromSegmentsStatus(segments);
  return { public: publicSeg, private: privateSeg };
};

export { getPerformancesFromSegments };
