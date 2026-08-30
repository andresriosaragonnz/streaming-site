import { formatSegments } from "../../formatSegments/index.js";
import { getPerformancesFromSegments } from "../../utils/getPerformancesFromSegments.js";
import { getRandomIndex } from "../../utils/getRandomIndex.js";
import {
  renderPrivateDashboard,
  renderPrivatePerformanceCard,
} from "../../../../templateCache";

const getRandomElements = (arr: any[], n: number) => {
  const safeN = n < arr.length ? n : arr.length;
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, safeN);
};

export const renderPrivateDashboardPage = (segments: any): string => {
  const { formattedSegments, totalDuration } = formatSegments(segments);
  const { formattedArtist, artistId } = formattedSegments[0];
  const performances = getPerformancesFromSegments(formattedSegments);
  const portfolioImages = [] as string[][];

  const gridHtml = performances.private
    .map((performance) => {
      const { segments, images } = performance;
      const publicSegments = segments.filter(
        (seg: any) => (seg.status = "public"),
      ).length;
      const privateSegments = segments.length - publicSegments;
      const random = getRandomElements(images, 8);
      portfolioImages.push(random);
      return renderPrivatePerformanceCard({
        ...performance,
        privateSegments,
        publicSegments,
      });
    })
    .join("");
  const htmlContent = renderPrivateDashboard({
    title: `${formattedArtist}`,
    count: performances.private.length,
    gridHtml,
    heroImage: formattedSegments[getRandomIndex(formattedSegments)].heroImage,
    link: artistId,
    totalDuration,
  });
  return htmlContent;
};
