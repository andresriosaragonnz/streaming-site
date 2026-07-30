import { getRandomIndex } from "./getRandomIndex.js";

const groupPerformancesByArtists = (performances: any) => {
  const artistIndex = {} as any;
  for (const performance of performances) {
    const { artistName, cardImage, heroImage, id } = performance;
    const currentArtist = artistIndex[artistName];
    if (currentArtist) {
      currentArtist.cardImages.push(cardImage);
      currentArtist.heroImages.push(heroImage);
      currentArtist.performances.push(performance);
    } else {
      artistIndex[artistName] = {
        artistName: encodeURIComponent(artistName),
        link: encodeURIComponent(artistName),
        performances: [performance],
        heroImages: [heroImage],
        cardImages: [cardImage],
      };
    }
  }
  const artists = Object.values(artistIndex).map((artist: any) => {
    const { heroImages, cardImages } = artist;
    const randomIndex = getRandomIndex(heroImages);
    artist.heroImage = heroImages[randomIndex];
    artist.cardImage = cardImages[randomIndex];
    return artist;
  });
  return artists;
};

export { groupPerformancesByArtists };
