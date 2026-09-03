import { Menu } from "../../components/Menu.js";

interface ClaimPageProps {
  artists: string[];
}

export function ClaimPage({ artists }: ClaimPageProps) {
  const jsonArtists = JSON.stringify(artists);

  const scriptCode = `
    try {
      const rawJson = document.getElementById("allowed-bands-data").textContent;
      const bands = JSON.parse(rawJson);
      if (Array.isArray(bands)) {
        const currentAllowed = localStorage.getItem("allowed_bands")
          ? JSON.parse(localStorage.getItem("allowed_bands"))
          : [];
        const newAllowed = Array.from(new Set([...currentAllowed, ...bands]));
        localStorage.setItem("allowed_bands", JSON.stringify(newAllowed));
      }
    } catch (e) {
      console.error("Failed to save permissions to localStorage", e);
    }
  `;

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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>My Authorized artists</title>
        <link rel="stylesheet" href="/css/main.css" />
      </head>
      <body>
        <div class="menu-container">
          <Menu />
        </div>

        <main class="performance-grid">
          <ul>
            {artists.map((artist) => (
              <li>{artist.replaceAll("_", " ")}</li>
            ))}
          </ul>
        </main>

        {/* KitaJS renders string children safely directly inside script tags */}
        <script type="application/json" id="allowed-bands-data">
          {jsonArtists}
        </script>

        <script type="module" src="/js/publicApp.js" />

        <script>{scriptCode}</script>
      </body>
    </html>
  );
}
