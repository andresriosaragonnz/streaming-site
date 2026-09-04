import { Sidebar } from "../../../components/Sidebar";

export interface PublicViewSidebarProps {
  artistLink: string;
  artistName: string;
  cards: any;
}

export const PublicViewSidebar = ({
  artistLink,
  artistName,
  cards,
}: PublicViewSidebarProps) => (
  <aside class="playlist-sidebar">
    <div id="sidebar-artist" class="sidebar-artist-container">
      <a
        class="sidebar-artist-button"
        id="sidebar-artist-button"
        href={`/${artistLink}`}
      >
        {artistName}
      </a>
    </div>
    <Sidebar cards={cards} />
  </aside>
);
