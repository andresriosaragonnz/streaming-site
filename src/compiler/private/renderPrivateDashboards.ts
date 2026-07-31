import { groupPerformancesByArtists } from "../utils/groupPerformancesByArtists";
import { compilePrivateDashboard } from "../compileCache";

const compilePrivateDashboards = (performances: any) => {
  const groupedArtists = groupPerformancesByArtists(performances.private);
  const dashboardsIndex = [] as any;
  for (const artist of groupedArtists) {
    const { artistName } = artist;
    dashboardsIndex.push({
      key: `private-${artistName}`,
      value: compilePrivateDashboard(artist),
    });
  }
  return dashboardsIndex;
};

export { compilePrivateDashboards };
