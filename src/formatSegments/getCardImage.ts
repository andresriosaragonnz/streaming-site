import { CLOUDFLARE_SOURCE } from "./constants.js";

const getCardImage = (image: string) => `${CLOUDFLARE_SOURCE}/${image}/card`;

export { getCardImage };
