import { getRandomIndex } from "../utils/getRandomIndex.js";

const getPerformancesFromSegmentsStatus = (segments: any) => {
  const performancesIndex = {} as any;
  for (const segment of segments) {
    const {
      artistName,
      cardImage,
      eventDate,
      formattedDate,
      heroImage,
      id,
      performance,
      venueName,
      status,
      formattedArtist,
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
      heroImages: [heroImage],
      cardImages: [cardImage],
      status,
      performance,
    };
    const currentPerformance = performancesIndex[performance];
    if (currentPerformance) {
      currentPerformance.cardImages.push(cardImage);
      currentPerformance.heroImages.push(heroImage);
      currentPerformance.segments.push(segment);
    } else {
      performancesIndex[performance] = initial;
    }
  }
  const performances = Object.values(performancesIndex).map(
    (performance: any) => {
      const { heroImages, cardImages } = performance;
      const randomIndex = getRandomIndex(heroImages);
      performance.heroImage = heroImages[randomIndex];
      performance.cardImage = cardImages[randomIndex];
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
