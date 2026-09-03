import { FeedHero } from "./FeedHero";
import { Menu } from "../../components/Menu";
import { FeedCard } from "./FeedCard";

export interface FeedLayoutProps {
  title?: string;
}

//  count: 1,
export const FeedLayout = ({ updates = [] }: any) => {
  const cards = updates.map((update: any) => {
    const { image, artistName, count, link, heroImage } = update;
    return (
      <FeedCard
        link={link}
        cardImage={image}
        artistName={artistName}
        count={count}
      />
    );
  });
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>My updates</title>
        <link rel="stylesheet" href="/css/main.css" />
      </head>
      <body>
        <div class="menu-container">
          <Menu />
        </div>

        <FeedHero heroImage={updates[0]?.heroImage} />

        <main class="performance-grid">{cards}</main>
        <script type="module" src="/js/feedInit.js"></script>
        <script type="module" src="/js/portfolioApp.js"></script>
      </body>
    </html>
  );
};
