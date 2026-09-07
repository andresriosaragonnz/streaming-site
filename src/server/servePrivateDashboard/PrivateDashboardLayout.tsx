import { formatSegments } from "../../formatSegments";
import { getPerformancesFromSegments } from "../../formatSegments/utils/getPerformancesFromSegments";
import { getRandomElements } from "../../formatSegments/utils/getRandomElement";
import { getRandomIndex } from "../../formatSegments/utils/getRandomIndex";
import { Menu } from "../../components/Menu";
import { PrivateDashboardHero } from "./PrivateDashboardHero";
import { PrivatePerformanceCard } from "./PrivatePerformanceCard";

export const PrivateDashboardLayout = ({ segments = [] }) => {
  const { formattedSegments, totalDuration } = formatSegments(segments);
  const { formattedArtist, artistName, artistLink } = formattedSegments[0];
  const performances = getPerformancesFromSegments(formattedSegments);
  const portfolioImages = [] as string[][];

  const cards = performances.private.map((performance) => {
    const { segments, images } = performance;
    const publicSegments = segments.filter(
      (seg: any) => (seg.status = "public"),
    ).length;
    const privateSegments = segments.length - publicSegments;
    const random = getRandomElements(images, 8);
    portfolioImages.push(random);
    return (
      <PrivatePerformanceCard
        {...performance}
        publicSegments={publicSegments}
        privateSegments={privateSegments}
      />
    );
  });

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Private archive</title>
        <link rel="stylesheet" href="/css/main.css" />
      </head>
      <body>
        <div class="menu-container">
          <Menu />
        </div>
        <PrivateDashboardHero
          heroImage={
            formattedSegments[getRandomIndex(formattedSegments)].heroImage
          }
          title={formattedArtist}
          link={artistName}
          count={performances.private.length}
          totalDuration={totalDuration}
        />
        <main class="performance-grid">{cards}</main>
      </body>
    </html>
  );
};
