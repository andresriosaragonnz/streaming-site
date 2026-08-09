import { compilePrivatePerformance } from "./compilePrivatePerformance.js";

export const compilePrivatePerformances = (performances: any): void => {
  const performancesIndex = [] as any;
  for (const performance of performances.private) {
    const value = compilePrivatePerformance(performance);
    performancesIndex.push({
      key: `private-${performance.performance}`,
      value,
    });
  }

  return performancesIndex;
};
