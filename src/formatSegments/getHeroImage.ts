import { PUBLIC_ASSET_SOURCE } from "./constants.js";

const getHeroImage = (image: string) => `${PUBLIC_ASSET_SOURCE}/${image}`;

export { getHeroImage };
