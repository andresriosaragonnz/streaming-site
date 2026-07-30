import { compilePublicPerformance } from "./compilePublicPerformance.js";

export const compilePublicPerformances = (performances: any): any[] => {
  const performancesIndex = {} as any;
  for (const performance of performances.private) {
    performancesIndex[performance.performance] = {
      key: `${performance.performance}`,
      value: "",
    };
  }
  for (const performance of performances.public) {
    const value = compilePublicPerformance(performance);
    performancesIndex[performance.performance] = {
      key: `${performance.performance}`,
      value,
    };
  }

  return Object.values(performancesIndex);
};
