import fs from "fs";
import { hashNameToId } from "../src/utils/makeId";

const INPUT_FOLDER = "/mnt/big_archive/screenshots";

const makeSegmentObject = () => {
  const currentFiles = fs.readdirSync(INPUT_FOLDER);
  const segments = currentFiles.map((file) => {
    const [artistName, venueName, eventDateRaw] = file
      .split(".jpg")[0]
      .split("-");

    const [eventDate, index] = eventDateRaw.split("_");
    const id = hashNameToId(`${artistName}-${venueName}-${eventDate}_${index}`);

    return {
      id: id,
      artistId: artistName,
      title: `segment_${index}`,
      artistName,
      eventDate,
      venueName,
      index: index,
      startTime: 360,
      duration: 360,
      performance: `${artistName}-${venueName}-${eventDate}`,
      status: "private",
    };
  });
  fs.writeFileSync("./data.json", JSON.stringify(segments));
  console.log(segments);
};

makeSegmentObject();
// npx wrangler r2 object bulk put testsync --dir="/home/andres/code/web/devAssets/images/compressed" --filename-prefix="images/"
