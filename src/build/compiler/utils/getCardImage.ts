import { CLOUDFLARE_SOURCE } from "./constants.js";

const getCardImage = (image: string) =>
  `${CLOUDFLARE_SOURCE}/images/${image}_card`;

export { getCardImage };
