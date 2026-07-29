import { dateFromString } from "./formatDates.js";
import { getCardImage } from "../utils/getCardImage.js";
import { getRandomIndex } from "../utils/getRandomIndex.js";

const getPerformancesFromSegments = (segments: any) => {
  const performancesIndex = {} as any;
  for (const segment of segments) {
    const {
      artistName,
      venueName,
      eventDate,
      id,
      performance,
      heroImage,
      cardImage,
      formattedDate,
    } = segment;
    const currentPerformance = performancesIndex[performance];
    if (currentPerformance) {
      currentPerformance.cardImages.push(cardImage);
      currentPerformance.heroImages.push(heroImage);
      currentPerformance.segments.push(segment);
    } else {
      performancesIndex[performance] = {
        artistName: encodeURIComponent(artistName),
        link: `${venueName}-${eventDate}`,
        venueName: venueName,
        formattedVenueName: venueName.replaceAll("_", " "),
        eventDate,
        formattedDate,
        images: [id],
        segments: [segment],
        heroImages: [heroImage],
        cardImages: [cardImage],
      };
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

  return Object.values(performances);
};

export { getPerformancesFromSegments };
