import { Sidebar } from "../../components/Sidebar";

export interface PublicViewSidebarProps {
  artistLink: string;
  artistName: string;
  cards: any;
}

export const PublicViewSidebar = ({ cards }: PublicViewSidebarProps) => (
  <aside class="playlist-sidebar">
    <div id="sidebar-artist" class="sidebar-artist-container"></div>
    <Sidebar cards={cards} />
  </aside>
);
