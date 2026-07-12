const indexImages = (allImages: string[], param: string) => {
  const result = {} as any;
  const joinBy = {
    performance: (iP: string[]) => `${iP[0]}-${iP[1]}-${iP[2]}`,
    artist: (iP: string[]) => `${iP[0]}`,
    venue: (iP: string[]) => `${iP[1]}`,
    event: (iP: string[]) => `${iP[1]}-${iP[2]}`,
  } as any;

  for (const image of allImages) {
    const splitted = image.split(".")[0].split("-");
    const index = joinBy[param](splitted);
    if (result[index]) {
      result[index].push(image);
    } else {
      result[index] = [image];
    }
  }
  return result;
};

export { indexImages };
