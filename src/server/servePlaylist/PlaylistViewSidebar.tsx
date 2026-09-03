import { Sidebar } from "../../components/Sidebar";

export interface PlaylistViewSidebarProps {
  artistLink: string;
  artistName: string;
  pageTitle: string;
  cards: JSX.Element[];
}
export const PlaylistViewSidebar = ({
  artistLink,
  artistName,
  pageTitle,
  cards,
}: PlaylistViewSidebarProps) => (
  <aside class="playlist-sidebar">
    <div id="sidebar-artist" class="sidebar-artist-container">
      {/* Declarative text & attribute bindings */}
      <a
        class="sidebar-artist-button"
        href={`/${artistLink}`}
        data-bind-href="player.currentArtistLink"
        data-bind-text="player.currentArtistName"
      >
        {artistName}
      </a>
    </div>
    <Sidebar cards={cards} playlistName={pageTitle} />
  </aside>
);
