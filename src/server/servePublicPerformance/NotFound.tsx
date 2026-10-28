import { Favicon } from "../../components/Favicon";
import { Menu } from "../../components/Menu";
export const NotFound = () => {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{"Performance not found"}</title>

        <Favicon />

        <link rel="stylesheet" href="/css/review-studio.css" />
        <link rel="stylesheet" href="/css/main.css" />
        <script src="/js/orb.js"></script>
      </head>
      <body>
        <div class="studio-container">
          <div class="meta-title-card">
            <div class="meta-title-card-left">
              <Menu />
            </div>
          </div>
          <h1>Performance not found</h1>
        </div>
      </body>
    </html>
  );
};
