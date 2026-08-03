import { CLOUDFLARE_SOURCE } from "./constants.js";
//https://pub-fef6bcaae286450e98785a845f724ff1.r2.dev/T2Sl2e6zz/output.m3u8

const sources = ["T2Sl2e6zz", "yIwsfqcdM", "ayxQFAxzZ", "OqrWnBGJR"];

const getVideoSource = (id: string): string =>
  `${CLOUDFLARE_SOURCE}/${sources[id]}/output.m3u8`;

export { getVideoSource };
