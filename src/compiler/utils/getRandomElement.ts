export const getRandomElements = (arr: any[], n: number) => {
  const safeN = n < arr.length ? n : arr.length;
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, safeN);
};
