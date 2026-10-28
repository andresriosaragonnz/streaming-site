import { formatSegments } from "../../formatSegments";
import { getPerformancesFromSegments } from "../../formatSegments/utils/getPerformancesFromSegments";
import { getRandomElements } from "../../formatSegments/utils/getRandomElement";
import { getRandomIndex } from "../../formatSegments/utils/getRandomIndex";
import { Menu } from "../../components/Menu";
import { ClaimHero } from "./ClaimHero";
import { PrivatePerformanceCard } from "../servePrivateDashboard/PrivatePerformanceCard";

export const ClaimLayout = ({ segments = [], artists }: any) => {
  const { formattedSegments, totalDuration } = formatSegments(segments);
  const { formattedArtist, artistName } = formattedSegments[0];
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
  const jsonArtists = JSON.stringify(artists);

  const scriptCode = `
    try {
      const rawJson = document.getElementById("allowed-bands-data").textContent;
      const bands = JSON.parse(rawJson);
      if (Array.isArray(bands)) {
        const currentAllowed = localStorage.getItem("allowed_bands")
          ? JSON.parse(localStorage.getItem("allowed_bands"))
          : [];
        const newAllowed = Array.from(new Set([...currentAllowed, ...bands]));
       localStorage.setItem("allowed_bands", JSON.stringify(newAllowed));
      }
    } catch (e) {
      console.error("Failed to save permissions to localStorage", e);
    }
  `;

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
        <ClaimHero
          heroImage={
            formattedSegments[getRandomIndex(formattedSegments)].heroImage
          }
          title={formattedArtist}
          link={artistName}
          count={performances.private.length}
          totalDuration={totalDuration}
        />

        <main class="performance-grid">{cards}</main>
        <script type="application/json" id="allowed-bands-data">
          {jsonArtists}
        </script>

        <script>{scriptCode}</script>
      </body>
    </html>
  );
};
