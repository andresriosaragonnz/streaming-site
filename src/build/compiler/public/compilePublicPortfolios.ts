import { groupPerformancesByArtists } from "../utils/groupPerformancesByArtists";
import { compilePublicPortfolio } from "./compilePublicPortfolio";

const compilePublicPortfolios = (performances: any) => {
  const groupedArtists = groupPerformancesByArtists(performances.public);
  const portfoliosIndex = [] as any;
  for (const artist of groupedArtists) {
    const { artistName } = artist;
    portfoliosIndex.push({
      key: `${artistName}`,
      value: compilePublicPortfolio(artist),
    });
  }
  return portfoliosIndex;
};

export { compilePublicPortfolios };
