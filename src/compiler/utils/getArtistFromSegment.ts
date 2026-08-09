import { getRandomIndex } from "./getRandomIndex.js";

const getArtistFromSegment = (segments: any) => {
  const name = segments[0].artistName;
  const id = segments[0].artistId;
  const imageIndex = getRandomIndex(segments);
  const image = `https://pub-fef6bcaae286450e98785a845f724ff1.r2.dev/images/${segments[imageIndex].id}`;
  return { name, image, id };
};

export { getArtistFromSegment };
