import { CLOUDFLARE_SOURCE } from "./constants.js";

const getHeroImage = (image: string) => `${CLOUDFLARE_SOURCE}/images/${image}`;

export { getHeroImage };
